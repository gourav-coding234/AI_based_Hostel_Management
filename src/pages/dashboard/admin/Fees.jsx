import { Card, Pill, ProgressBar, StatCard } from "../../../components/dashboard/student/ui";
import { WalletIcon, AlertIcon } from "../../../components/dashboard/admin/icons";
import { feeOverviewByBlock, feeDefaultersTop } from "../../../data/adminMock";

function inr(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function Fees() {
  const totalDue = feeOverviewByBlock.reduce((sum, f) => sum + f.totalDue, 0);
  const totalCollected = feeOverviewByBlock.reduce((sum, f) => sum + f.collected, 0);
  const collectionPct = Math.round((totalCollected / totalDue) * 100);
  const totalStudents = feeOverviewByBlock.reduce((sum, f) => sum + f.students, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<WalletIcon />} label="Total collected" value={inr(totalCollected)} sub={`of ${inr(totalDue)} due`} tone="amber" />
        <StatCard icon={<WalletIcon />} label="Collection rate" value={`${collectionPct}%`} sub={`Across ${totalStudents} students`} tone="teal" />
        <StatCard icon={<AlertIcon />} label="Top defaulters" value={feeDefaultersTop.length} sub="Need a follow-up nudge" tone="rose" />
      </div>

      <Card title="Collection by block">
        <div className="flex flex-col gap-5">
          {feeOverviewByBlock.map((f) => {
            const pct = Math.round((f.collected / f.totalDue) * 100);
            return (
              <div key={f.block}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{f.block}</span>
                  <span className="text-slate-500">{inr(f.collected)} / {inr(f.totalDue)} · {pct}%</span>
                </div>
                <ProgressBar value={f.collected} max={f.totalDue} tone={pct < 80 ? "rose" : "teal"} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Top fee defaulters">
        <ul className="flex flex-col divide-y divide-slate-100">
          {feeDefaultersTop.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink">{d.name}</p>
                <p className="text-xs text-slate-400">{d.block} · {d.room}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-rose-600">{inr(d.due)}</p>
                <p className="text-xs text-slate-400">Due {d.dueDate}</p>
              </div>
              <Pill tone="Overdue">Overdue</Pill>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
