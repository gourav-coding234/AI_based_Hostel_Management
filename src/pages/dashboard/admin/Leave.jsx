import { useMemo, useState } from "react";
import { Card, Pill, Button, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { CalendarClockIcon, CheckIcon, XIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";
import { updateDocument } from "../../../firebase/firestore";

const statusFilters = ["All Statuses", "Pending", "Approved", "Rejected"];

export default function Leave() {
  const { data, loading } = useCollections({
    requests: { name: "leaveRequests", options: { orderByField: "from" } },
    blocks: { name: "blocks" },
  });
  const requests = data.requests;
  const blockFilters = ["All Blocks", ...data.blocks.map((b) => b.name)];

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

  async function decide(id, status) {
    try {
      await updateDocument("leaveRequests", id, { status, parentNotified: status === "Approved" });
    } catch (err) {
      console.error("Failed to update leave request:", err);
    }
  }

  const columns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (r) => (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{r.studentName}</span>
            <Pill tone="General">{r.type}</Pill>
          </div>
          <p className="text-xs text-slate-400">{r.block || "—"}, {r.room || "—"}</p>
        </>
      ),
    },
    { key: "reason", label: "Reason" },
    { key: "from", label: "Window", sortable: true, render: (r) => `${r.from} → ${r.to}` },
    { key: "parentNotified", label: "Parent", render: (r) => (r.parentNotified ? "Notified" : "Not notified") },
    {
      key: "status",
      label: "Status / action",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Pill tone={r.status}>{r.status}</Pill>
          {r.status === "Pending" && (
            <>
              <Button variant="outline" className="px-2.5 py-1 text-xs" onClick={() => decide(r.id, "Approved")}>
                <CheckIcon />
              </Button>
              <Button variant="danger" className="px-2.5 py-1 text-xs" onClick={() => decide(r.id, "Rejected")}>
                <XIcon />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

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

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          searchKeys={["studentName", "reason", "block", "room"]}
          searchPlaceholder="Search leave requests…"
          emptyTitle="No leave requests yet"
          emptyDescription="Leave applications submitted by students will show up here."
          emptyIcon={<CalendarClockIcon />}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
