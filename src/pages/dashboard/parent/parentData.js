import { computeFeeStatus } from "../../../utils/fees";

export function inr(n) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}

/** Firestore Timestamp | ISO string | Date -> "12 Mar 2026" (or "" if unusable). */
export function formatDate(value) {
  if (!value) return "";
  const d = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// The shared Pill has no "Paid" colour; reuse the existing green ("Completed")
// so a cleared fee reads green like every other finished state.
export const feeTone = (status) => (status === "Paid" ? "Completed" : status);

/**
 * Per-record fee figures. Pending is always total - paid, and status always
 * comes from the shared computeFeeStatus() — never the stored `status`
 * field, which can go stale once a due date passes.
 */
export function feeRow(f) {
  const total = Math.max(Number(f.total) || 0, 0);
  const paid = Math.max(Number(f.paid) || 0, 0);
  return { total, paid, pending: Math.max(total - paid, 0), status: computeFeeStatus({ total, paid, dueDate: f.dueDate }) };
}

/**
 * Whole-child fee summary across every fee record. The overall status is
 * computeFeeStatus() over the totals, using the earliest due date among
 * records that still owe money — so one overdue period makes the whole
 * summary "Overdue", matching how Student/Warden/Admin read a single record.
 */
export function summarizeChildFees(records) {
  const rows = records.map(feeRow);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const paid = rows.reduce((s, r) => s + r.paid, 0);
  const owing = records.filter((f, i) => rows[i].pending > 0 && f.dueDate).map((f) => f.dueDate).sort();
  const nextDue = owing[0] || "";
  return {
    total,
    paid,
    pending: Math.max(total - paid, 0),
    nextDue,
    status: records.length ? computeFeeStatus({ total, paid, dueDate: nextDue }) : "",
  };
}

/**
 * Turns a `parentNotifications` doc into the row shape the notice list
 * uses. Keeps the raw doc's fee/leave details so the UI can show the amount
 * due, due date and where to go next.
 */
export function notificationToNotice(m) {
  return {
    id: `pn-${m.id}`,
    notificationId: m.id,
    personal: true,
    read: m.read === true,
    type: m.type || "",
    title: m.title,
    body: m.message,
    priority: m.priority || "General",
    postedBy: `${m.createdByName || "Warden"} (Warden)`,
    date: m.date || "",
    amountDue: m.amountDue,
    dueDate: m.dueDate,
  };
}
