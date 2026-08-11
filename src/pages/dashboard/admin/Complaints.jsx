import { useMemo, useState } from "react";
import { Card, Pill, inputCls } from "../../../components/dashboard/student/ui";
import { WrenchIcon } from "../../../components/dashboard/admin/icons";
import { allBlockComplaints, blocks } from "../../../data/adminMock";

const blockFilters = ["All Blocks", ...blocks.map((b) => b.name)];
const statusFilters = ["All Statuses", "Open", "In Progress", "Resolved"];

export default function Complaints() {
  const [blockFilter, setBlockFilter] = useState("All Blocks");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return allBlockComplaints.filter((c) => {
      const blockOk = blockFilter === "All Blocks" || c.block === blockFilter;
      const statusOk = statusFilter === "All Statuses" || c.status === statusFilter;
      return blockOk && statusOk;
    });
  }, [blockFilter, statusFilter]);

  const openCount = allBlockComplaints.filter((c) => c.status === "Open").length;
  const inProgressCount = allBlockComplaints.filter((c) => c.status === "In Progress").length;
  const resolvedCount = allBlockComplaints.filter((c) => c.status === "Resolved").length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
              <WrenchIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">All complaints</p>
              <p className="text-sm text-slate-500">Every complaint filed institute-wide, for escalation and oversight.</p>
            </div>
          </div>
          <div className="flex gap-3 text-xs text-slate-500">
            <span><span className="font-semibold text-ink">{openCount}</span> open</span>
            <span><span className="font-semibold text-ink">{inProgressCount}</span> in progress</span>
            <span><span className="font-semibold text-ink">{resolvedCount}</span> resolved</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <select className={`${inputCls} sm:w-48`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
            {blockFilters.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No complaints match these filters.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {filtered.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{c.title}</p>
                    <Pill tone={c.priority}>{c.priority}</Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{c.student} · {c.block}, {c.room} · {c.category}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {c.date} {c.assignedTo && `· Assigned to ${c.assignedTo}`}
                  </p>
                </div>
                <Pill tone={c.status}>{c.status}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
