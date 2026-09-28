import { useMemo, useState } from "react";
import { Card, Pill, Button, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { CalendarClockIcon, CheckIcon, DownloadIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";
import { downloadTextFile } from "../../../utils/csv";

function toCsv(headers, rows) {
  const lines = [headers.map((h) => h.label).join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(h.value(row) ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

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

  const leaveCsvHeaders = [
    { label: "Student", value: (r) => r.studentName },
    { label: "Block", value: (r) => r.block },
    { label: "Room", value: (r) => r.room },
    { label: "Type", value: (r) => r.type },
    { label: "Reason", value: (r) => r.reason },
    { label: "From", value: (r) => r.from },
    { label: "To", value: (r) => r.to },
    { label: "Parent Notification", value: (r) => (r.parentNotified ? "Notified" : "Not notified") },
    { label: "Status", value: (r) => r.status },
  ];

  function downloadLeaveRequests() {
    downloadTextFile(toCsv(leaveCsvHeaders, filtered), "leave-requests.csv");
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
      label: "Status",
      render: (r) => <Pill tone={r.status}>{r.status}</Pill>,
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
            <p className="text-sm text-slate-500">Institute-wide leave applications, approval status, and parent notification — view and export.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<CalendarClockIcon />} label="Pending approval" value={pendingCount} sub="Awaiting a decision" tone={pendingCount > 0 ? "amber" : "teal"} />
        <StatCard icon={<CheckIcon />} label="Approved" value={approvedCount} sub="This term" tone="teal" />
        <StatCard icon={<CalendarClockIcon />} label="Total requests" value={requests.length} sub="Logged institute-wide" tone="navy" />
      </div>

      <Card title="Leave requests">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select className={`${inputCls} sm:w-48`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
              {blockFilters.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button variant="outline" onClick={downloadLeaveRequests} disabled={filtered.length === 0}>
            <DownloadIcon /> Download CSV
          </Button>
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
