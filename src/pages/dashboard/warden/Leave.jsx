import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { wardenHostel } from "../../../utils/hostels";
import { Card, Pill, Button, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { CalendarClockIcon, CheckIcon, XIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { getCollection, decideLeaveRequest } from "../../../firebase/firestore";
import { downloadXlsxFile } from "../../../utils/xlsxExport";
import { dateKey } from "../../../utils/dateKey";

const statusFilters = ["All Statuses", "Pending", "Approved", "Rejected"];

export default function Leave() {
  const { user, profile } = useAuth();
  const assignedHostel = wardenHostel(profile);
  const requestsQuery = useCollection("leaveRequests", {
    where: assignedHostel ? [["hostel", "==", assignedHostel]] : [],
    orderByField: "from",
    skip: !assignedHostel,
  });
  const requests = requestsQuery.data;
  const wingFilters = ["All Wings", ...Array.from(new Set(requests.map((r) => r.wing).filter(Boolean)))];

  const [wingFilter, setWingFilter] = useState("All Wings");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedDate, setSelectedDate] = useState("");

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const wingOk = wingFilter === "All Wings" || r.wing === wingFilter;
      const statusOk = statusFilter === "All Statuses" || r.status === statusFilter;
      const dateOk = !selectedDate || dateKey(r.from || r.createdAt) === selectedDate;
      return wingOk && statusOk && dateOk;
    });
  }, [requests, wingFilter, statusFilter, selectedDate]);

  async function downloadRequests() {
    await downloadXlsxFile(filtered, [
      { label: "Leave Code", value: (r) => r.code || "Legacy request" },
      { label: "Student", value: (r) => r.studentName || "" }, { label: "Student ID", value: (r) => r.registrationNo || "" },
      { label: "Type", value: (r) => r.type || "" }, { label: "Reason", value: (r) => r.reason || "" },
      { label: "From", value: (r) => r.from || "" }, { label: "To", value: (r) => r.to || "" },
      { label: "Status", value: (r) => r.status || "" }, { label: "Parent notified", value: (r) => r.parentNotified ? "Yes" : "No" },
      { label: "Block", value: (r) => r.wing || "" }, { label: "Room", value: (r) => r.room || "" },
    ], `leave_requests_${selectedDate || new Date().toISOString().slice(0, 10)}.xlsx`, "Leave Requests");
  }

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;

  // Ids currently being written — guards against a double-click firing two
  // decisions for the same request before the first write's snapshot comes
  // back, and is what disables that row's buttons while the update is in
  // flight (mirrors the same guard on the Warden Gate Passes page).
  const [processingIds, setProcessingIds] = useState(() => new Set());

  async function decide(request, nextStatus) {
    // Only a still-Pending, not-already-processing request can be decided
    // — closes the window for a duplicate approval/rejection from a
    // repeated click, a second tab, or a stale render. This always
    // updates the same leaveRequests/{id} document (never creates a new
    // one), so it stays the one record both the student and their linked
    // parent read from.
    if (request.status !== "Pending" || processingIds.has(request.id)) return;

    setProcessingIds((prev) => new Set(prev).add(request.id));
    const staffName = profile?.name || user?.email || "Warden";

    try {
      // Linked parents are resolved through the existing link
      // (users/{parentUid}.linkedStudentId). Each gets a persistent
      // parentNotifications record written in the same transaction as the
      // decision, and `parentNotified` is set only when such a record
      // really exists — never just because the Warden clicked.
      let parentIds = [];
      try {
        const parents = await getCollection("users", {
          whereClauses: [["role", "==", "Parent"], ["linkedStudentId", "==", request.studentId]],
        });
        parentIds = parents.map((p) => p.id);
      } catch (lookupErr) {
        console.error("Couldn't look up linked parent:", lookupErr);
      }
      await decideLeaveRequest(request.id, nextStatus, parentIds, { uid: user?.uid || "", name: staffName });
    } catch (err) {
      console.error("Failed to update leave request:", err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
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
          <p className="text-xs text-slate-400">{r.code || "Legacy request"} · {r.registrationNo || "Registration unavailable"}</p>
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
      render: (r) => {
        const busy = processingIds.has(r.id);
        return (
          <div className="flex items-center gap-2">
            <Pill tone={r.status}>{r.status}</Pill>
            {r.status === "Pending" && (
              <>
                <Button variant="outline" className="px-2.5 py-1 text-xs" onClick={() => decide(r, "Approved")} disabled={busy}>
                  <CheckIcon />
                </Button>
                <Button variant="danger" className="px-2.5 py-1 text-xs" onClick={() => decide(r, "Rejected")} disabled={busy}>
                  <XIcon />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {!assignedHostel && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">No hostel is assigned to this warden account. Ask an administrator to assign Boys Hostel or Girls Hostel.</p>}
      {requestsQuery.error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Leave requests could not be loaded for {assignedHostel}. Check the Firestore access rules.</p>}
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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input aria-label="Filter leave requests by date" type="date" className={`${inputCls} sm:w-48`} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <select className={`${inputCls} sm:w-48`} value={wingFilter} onChange={(e) => setWingFilter(e.target.value)}>
            {wingFilters.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button variant="outline" className="sm:ml-auto" onClick={downloadRequests} disabled={!filtered.length}>Download Excel</Button>
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
