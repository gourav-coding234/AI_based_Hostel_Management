import { Card, Pill, ProgressBar } from "../../../components/dashboard/student/ui";
import { WalletIcon } from "../../../components/dashboard/student/icons";
import { feeSummary, feePayments, feeNotifications } from "../../../data/studentMock";

function inr(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function Fees() {
  const remaining = feeSummary.total - feeSummary.paid;
  const pct = Math.round((feeSummary.paid / feeSummary.total) * 100);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
            <WalletIcon />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-slate-500">Total hostel & mess fee</p>
              <p className="font-display text-lg font-semibold text-ink">{inr(feeSummary.total)}</p>
            </div>
            <div className="mt-3">
              <ProgressBar value={feeSummary.paid} max={feeSummary.total} tone={remaining > 0 ? "amber" : "teal"} />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>{pct}% paid</span>
              <span>{inr(feeSummary.paid)} paid · {inr(remaining)} remaining</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total fee</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">{inr(feeSummary.total)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount paid</p>
          <p className="mt-2 font-display text-2xl font-semibold text-teal-600">{inr(feeSummary.paid)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Remaining</p>
          <p className="mt-2 font-display text-2xl font-semibold text-amber-600">{inr(remaining)}</p>
          <p className="mt-1 text-xs text-slate-400">Due by {feeSummary.dueDate}</p>
        </Card>
      </div>

      <Card title="Payment history">
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
              {feePayments.map((p) => (
                <tr key={p.receipt}>
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
      </Card>

      <Card title="Notifications from the warden">
        <ul className="flex flex-col divide-y divide-slate-100">
          {feeNotifications.map((n, i) => (
            <li key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm text-ink">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{n.from} · {n.date}</p>
              </div>
              {i === 0 && <Pill tone="Pending">New</Pill>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
