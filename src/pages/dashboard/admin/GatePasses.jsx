import { useMemo, useState } from "react";
import { Card, Pill, Button, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import { QrIcon, CheckIcon, XIcon } from "../../../components/dashboard/admin/icons";
import { allGatePasses, blocks } from "../../../data/adminMock";

const blockFilters = ["All Blocks", ...blocks.map((b) => b.name)];
const statusFilters = ["All Statuses", "Pending", "Approved", "Rejected", "Completed"];

export default function GatePasses() {
  const [passes, setPasses] = useState(allGatePasses);
  const [blockFilter, setBlockFilter] = useState("All Blocks");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return passes.filter((p) => {
      const blockOk = blockFilter === "All Blocks" || p.block === blockFilter;
      const statusOk = statusFilter === "All Statuses" || p.status === statusFilter;
      return blockOk && statusOk;
    });
  }, [passes, blockFilter, statusFilter]);

  const pendingCount = passes.filter((p) => p.status === "Pending").length;
  const outCount = passes.filter((p) => p.tripState === "Out").length;

  function decide(id, status) {
    setPasses((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <QrIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Gate pass management</p>
            <p className="text-sm text-slate-500">Every gate pass request institute-wide — review, override, and track entry/exit.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<QrIcon />} label="Pending requests" value={pendingCount} sub="Awaiting warden or admin decision" tone={pendingCount > 0 ? "amber" : "teal"} />
        <StatCard icon={<CheckIcon />} label="Currently out" value={outCount} sub="Students off-campus on a pass" tone="navy" />
        <StatCard icon={<QrIcon />} label="Total this term" value={passes.length} sub="Gate passes recorded" tone="teal" />
      </div>

      <Card title="All gate passes">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <select className={`${inputCls} sm:w-48`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
            {blockFilters.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No gate passes match these filters.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {filtered.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{p.student}</p>
                    <span className="text-xs text-slate-400">· {p.block}, {p.room}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{p.type} — {p.reason}</p>
                  <p className="mt-1 text-xs text-slate-300">{p.from} → {p.to} · Trip: {p.tripState}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill tone={p.status}>{p.status}</Pill>
                  {p.status === "Pending" && (
                    <>
                      <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => decide(p.id, "Approved")}>
                        <CheckIcon /> Approve
                      </Button>
                      <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => decide(p.id, "Rejected")}>
                        <XIcon /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
