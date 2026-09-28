import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, StatCard } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import ConfirmDialog from "../../../components/dashboard/ConfirmDialog";
import { CalendarClockIcon, LogOutIcon, LogInIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { markLeaveLeft, markLeaveReturned } from "../../../firebase/firestore";
import { toCsvText, downloadTextFile } from "../../../utils/csv";

const FILTERS = ["All", "Not left", "Left", "Returned"];

const ERROR_TEXT = {
  ALREADY_LEFT: "This student is already marked as Left.",
  NOT_APPROVED: "This leave request is not approved.",
  REQUEST_NOT_FOUND: "This leave request no longer exists.",
  LOG_NOT_FOUND: "No exit has been recorded for this leave yet.",
  NOT_LEFT_YET: "This student is not currently marked as Left.",
};

const pad = (n) => String(n).padStart(2, "0");
function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Firestore Timestamp -> readable local string. Empty until the server has
// resolved the timestamp (or when it was never recorded) — never invented.
function fmt(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// Real recorded time as "YYYY-MM-DD HH:mm" (local); blank if not recorded.
function csvTime(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return "";
  return `${localDateKey(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SecurityLeaveExit() {
  const { user, profile } = useAuth();
  // Approved only — Security has no access to Pending/Rejected requests.
  const requestsQuery = useCollection("leaveRequests", { where: [["status", "==", "Approved"]] });
  const logsQuery = useCollection("leaveLogs");

  const [filter, setFilter] = useState("All");
  const [confirming, setConfirming] = useState(null); // { row, action }
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [message, setMessage] = useState("");

  const logById = useMemo(() => new Map(logsQuery.data.map((l) => [l.id, l])), [logsQuery.data]);

  // One row per approved leave request, joined with its (optional) log.
  const rows = useMemo(() => {
    return [...requestsQuery.data]
      .sort((a, b) => String(b.from || "").localeCompare(String(a.from || "")))
      .map((r) => {
        const log = logById.get(r.id);
        return { ...r, log, movement: log ? log.status : "Not left" };
      });
  }, [requestsQuery.data, logById]);

  const today = localDateKey();
  const leftToday = logsQuery.data.filter((l) => l.leftDate === today).length;
  const awayNow = logsQuery.data.filter((l) => l.status === "Left").length;
  const returned = logsQuery.data.filter((l) => l.status === "Returned").length;

  const filtered = rows.filter((r) => filter === "All" || r.movement === filter);

  async function run({ row, action }) {
    if (busyIds.has(row.id)) return;
    setBusyIds((p) => new Set(p).add(row.id));
    setMessage("");
    const actor = { uid: user?.uid || "", name: profile?.name || user?.email || "Security" };
    try {
      if (action === "left") await markLeaveLeft(row.id, actor);
      else await markLeaveReturned(row.id, actor);
    } catch (err) {
      console.error("Leave movement failed:", err);
      setMessage(ERROR_TEXT[err.message] || "Couldn't save this. Please try again.");
    } finally {
      setBusyIds((p) => {
        const n = new Set(p);
        n.delete(row.id);
        return n;
      });
      setConfirming(null);
    }
  }

  // Export source: the live `leaveLogs` records from Firestore (never table
  // state), narrowed by the same filter tab as the register. "Not left" rows
  // have no log yet, so that tab exports nothing.
  const exportLogs = useMemo(() => {
    return logsQuery.data
      .filter((l) => filter === "All" || l.status === filter)
      .sort((a, b) => (b.leftAt?.seconds || 0) - (a.leftAt?.seconds || 0));
  }, [logsQuery.data, filter]);

  // Only the fields Security needs for a hostel register — no reasons,
  // parent details, approval metadata or account identifiers.
  const csvColumns = [
    { label: "Student ID", value: (l) => l.studentId },
    { label: "Student Name", value: (l) => l.studentName },
    { label: "Block/Wing", value: (l) => l.block },
    { label: "Room", value: (l) => l.room },
    { label: "Leave Type", value: (l) => l.leaveType },
    { label: "From", value: (l) => l.from },
    { label: "To", value: (l) => l.to },
    { label: "Left At", value: (l) => csvTime(l.leftAt) },
    { label: "Returned At", value: (l) => csvTime(l.returnedAt) },
    { label: "Status", value: (l) => l.status },
    { label: "Recorded By", value: (l) => l.recordedBy },
  ];

  function download() {
    if (exportLogs.length === 0) return;
    downloadTextFile(toCsvText(exportLogs, csvColumns), "leave-hostel-register.csv");
  }

  const columns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (r) => (
        <>
          <span className="font-medium text-ink">{r.studentName}</span>
          <p className="text-xs text-slate-400">{r.studentId}</p>
        </>
      ),
    },
    { key: "wing", label: "Block / Room", render: (r) => `${r.wing || "—"}, ${r.room || "—"}` },
    { key: "type", label: "Leave type", render: (r) => <Pill tone="General">{r.type}</Pill> },
    { key: "reason", label: "Reason" },
    { key: "from", label: "From", sortable: true },
    { key: "to", label: "To", sortable: true },
    { key: "status", label: "Approval", render: (r) => <Pill tone={r.status}>{r.status}</Pill> },
    {
      key: "movement",
      label: "Movement",
      render: (r) => (
        <>
          <Pill tone={r.movement === "Not left" ? "Low" : r.movement}>{r.movement}</Pill>
          {r.log?.leftAt && <p className="mt-1 text-xs text-slate-400">Left: {fmt(r.log.leftAt)}</p>}
          {r.log?.returnedAt && <p className="text-xs text-slate-400">Returned: {fmt(r.log.returnedAt)}</p>}
        </>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (r) => {
        const busy = busyIds.has(r.id);
        if (r.movement === "Not left")
          return (
            <Button variant="outline" className="px-2.5 py-1 text-xs" disabled={busy} onClick={() => setConfirming({ row: r, action: "left" })}>
              <LogOutIcon /> Mark Left
            </Button>
          );
        if (r.movement === "Left")
          return (
            <Button variant="outline" className="px-2.5 py-1 text-xs" disabled={busy} onClick={() => setConfirming({ row: r, action: "returned" })}>
              <LogInIcon /> Mark Returned
            </Button>
          );
        return "—";
      },
    },
  ];

  const loading = requestsQuery.loading || logsQuery.loading;
  const error = requestsQuery.error || logsQuery.error;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<CalendarClockIcon />} label="Total leave exits" value={logsQuery.data.length} sub="All recorded departures" tone="navy" />
        <StatCard icon={<LogOutIcon />} label="Left on leave today" value={leftToday} sub="Exits recorded today" tone="navy" />
        <StatCard icon={<CalendarClockIcon />} label="Currently away" value={awayNow} sub="Left, not yet returned" tone={awayNow > 0 ? "amber" : "teal"} />
        <StatCard icon={<LogInIcon />} label="Returned" value={returned} sub="Back in the hostel" tone="teal" />
      </div>

      <Card
        title="Leave exit register"
        action={
          <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={download} disabled={exportLogs.length === 0}>
            Download ({exportLogs.length})
          </Button>
        }
      >
        <div className="mb-4 flex gap-2 rounded-full border border-slate-200 bg-slate-50/60 p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                filter === f ? "bg-navy-950 text-white shadow-sm" : "text-slate-500 hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {message && <p className="mb-3 text-sm text-rose-600">{message}</p>}

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          error={error}
          searchKeys={["studentName", "studentId", "wing", "room", "type"]}
          searchPlaceholder="Search by student, ID or room…"
          emptyTitle="No approved leave requests"
          emptyDescription="Leave requests approved by the warden will show up here."
          emptyIcon={<CalendarClockIcon />}
          pageSize={12}
        />
      </Card>

      {confirming && (
        <ConfirmDialog
          tone="default"
          title={confirming.action === "left" ? "Confirm student has left?" : "Confirm student has returned?"}
          description={`${confirming.row.studentName} (${confirming.row.wing || "—"}, ${confirming.row.room || "—"}). The current time will be recorded.`}
          confirmLabel={confirming.action === "left" ? "Mark Left" : "Mark Returned"}
          busy={busyIds.has(confirming.row.id)}
          onConfirm={() => run(confirming)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
