import { useMemo, useState } from "react";
import { Card, Pill, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import { EyeIcon, UsersIcon, QrIcon } from "../../../components/dashboard/admin/icons";
import { allVisitors, blocks } from "../../../data/adminMock";

const blockFilters = ["All Blocks", ...blocks.map((b) => b.name)];
const statusFilters = ["All Statuses", "On premises", "Checked out"];

export default function Visitors() {
  const [blockFilter, setBlockFilter] = useState("All Blocks");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return allVisitors.filter((v) => {
      const blockOk = blockFilter === "All Blocks" || v.block === blockFilter;
      const statusOk = statusFilter === "All Statuses" || v.status === statusFilter;
      return blockOk && statusOk;
    });
  }, [blockFilter, statusFilter]);

  const onPremises = allVisitors.filter((v) => v.status === "On premises").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <EyeIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Visitor management</p>
            <p className="text-sm text-slate-500">Institute-wide visitor registrations, QR passes, and entry/exit history.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<UsersIcon />} label="On premises now" value={onPremises} sub="Across all blocks" tone={onPremises > 0 ? "amber" : "teal"} />
        <StatCard icon={<EyeIcon />} label="Logged today" value={allVisitors.length} sub="Visitor check-ins recorded" tone="navy" />
        <StatCard icon={<QrIcon />} label="QR passes issued" value={allVisitors.length} sub="One per registered visitor" tone="teal" />
      </div>

      <Card title="Visitor log">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <select className={`${inputCls} sm:w-48`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
            {blockFilters.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No visitors match these filters.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {filtered.map((v) => (
              <li key={v.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{v.name}</p>
                    <span className="text-xs text-slate-400">· {v.block}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{v.purpose}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {v.idProof} · In: {v.checkIn}{v.checkOut ? ` · Out: ${v.checkOut}` : ""}
                  </p>
                </div>
                <Pill tone={v.status === "On premises" ? "Pending" : "Resolved"}>{v.status}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
