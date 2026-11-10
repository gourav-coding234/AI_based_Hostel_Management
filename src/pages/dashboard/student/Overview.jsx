import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, StatCard, Button } from "../../../components/dashboard/student/ui";
import { EmptyState, ErrorState } from "../../../components/ui/DataState";
import {
  BedIcon,
  WalletIcon,
  CheckSquareIcon,
  WrenchIcon,
  MegaphoneIcon,
  QrIcon,
  UtensilsIcon,
  ArrowRightIcon,
  AlertIcon,
} from "../../../components/dashboard/student/icons";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { useCollection } from "../../../hooks/useCollection";
import { useDocument } from "../../../hooks/useDocument";
import { noticeAppliesTo } from "../../../utils/notices";
import { computeFeeStatus } from "../../../utils/fees";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

// Same QR encoding + provider used on the full Gate Pass page, kept in sync
// here so a student sees the identical code either place. It's built purely
// from the Firestore-backed `activePass` fields (no local/session state), so
// it comes back exactly the same after a refresh — there's nothing to lose.
function qrUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=6&data=${encodeURIComponent(data)}`;
}

export default function Overview() {
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const studentId = user?.uid || "";
  const { data: studentRecord, error: studentRecordError } = useDocument("students", studentId);

  // Fee records are one document per billing period, with `total`/`paid`
  // set directly on each doc (matching the admin/warden Fees pages and the
  // CSV import schema) — not a list of `amount` line items, and not
  // ordered by a `date` field the schema doesn't have.
  const fees = useStudentCollection("fees", studentId);
  const attendance = useStudentCollection("attendance", studentId, { orderByField: "date" });
  const complaints = useStudentCollection("complaints", studentId);
  const gatePasses = useStudentCollection("gatePasses", studentId);
  const leaveRequests = useStudentCollection("leaveRequests", studentId);
  // Fetch a bit more than we display — filtering by wing happens client-side
  // (see noticeAppliesTo), so limiting to exactly 3 before filtering could
  // silently drop relevant notices behind irrelevant ones targeted at a
  // different wing.
  const noticesQuery = useCollection("notices", { orderByField: "date", limitCount: 10 });
  const filteredNoticeData = noticesQuery.data
    .filter((n) => noticeAppliesTo(n.target, profile?.hostelResidence))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 3);
  const notices = { ...noticesQuery, data: filteredNoticeData, isEmpty: !noticesQuery.loading && !noticesQuery.error && filteredNoticeData.length === 0 };
  const attendanceError = attendance.error;

  // Room/bed allotment lives on the student's own `students/{uid}` document
  // (written by the warden's Room Allotment page), never on the `users`
  // profile doc — reading from `studentRecord` here instead of `profile` is
  // what makes this card reflect the student's actual, current allotment.
  const myAllocation = studentRecord?.room
    ? studentRecord
    : { status: "Waiting", room: "—", bed: "—", wing: "Not allotted", floor: "" };
  const roomStatus = studentRecord?.room ? "Allotted" : "Waiting";

  const feeTotal = fees.items.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const feePaid = fees.items.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const feeRemaining = Math.max(feeTotal - feePaid, 0);
  // Fees are fetched ordered by dueDate (newest first, to match the other
  // fee screens' default sort) — sort ascending here just for picking the
  // *next* (soonest upcoming) unpaid record, so this doesn't accidentally
  // surface the furthest-out unpaid due date instead of the nearest one.
  const nextDueFee = [...fees.items]
    .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")))
    .find((f) => (Number(f.total) || 0) > (Number(f.paid) || 0));
  // Single source of truth for fee status (Paid/Overdue/Partial/Pending),
  // matching how the Admin/Warden Fees pages compute it — instead of
  // guessing from remaining amount alone.
  const feeStatus = feeTotal
    ? computeFeeStatus({ total: feeTotal, paid: feePaid, dueDate: nextDueFee?.dueDate })
    : null;

  const presentCount = attendance.items.filter((a) => a.status === "Present").length;
  const absentCount = attendance.items.filter((a) => a.status === "Absent").length;
  const attendancePct = attendance.items.length ? Math.round((presentCount / attendance.items.length) * 100) : null;
  // Attendance is fetched newest-date-first, so the first item is the most
  // recent recorded day.
  const latestAttendanceStatus = attendance.items[0]?.status || null;

  const openComplaints = complaints.items.filter((c) => c.status !== "Resolved").length;
  const resolvedComplaints = complaints.items.filter((c) => c.status === "Resolved").length;
  const activePass = [...gatePasses.items].sort((a, b) => String(b.from || "").localeCompare(String(a.from || ""))).find((p) => p.status === "Approved");

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-300">Welcome back,</p>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{displayName}</h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm text-slate-300">
              <span>{myAllocation.room}</span>
              <span className="text-slate-500">·</span>
              <span>{myAllocation.bed}</span>
              <span className="text-slate-500">·</span>
              <span>{myAllocation.wing}, {myAllocation.floor}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/student/complaints">
              <Button variant="outline" className="border-white/20 text-white hover:border-teal-300 hover:text-teal-300">
                Raise a complaint
              </Button>
            </Link>
            <Link to="/dashboard/student/gate-pass">
              <Button className="bg-teal-500 shadow-teal-900/30 hover:bg-teal-400">Request gate pass</Button>
            </Link>
          </div>
        </div>
      </Card>

      {(studentRecordError || attendanceError || fees.error || complaints.error || gatePasses.error || leaveRequests.error || notices.error) && (
        <ErrorState message={studentRecordError || attendanceError || fees.error || complaints.error || gatePasses.error || leaveRequests.error || notices.error} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<BedIcon />}
          label="Room & bed status"
          value={roomStatus}
          sub={roomStatus === "Allotted" ? `${myAllocation.room} · ${myAllocation.bed}` : "Awaiting allotment"}
          tone="teal"
        />
        <StatCard
          icon={<WalletIcon />}
          label="Fees remaining"
          value={`₹${feeRemaining.toLocaleString("en-IN")}`}
          sub={
            feeTotal
              ? `${feeStatus} · ${inr(feePaid)} of ${inr(feeTotal)} paid${nextDueFee?.dueDate ? ` · Due ${nextDueFee.dueDate}` : ""}`
              : "No fee record yet"
          }
          tone={feeRemaining > 0 ? "amber" : "teal"}
        />
        <StatCard
          icon={<CheckSquareIcon />}
          label="My attendance"
          value={attendance.error ? "Unavailable" : attendancePct === null ? "—" : `${attendancePct}%`}
          sub={
            attendance.items.length
              ? `${presentCount} present · ${absentCount} absent · Latest: ${latestAttendanceStatus}`
              : attendance.error ? "Could not load attendance" : "No records yet"
          }
          tone="teal"
        />
        <StatCard
          icon={<WrenchIcon />}
          label="Open complaints"
          value={openComplaints}
          sub={`${resolvedComplaints} resolved · ${complaints.items.length} total filed`}
          tone={openComplaints > 0 ? "rose" : "teal"}
        />
        <Link to="/dashboard/student/leave"><StatCard icon={<AlertIcon />} label="Leave requests" value={leaveRequests.loading ? "…" : leaveRequests.items.filter((r) => r.status === "Pending").length} sub={`${leaveRequests.items.length} total submitted`} tone={leaveRequests.items.some((r) => r.status === "Pending") ? "amber" : "teal"} /></Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Recent notices" className="lg:col-span-2" action={
          <Link to="/dashboard/student/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            View all <ArrowRightIcon />
          </Link>
        }>
          {notices.loading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading notices…</p>
          ) : notices.isEmpty ? (
            <EmptyState icon={<MegaphoneIcon />} title="No notices yet" description="Notices from the warden or admin will show up here." />
          ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {notices.data.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{n.postedBy} · {n.date}</p>
                </div>
                <Pill tone={n.priority}>{n.priority}</Pill>
              </li>
            ))}
          </ul>
          )}
        </Card>

        <Card title="Active gate pass">
          {activePass ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <img
                src={qrUrl(`${activePass.id}|${activePass.type}|${activePass.from}-${activePass.to}`)}
                alt={`QR code for gate pass ${activePass.id}`}
                width={120}
                height={120}
                className="rounded-xl border border-slate-200 p-1.5 shadow-sm shadow-slate-200/60"
              />
              <Pill tone={activePass.status}>{activePass.status}</Pill>
              <p className="text-sm font-medium text-ink">{activePass.type}</p>
              <p className="text-xs text-slate-500">{activePass.from} → {activePass.to}</p>
              <Link to="/dashboard/student/gate-pass" className="w-full">
                <Button variant="outline" className="w-full">View full pass</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <QrIcon />
              </span>
              <p className="text-sm text-slate-400">No active gate pass right now.</p>
              <Link to="/dashboard/student/gate-pass">
                <Button variant="outline">Request one</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/dashboard/student/mess" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 transition-transform duration-200 group-hover:scale-105">
            <UtensilsIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Report a mess issue</p>
            <p className="truncate text-xs text-slate-400">Food, utensils or quality</p>
          </div>
        </Link>
        <Link to="/dashboard/student/complaints?category=Inventory" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 transition-transform duration-200 group-hover:scale-105">
            <BedIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Request extra furniture</p>
            <p className="truncate text-xs text-slate-400">Raise an inventory complaint</p>
          </div>
        </Link>
        <Link to="/dashboard/student/fees" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900 transition-transform duration-200 group-hover:scale-105">
            <WalletIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Pay pending fees</p>
            <p className="truncate text-xs text-slate-400">₹{feeRemaining.toLocaleString("en-IN")} remaining</p>
          </div>
        </Link>
      </div>

      <Card className="bg-slate-50/60">
        <span className="flex items-center gap-2 text-sm text-slate-400">
          <MegaphoneIcon />
          Warden and admin notices, fee reminders, and mess updates all surface here automatically.
        </span>
      </Card>
    </div>
  );
}
