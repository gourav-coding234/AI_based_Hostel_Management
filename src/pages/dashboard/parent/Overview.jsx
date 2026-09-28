import { Link } from "react-router-dom";
import { Card, Pill, ProgressBar } from "../../../components/dashboard/student/ui";
import { EmptyState, ErrorState } from "../../../components/ui/DataState";
import { BedIcon, WalletIcon, CheckSquareIcon, QrIcon, ArrowRightIcon, MegaphoneIcon } from "../../../components/dashboard/parent/icons";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { useCollection } from "../../../hooks/useCollection";
import { useParentNotifications } from "../../../hooks/useParentNotifications";
import { noticeAppliesTo } from "../../../utils/notices";
import { inr, feeTone, summarizeChildFees, notificationToNotice } from "./parentData";

function initials(name) {
  const source = (name || "?").trim();
  return source.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

// Local calendar month ("2026-09") — attendance dates are stored as plain
// YYYY-MM-DD strings, so this must not be shifted to UTC.
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseDate(v) {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

// The pass to headline: an Approved pass that hasn't expired yet, otherwise
// the most recent pass of any status (list is already newest-first).
function currentPass(passes) {
  const now = new Date();
  const live = passes.find((p) => {
    if (p.status !== "Approved") return false;
    const to = parseDate(p.to);
    return !to || now <= to;
  });
  return live || passes[0] || null;
}

export default function ParentOverview() {
  const linked = useLinkedStudent();
  const { studentUser, studentRecord, linkedStudentId } = linked;

  const fees = useStudentCollection("fees", linkedStudentId, { orderByField: "dueDate" });
  const attendance = useStudentCollection("attendance", linkedStudentId, { orderByField: "date" });
  const gatePasses = useStudentCollection("gatePasses", linkedStudentId, { orderByField: "from" });
  const noticesQuery = useCollection("notices", { orderByField: "date", limitCount: 12 });
  const notifications = useParentNotifications();

  const status = <LinkedStudentStatus {...linked} />;
  if (status) return status;

  // Only real data, straight from Firestore, scoped to the linked child.
  const room = studentRecord;
  const childName = studentUser?.name || "Your child";
  const dataError = fees.error || attendance.error || gatePasses.error;
  const statsLoading = fees.loading || attendance.loading || gatePasses.loading;

  const feeSummary = summarizeChildFees(fees.items);
  const { total: totalFee, paid, pending: feeRemaining } = feeSummary;

  const monthKey = currentMonthKey();
  const monthLog = attendance.items.filter((a) => a.date && a.date.slice(0, 7) === monthKey);
  const monthCounts = { Present: 0, Absent: 0, Leave: 0 };
  monthLog.forEach((a) => {
    if (a.status in monthCounts) monthCounts[a.status] += 1;
  });
  const attendancePct = monthLog.length ? Math.round((monthCounts.Present / monthLog.length) * 100) : null;

  const pass = currentPass(gatePasses.items);

  // Latest notices AND the parent's own notifications in one short list,
  // newest first — same merge the Notices page uses.
  const generalNotices = noticesQuery.data.filter((n) => noticeAppliesTo(n.target, studentUser?.hostelResidence));
  const latest = [...notifications.data.map(notificationToNotice), ...generalNotices]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 3);
  const noticesLoading = noticesQuery.loading || notifications.loading;
  const noticesError = noticesQuery.error || notifications.error;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-500/20 font-display text-xl font-semibold text-teal-200 ring-4 ring-white/10">
            {initials(studentUser?.name || "Child")}
          </span>
          <div>
            <p className="text-sm text-slate-300">Keeping an eye on</p>
            <h2 className="font-display text-xl font-semibold">{childName}</h2>
            {studentUser?.email && <p className="mt-0.5 text-sm text-slate-300">{studentUser.email}</p>}
            {room?.room ? (
              <p className="mt-0.5 text-xs text-slate-400">
                {room.wing} · {room.room}, {room.bed}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-400">Room not yet allotted</p>
            )}
          </div>
        </div>
      </Card>

      {dataError && <ErrorState message={dataError} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/dashboard/parent/attendance" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <CheckSquareIcon />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold text-ink">{statsLoading ? "…" : attendancePct === null ? "—" : `${attendancePct}%`}</p>
          <p className="mt-0.5 text-sm text-slate-500">Attendance this month</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {monthLog.length ? `${monthCounts.Present} present · ${monthCounts.Absent} absent · ${monthCounts.Leave} leave` : "No records this month"}
          </p>
        </Link>
        <Link to="/dashboard/parent/fees" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
            <WalletIcon />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold text-ink">{statsLoading ? "…" : totalFee ? inr(feeRemaining) : "—"}</p>
          <p className="mt-0.5 text-sm text-slate-500">Fee pending</p>
          {feeSummary.status && <p className="mt-0.5 text-xs text-slate-400">{feeSummary.status}</p>}
        </Link>
        <Link to="/dashboard/parent/gate-pass" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
            <QrIcon />
          </span>
          <p className="mt-4 font-display text-lg font-semibold text-ink">{statsLoading ? "…" : pass ? pass.status : "None"}</p>
          <p className="mt-0.5 text-sm text-slate-500">Gate pass status</p>
          {pass && <p className="mt-0.5 text-xs text-slate-400">{pass.type}</p>}
        </Link>
        <Link to="/dashboard/parent/room" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <BedIcon />
          </span>
          <p className="mt-4 font-display text-lg font-semibold text-ink">{room?.room || "—"}</p>
          <p className="mt-0.5 text-sm text-slate-500">{room?.bed || "Not allotted"} {room?.wing ? `· ${room.wing}` : ""}</p>
        </Link>
      </div>

      <Card title="Fee status" action={feeSummary.status ? <Pill tone={feeTone(feeSummary.status)}>{feeSummary.status}</Pill> : null}>
        {totalFee ? (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">{inr(paid)} paid of {inr(totalFee)}</span>
              <span className="font-semibold text-ink">{Math.round((paid / totalFee) * 100)}%</span>
            </div>
            <ProgressBar value={paid} max={totalFee} tone={feeRemaining > 0 ? "amber" : "teal"} />
            <p className="mt-2 text-xs text-slate-400">
              {inr(feeRemaining)} pending{feeSummary.nextDue ? ` · next due ${feeSummary.nextDue}` : ""}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">No fee record has been posted for {childName} yet.</p>
        )}
      </Card>

      <Card title="Recent notices" action={
        <div className="flex items-center gap-3">
          {notifications.unreadCount > 0 && <Pill tone="Pending">{notifications.unreadCount} unread</Pill>}
          <Link to="/dashboard/parent/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            View all <ArrowRightIcon />
          </Link>
        </div>
      }>
        {noticesLoading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading notices…</p>
        ) : noticesError ? (
          <ErrorState message={noticesError} />
        ) : latest.length === 0 ? (
          <EmptyState icon={<MegaphoneIcon />} title="No notices yet" description="Notices posted by the warden or admin office will show up here." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {latest.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className={`text-sm text-ink ${n.personal && !n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{n.postedBy} · {n.date}</p>
                </div>
                <Pill tone={n.priority}>{n.priority}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
