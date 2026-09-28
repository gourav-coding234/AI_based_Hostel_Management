import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatCard, Card, Pill, ProgressBar } from "../../../components/dashboard/student/ui";
import ActivityFeed from "../../../components/dashboard/ActivityFeed";
import { LoadingState, ErrorState, EmptyState } from "../../../components/ui/DataState";
import {
  QrIcon,
  ScanIcon,
  UserPlusIcon,
  SirenIcon,
  ArrowRightIcon,
  CheckSquareIcon,
  CalendarClockIcon,
  ListIcon,
} from "../../../components/dashboard/security/icons";
import { useCollections } from "../../../hooks/useCollection";
import { useStudentDirectory } from "../../../hooks/useStudentDirectory";

// Every target below is a route that SecurityDashboard.jsx actually mounts
// (and that the Security sidebar links to).
const QUICK_ACTIONS = [
  { label: "Scan Gate Pass", to: "/dashboard/security/gate-scan" },
  { label: "In/Out Register", to: "/dashboard/security/in-out" },
  { label: "Visitor Log", to: "/dashboard/security/visitors" },
  { label: "Incident Reports", to: "/dashboard/security/incidents" },
  { label: "Attendance", to: "/dashboard/security/attendance" },
];

const FEED_LIMIT = 6;
const pad = (n) => String(n).padStart(2, "0");

// Local calendar day, e.g. "2026-09-28" — used for "visitors today".
function localDateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Local "YYYY-MM-DDTHH:mm" — the same shape the gate-pass form stores in
// `from` / `to` (datetime-local), so plain string comparison is correct.
function localDateTimeKey(d) {
  return `${localDateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// The Warden and Security Attendance pages both key records by
// `new Date().toISOString().slice(0, 10)`. The Overview must use the exact
// same date key, otherwise it would look at a different day than the
// Attendance page it summarises.
// Check-in instant for a visitor: the ISO `inTimeSort`, else the server
// `createdAt` for older records saved before that field existed.
function visitorKey(v) {
  if (v.inTimeSort) return v.inTimeSort;
  const d = v.createdAt?.toDate ? v.createdAt.toDate() : null;
  return d ? d.toISOString() : "";
}

function attendanceDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function SecurityOverview() {
  const attendanceDate = attendanceDateKey();

  const { data, loading, error } = useCollections({
    gatePasses: { name: "gatePasses" },
    // Approved leave students who physically left and have not returned.
    leaveLogs: { name: "leaveLogs", options: { where: [["status", "==", "Left"]] } },
    gateLogs: { name: "gateLogs", options: { orderByField: "timeSort", limitCount: FEED_LIMIT } },
    // All visitors, not just the latest few — "currently inside" and
    // "visitors today" must be counted over the full log to be accurate.
    visitors: { name: "visitors" },
    incidents: { name: "incidents" },
    // Today's records only, from the same `attendance` collection the
    // Warden and Security Attendance pages write to.
    attendance: { name: "attendance", options: { where: [["date", "==", attendanceDate]] } },
  });
  const { gatePasses, leaveLogs, gateLogs, visitors: rawVisitors, incidents, attendance } = data;

  // Newest check-in first. Sorted here (not via a Firestore orderBy, which
  // would silently drop records that lack the ordered field).
  const visitors = useMemo(() => [...rawVisitors].sort((a, b) => visitorKey(b).localeCompare(visitorKey(a))), [rawVisitors]);

  // Same Student Directory the Warden Attendance page uses. Only used here
  // to know WHO is on the roster (ids) so "Not marked" is real; no personal
  // details from it are rendered.
  const { directory, loading: directoryLoading, error: directoryError } = useStudentDirectory();

  // Re-evaluate time-based numbers (overdue returns, "today") once a minute.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const nowKey = localDateTimeKey(now);
    const todayKey = localDateKey(now);

    // --- Gate passes ---
    const passesOut = gatePasses.filter((p) => p.tripState === "Out");
    const overdue = passesOut.filter((p) => p.to && p.to < nowKey).length;
    // A student is "outside" if they are out on a gate pass OR marked Left on
    // approved leave; counted once per student even if both apply.
    const outIds = new Set(passesOut.map((p) => p.studentId || `pass:${p.id}`));
    leaveLogs.forEach((l) => outIds.add(l.studentId || `leave:${l.id}`));
    // Approved, not yet returned, and either already out or still inside
    // its valid window.
    const activePasses = gatePasses.filter(
      (p) => p.status === "Approved" && p.tripState !== "Returned" && (p.tripState === "Out" || !p.to || p.to >= nowKey)
    ).length;

    // --- Visitors ---
    const isToday = (v) => Boolean(visitorKey(v)) && localDateKey(new Date(visitorKey(v))) === todayKey;
    const inside = visitors.filter((v) => !v.outTime);
    const insideFromEarlier = inside.filter((v) => !isToday(v)).length;
    const visitorsToday = visitors.filter(isToday).length;

    // --- Incidents ---
    const open = incidents.filter((i) => i.status !== "Resolved");
    const openHigh = open.filter((i) => i.severity === "High").length;

    // --- Attendance (today), restricted to students on the roster so the
    // four buckets always add up to the roster size. "Pending" is UI-only
    // and never stored, so anything without a record is "Not marked". ---
    const rosterIds = new Set(directory.map((s) => s.id));
    const statusByStudent = new Map();
    attendance.forEach((a) => {
      if (rosterIds.has(a.studentId)) statusByStudent.set(a.studentId, a.status);
    });
    let present = 0;
    let absent = 0;
    let leave = 0;
    statusByStudent.forEach((status) => {
      if (status === "Present") present += 1;
      else if (status === "Absent") absent += 1;
      else if (status === "Leave") leave += 1;
    });
    const totalStudents = directory.length;
    const marked = present + absent + leave;

    return {
      currentlyOut: outIds.size,
      overdue,
      activePasses,
      inside: inside.length,
      insideFromEarlier,
      visitorsToday,
      openIncidents: open.length,
      openHigh,
      present,
      absent,
      leave,
      marked,
      notMarked: Math.max(totalStudents - marked, 0),
      totalStudents,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatePasses, leaveLogs, visitors, incidents, attendance, directory, tick]);

  if (error || directoryError) return <ErrorState message={error || directoryError} />;
  if (loading || directoryLoading) return <LoadingState label="Loading gate overview…" />;

  const recentVisitors = visitors.slice(0, FEED_LIMIT);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<QrIcon />}
          label="Students currently outside"
          value={stats.currentlyOut}
          sub={stats.overdue > 0 ? `${stats.overdue} past their return time` : "Gate pass or approved leave"}
          tone="amber"
        />
        <StatCard
          icon={<ScanIcon />}
          label="Approved active gate passes"
          value={stats.activePasses}
          sub="Approved, valid and not yet returned"
          tone="navy"
        />
        <StatCard
          icon={<UserPlusIcon />}
          label="Visitors currently inside"
          value={stats.inside}
          sub={stats.insideFromEarlier > 0 ? `${stats.insideFromEarlier} not checked out from earlier days` : "Checked in, not yet out"}
          tone="teal"
        />
        <StatCard
          icon={<SirenIcon />}
          label="Open incidents"
          value={stats.openIncidents}
          sub={stats.openHigh > 0 ? `${stats.openHigh} high severity · ${incidents.length} logged total` : `${incidents.length} logged total`}
          tone="rose"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={<ListIcon />} label="Visitors today" value={stats.visitorsToday} sub={`${visitors.length} in the visitor log`} tone="teal" />
        <StatCard
          icon={<CheckSquareIcon />}
          label="Today's attendance status"
          value={`${stats.marked}/${stats.totalStudents}`}
          sub={stats.marked === 0 ? "Not taken yet today" : `${stats.notMarked} still to be marked`}
          tone="navy"
        />
        <StatCard icon={<CalendarClockIcon />} label="Students on leave today" value={stats.leave} sub="Marked Leave in today's attendance" tone="amber" />
      </div>

      <Card title="Today's attendance" subtitle={`Same records the Warden and Security attendance pages use · ${attendanceDate}`}>
        {stats.totalStudents === 0 ? (
          <EmptyState
            icon={<CheckSquareIcon />}
            title="No students in the directory yet"
            description="Attendance will be summarised here once student accounts exist."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Pill tone="Present">{stats.present} Present</Pill>
              <Pill tone="Absent">{stats.absent} Absent</Pill>
              <Pill tone="Pending">{stats.notMarked} Not marked</Pill>
              {stats.leave > 0 && <Pill tone="Leave">{stats.leave} Leave</Pill>}
            </div>
            <div>
              <ProgressBar value={stats.marked} max={stats.totalStudents} tone="teal" />
              <p className="mt-2 text-xs text-slate-400">
                {stats.marked} of {stats.totalStudents} students marked
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed
          title="Recent gate activity"
          emptyLabel="No gate movements logged yet."
          items={gateLogs.map((l) => ({
            id: l.id,
            title: `${l.studentName || "Student"} — ${l.direction}`,
            subtitle: `Room ${l.room || "—"} · Pass ${l.passId || "—"} · Logged by ${l.guard || "—"}`,
            meta: l.time,
          }))}
        />
        <ActivityFeed
          title="Recent visitors"
          emptyLabel="No visitors logged yet."
          items={recentVisitors.map((v) => {
            const host = v.studentName || v.hostName;
            return {
              id: v.id,
              title: v.visitorName,
              subtitle: `${v.purpose || "—"}${host ? ` · Visiting ${host}` : ""} · In: ${v.inTime || "—"}`,
              meta: v.outTime ? "Checked out" : "On premises",
            };
          })}
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition-shadow duration-200 hover:shadow-md sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Quick actions</h3>
            <p className="mt-1 text-sm text-slate-500">Jump straight to the most common gate-desk tasks.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 hover:shadow-sm"
            >
              {a.label} <ArrowRightIcon />
            </Link>
          ))}
        </div>
      </div>

      {stats.openIncidents > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 shadow-sm shadow-amber-100">
          There are open incidents that may need follow-up.{" "}
          <Link to="/dashboard/security/incidents" className="font-semibold underline">
            Review incidents
          </Link>
          .
        </div>
      )}
    </div>
  );
}
