import { useMemo, useState } from "react";
import { Card, Pill, Button, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { CalendarClockIcon, CheckIcon, XIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { updateDocument } from "../../../firebase/firestore";

const statusFilters = ["All Statuses", "Pending", "Approved", "Rejected"];

export default function Leave() {
  const requestsQuery = useCollection("leaveRequests", { orderByField: "from" });
  const requests = requestsQuery.data;
  const wingFilters = ["All Wings", ...Array.from(new Set(requests.map((r) => r.wing).filter(Boolean)))];

  const [wingFilter, setWingFilter] = useState("All Wings");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const wingOk = wingFilter === "All Wings" || r.wing === wingFilter;
      const statusOk = statusFilter === "All Statuses" || r.status === statusFilter;
      return wingOk && statusOk;
    });
  }, [requests, wingFilter, statusFilter]);

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
          <p className="text-xs text-slate-400">{r.wing || "—"}, {r.room || "—"}</p>
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
            <p className="text-sm text-slate-500">Approve or reject leave applications and track parent notification status.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<CalendarClockIcon />} label="Pending approval" value={pendingCount} sub="Awaiting a decision" tone={pendingCount > 0 ? "amber" : "teal"} />
        <StatCard icon={<CheckIcon />} label="Approved" value={approvedCount} sub="This term" tone="teal" />
        <StatCard icon={<CalendarClockIcon />} label="Total requests" value={requests.length} sub="Logged across your wings" tone="navy" />
      </div>

      <Card title="Leave requests">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <select className={`${inputCls} sm:w-48`} value={wingFilter} onChange={(e) => setWingFilter(e.target.value)}>
            {wingFilters.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={requestsQuery.loading}
          searchKeys={["studentName", "reason", "wing", "room"]}
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
