/**
 * Supports both fee-invoice records (total/paid) and payment-history records
 * (amount). This keeps old imported data and newer payment rows usable from
 * the same student/parent screens.
 */
export function summarizeFees(records = [], profile = {}) {
  const hasInvoiceRows = records.some((f) => f.total !== undefined || f.paid !== undefined);
  const total = hasInvoiceRows
    ? records.reduce((sum, f) => sum + Math.max(Number(f.total) || 0, 0), 0)
    : Math.max(Number(profile?.totalFee) || 0, 0);
  const paid = hasInvoiceRows
    ? records.reduce((sum, f) => sum + Math.max(Number(f.paid) || 0, 0), 0)
    : records.reduce((sum, f) => sum + Math.max(Number(f.amount) || 0, 0), 0);

  return { total, paid, remaining: Math.max(total - paid, 0) };
}

export function paymentAmount(record) {
  if (record?.amount !== undefined) return Number(record.amount) || 0;
  return Number(record?.paid) || 0;
}

/**
 * Single source of truth for a fee record's status, so Admin, Warden,
 * Student and Parent screens all agree on what "Overdue" etc. means
 * instead of trusting a manually-entered `status` field that can go
 * stale the moment a due date passes.
 *
 * Precedence: Paid (outstanding cleared) > Overdue (something's owed and
 * the due date has passed) > Partial (something's been paid, not yet
 * due) > Pending (nothing paid yet, not yet due).
 */
export function computeFeeStatus({ total, paid, dueDate } = {}) {
  const totalAmt = Math.max(Number(total) || 0, 0);
  const paidAmt = Math.max(Number(paid) || 0, 0);
  const outstanding = Math.max(totalAmt - paidAmt, 0);

  if (outstanding <= 0) return "Paid";

  const isPastDue = !!dueDate && new Date(dueDate) < new Date();
  if (isPastDue) return "Overdue";
  if (paidAmt > 0) return "Partial";
  return "Pending";
}
