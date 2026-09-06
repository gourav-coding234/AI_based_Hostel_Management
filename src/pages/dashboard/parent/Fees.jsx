import { Card, ProgressBar, EmptyState, Pill } from "../../../components/dashboard/student/ui";
import { WalletIcon } from "../../../components/dashboard/parent/icons";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";
import { useStudentCollection } from "../../../hooks/useStudentCollection";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

export default function ParentFees() {
  const linked = useLinkedStudent();
  const { studentUser, linkedStudentId } = linked;
  // Fee records are one document per billing period, with `total`/`paid`
  // set directly on each doc — matching the admin/warden Fees pages and
  // the CSV import schema, not a separate list of payment line-items.
  const fees = useStudentCollection("fees", linkedStudentId, { orderByField: "dueDate" });

  const status = <LinkedStudentStatus {...linked} />;
  if (status) return status;

  const records = fees.items;
  const totalFee = records.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const paid = records.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const remaining = Math.max(totalFee - paid, 0);
  const pct = totalFee ? Math.round((paid / totalFee) * 100) : 0;
  const nextDue = records.find((f) => (Number(f.total) || 0) > (Number(f.paid) || 0));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
            <WalletIcon />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-slate-500">{studentUser?.name || "Your child"}'s hostel & mess fee</p>
              <p className="font-display text-lg font-semibold text-ink">{totalFee ? inr(totalFee) : "—"}</p>
            </div>
            {totalFee ? (
              <>
                <div className="mt-3">
                  <ProgressBar value={paid} max={totalFee} tone={remaining > 0 ? "amber" : "teal"} />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                  <span>{pct}% paid</span>
                  <span>{inr(paid)} paid · {inr(remaining)} remaining</span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No fee amount has been posted by the office yet.</p>
            )}
          </div>
        </div>
      </Card>

      {totalFee > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total fee</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">{inr(totalFee)}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount paid</p>
            <p className="mt-2 font-display text-2xl font-semibold text-teal-600">{inr(paid)}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Remaining</p>
            <p className="mt-2 font-display text-2xl font-semibold text-amber-600">{inr(remaining)}</p>
            {nextDue?.dueDate && <p className="mt-1 text-xs text-slate-400">Due by {nextDue.dueDate}</p>}
          </Card>
        </div>
      )}

      <Card title="Fee records">
        {records.length === 0 ? (
          <EmptyState icon={<WalletIcon />} title="No fee records yet" description="Fee periods your child's fees office posts will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Due date</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Paid</th>
                  <th className="pb-2 font-medium">Remaining</th>
                  <th className="pb-2 pr-0 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((f) => (
                  <tr key={f.id}>
                    <td className="py-2.5 text-slate-500">{f.dueDate || "—"}</td>
                    <td className="py-2.5 font-medium text-ink">{inr(f.total)}</td>
                    <td className="py-2.5 text-teal-700">{inr(f.paid)}</td>
                    <td className="py-2.5 text-amber-700">{inr(Math.max((Number(f.total) || 0) - (Number(f.paid) || 0), 0))}</td>
                    <td className="py-2.5 pr-0 text-right"><Pill tone={f.status}>{f.status || "Pending"}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
