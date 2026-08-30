import { useMemo, useState } from "react";
import { Card, Pill, Button, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import { CalendarClockIcon, CheckIcon, XIcon } from "../../../components/dashboard/admin/icons";
import { leaveRequests, blocks } from "../../../data/adminMock";

const blockFilters = ["All Blocks", ...blocks.map((b) => b.name)];
const statusFilters = ["All Statuses", "Pending", "Approved", "Rejected"];

export default function Leave() {
  const [requests, setRequests] = useState(leaveRequests);
  const [blockFilter, setBlockFilter] = useState("All Blocks");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const blockOk = blockFilter === "All Blocks" || r.block === blockFilter;
      const statusOk = statusFilter === "All Statuses" || r.status === statusFilter;
      return blockOk && statusOk;
    });
  }, [requests, blockFilter, statusFilter]);

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;

  function decide(id, status) {
    setRequests((list) =>
      list.map((r) => (r.id === id ? { ...r, status, parentNotified: status === "Approved" ? true : r.parentNotified } : r))
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <CalendarClockIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Leave management</p>
            <p className="text-sm text-slate-500">Institute-wide leave applications, approvals, and parent notification status.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<CalendarClockIcon />} label="Pending approval" value={pendingCount} sub="Awaiting a decision" tone={pendingCount > 0 ? "amber" : "teal"} />
        <StatCard icon={<CheckIcon />} label="Approved" value={approvedCount} sub="This term" tone="teal" />
        <StatCard icon={<CalendarClockIcon />} label="Total requests" value={requests.length} sub="Logged institute-wide" tone="navy" />
      </div>

      <Card title="Leave requests">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <select className={`${inputCls} sm:w-48`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
            {blockFilters.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No leave requests match these filters.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {filtered.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{r.student}</p>
                    <span className="text-xs text-slate-400">· {r.block}, {r.room}</span>
                    <Pill tone="General">{r.type}</Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {r.from} → {r.to} · Parent {r.parentNotified ? "notified" : "not notified"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill tone={r.status}>{r.status}</Pill>
                  {r.status === "Pending" && (
                    <>
                      <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => decide(r.id, "Approved")}>
                        <CheckIcon /> Approve
                      </Button>
                      <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => decide(r.id, "Rejected")}>
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
