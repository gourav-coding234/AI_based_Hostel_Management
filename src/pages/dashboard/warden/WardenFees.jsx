import { useMemo, useState } from "react";
import { Card, Pill, Button, ProgressBar } from "../../../components/dashboard/student/ui";
import { WalletIcon } from "../../../components/dashboard/warden/icons";
import { studentFees, feeCollectionStats } from "../../../data/wardenMock";

function inr(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const filters = ["All", "Paid", "Partial", "Overdue"];

export default function WardenFees() {
  const [filter, setFilter] = useState("All");
  const [reminded, setReminded] = useState([]);

  const filtered = useMemo(
    () => (filter === "All" ? studentFees : studentFees.filter((s) => s.status === filter)),
    [filter]
  );

  const collectionPct = Math.round((feeCollectionStats.totalCollected / feeCollectionStats.totalDue) * 100);
  const overdueCount = studentFees.filter((s) => s.status === "Overdue").length;
  const partialCount = studentFees.filter((s) => s.status === "Partial").length;

  function sendReminder(id) {
    setReminded((list) => [...list, id]);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
            <WalletIcon />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-slate-500">Fee collection across the hostel</p>
              <p className="font-display text-lg font-semibold text-ink">{collectionPct}%</p>
            </div>
            <div className="mt-3">
              <ProgressBar value={feeCollectionStats.totalCollected} max={feeCollectionStats.totalDue} tone="amber" />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>{inr(feeCollectionStats.totalCollected)} collected</span>
              <span>{inr(feeCollectionStats.totalDue - feeCollectionStats.totalCollected)} pending</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fully paid</p>
          <p className="mt-2 font-display text-2xl font-semibold text-teal-600">
            {studentFees.filter((s) => s.status === "Paid").length}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Partial payments</p>
          <p className="mt-2 font-display text-2xl font-semibold text-amber-600">{partialCount}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overdue / defaulters</p>
          <p className="mt-2 font-display text-2xl font-semibold text-rose-600">{overdueCount}</p>
        </Card>
      </div>

      <Card
        title="Student fee status"
        action={
          <div className="flex gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f ? "bg-navy-950 text-white" : "border border-slate-200 text-slate-500"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Student</th>
                <th className="pb-2 font-medium">Room</th>
                <th className="pb-2 font-medium">Paid / Total</th>
                <th className="pb-2 font-medium">Due date</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 pr-0 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 font-medium text-ink">{s.name}</td>
                  <td className="py-2.5 text-slate-500">{s.room}</td>
                  <td className="py-2.5 text-slate-500">{inr(s.paid)} / {inr(s.total)}</td>
                  <td className="py-2.5 text-slate-500">{s.dueDate}</td>
                  <td className="py-2.5"><Pill tone={s.status}>{s.status}</Pill></td>
                  <td className="py-2.5 pr-0 text-right">
                    {s.status === "Paid" ? (
                      <span className="text-xs text-slate-300">—</span>
                    ) : reminded.includes(s.id) ? (
                      <span className="text-xs font-medium text-teal-600">Reminder sent</span>
                    ) : (
                      <Button variant="outline" className="px-3 py-1 text-xs" onClick={() => sendReminder(s.id)}>
                        Send reminder
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
