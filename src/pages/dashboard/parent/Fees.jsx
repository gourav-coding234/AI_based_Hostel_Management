import { Card, ProgressBar, EmptyState } from "../../../components/dashboard/student/ui";
import { WalletIcon } from "../../../components/dashboard/parent/icons";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import SampleDataBadge from "../../../components/dashboard/parent/SampleDataBadge";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { demoTotalFee, demoFeePayments } from "../../../data/parentDemoFallback";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

export default function ParentFees() {
  const linked = useLinkedStudent();
  const { studentUser, studentRecord, linkedStudentId } = linked;
  const fees = useStudentCollection("fees", linkedStudentId, { orderByField: "date" });

  const status = <LinkedStudentStatus {...linked} />;
  if (status) return status;

  const usingSample = !studentRecord?.totalFee && fees.items.length === 0;
  const payments = fees.items.length ? fees.items : usingSample ? demoFeePayments : fees.items;
  const totalFee = studentRecord?.totalFee || (usingSample ? demoTotalFee : 0);
  const paid = payments.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const remaining = Math.max(totalFee - paid, 0);
  const pct = totalFee ? Math.round((paid / totalFee) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {usingSample && (
        <div className="flex items-center gap-2">
          <SampleDataBadge />
          <p className="text-xs text-slate-400">The fees office hasn't posted real records yet — showing an example of what this will look like.</p>
        </div>
      )}

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
          </Card>
        </div>
      )}

      <Card title="Payment history">
        {payments.length === 0 ? (
          <EmptyState icon={<WalletIcon />} title="No payments recorded yet" description="Payments your child's fees office logs will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Mode</th>
                  <th className="pb-2 font-medium">Receipt</th>
                  <th className="pb-2 pr-0 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 text-slate-500">{p.date}</td>
                    <td className="py-2.5 font-medium text-ink">{p.label}</td>
                    <td className="py-2.5 text-slate-500">{p.mode}</td>
                    <td className="py-2.5 text-slate-400">{p.receipt}</td>
                    <td className="py-2.5 pr-0 text-right font-semibold text-ink">{inr(p.amount)}</td>
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
