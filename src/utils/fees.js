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
