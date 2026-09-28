import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, StatCard, ProgressBar } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import {
  BedIcon,
  WalletIcon,
  CheckSquareIcon,
  WrenchIcon,
  UsersIcon,
  QrIcon,
  CalendarClockIcon,
  PackageIcon,
  ArrowRightIcon,
} from "../../../components/dashboard/warden/icons";
import { useCollections } from "../../../hooks/useCollection";
import { computeFeeStatus } from "../../../utils/fees";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

// Students can carry either `hostelResidence` (from bulk import) or `wing` —
// this mirrors the exact fallback already used on Room Allotment / Student
// Directory, so a warden's headcount always agrees with those pages.
function studentWing(s) {
  return s.hostelResidence || s.wing;
}

export default function WardenOverview() {
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Warden";
  const myWing = profile?.block;

  const { data, loading } = useCollections({
    blocks: { name: "blocks" },
    students: { name: "students" },
    complaints: { name: "complaints", options: { orderByField: "date" } },
    fees: { name: "fees" },
    attendance: { name: "attendance", options: { orderByField: "date", orderByDirection: "desc" } },
    roomRequests: { name: "roomRequests" },
    inventoryRequests: { name: "inventoryRequests" },
    gatePasses: { name: "gatePasses", options: { orderByField: "from" } },
    leaveRequests: { name: "leaveRequests", options: { orderByField: "from" } },
    notices: { name: "notices", options: { orderByField: "date", limitCount: 5 } },
  });

  // ---- Occupancy (blocks assigned to this warden's wing) ----
  const myBlocks = myWing ? data.blocks.filter((b) => b.name === myWing) : data.blocks;
  const totalBeds = myBlocks.reduce((sum, b) => sum + (Number(b.totalBeds) || 0), 0);
  const occupiedBeds = myBlocks.reduce((sum, b) => sum + (Number(b.occupiedBeds) || 0), 0);
  const vacantBeds = Math.max(totalBeds - occupiedBeds, 0);
  const occupancyPct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // ---- Residents (students model supports block/wing, so scope it) ----
  const myStudents = myWing ? data.students.filter((s) => studentWing(s) === myWing) : data.students;

  // ---- Attendance (scoped via each student's wing — the attendance
  // record itself only carries studentId/date/status) ----
  const wingByStudentId = Object.fromEntries(data.students.map((s) => [s.id, studentWing(s)]));
  // attendance is ordered newest-first, so the latest date is the FIRST
  // record, not the last.
  const latestDate = data.attendance.length ? data.attendance[0].date : null;
  const todayAll = data.attendance.filter((a) => a.date === latestDate);
  const todayRecords = myWing ? todayAll.filter((a) => wingByStudentId[a.studentId] === myWing) : todayAll;
  const presentToday = todayRecords.filter((a) => a.status === "Present").length;
  const absentToday = todayRecords.filter((a) => a.status === "Absent").length;
  const markedToday = todayRecords.length;
  const attendancePct = markedToday ? Math.round((presentToday / markedToday) * 100) : null;

  // ---- Fees (fee records carry `block`, same scoping as Warden Fees page) ----
  const myFees = myWing ? data.fees.filter((f) => f.block === myWing) : data.fees;
  const totalDue = myFees.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const totalCollected = myFees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const totalOutstanding = Math.max(totalDue - totalCollected, 0);
  const collectionPct = totalDue ? Math.round((totalCollected / totalDue) * 100) : 0;
  const overdueFees = myFees.filter((f) => computeFeeStatus(f) === "Overdue").length;

  // ---- Gate passes (records carry `wing`, same scoping as Warden Gate
  // Passes page) ----
  const myGatePasses = myWing ? data.gatePasses.filter((p) => p.wing === myWing) : data.gatePasses;
  const pendingGatePasses = myGatePasses.filter((p) => p.status === "Pending").length;
  const approvedGatePasses = myGatePasses.filter((p) => p.status === "Approved").length;

  // ---- Leave requests (records carry `wing`, same scoping as Warden
  // Leave page) ----
  const myLeaveRequests = myWing ? data.leaveRequests.filter((r) => r.wing === myWing) : data.leaveRequests;
  const pendingLeave = myLeaveRequests.filter((r) => r.status === "Pending").length;
  const approvedLeave = myLeaveRequests.filter((r) => r.status === "Approved").length;
  const rejectedLeave = myLeaveRequests.filter((r) => r.status === "Rejected").length;

  // ---- Complaints — the data model has no wing/block field on complaint
  // records, so (per the existing Warden Complaints page) these stay
  // hostel-wide rather than being force-filtered against a field that
  // doesn't exist. ----
  const complaints = data.complaints;
  const openComplaints = complaints.filter((c) => c.status !== "Resolved").length;
  const unassignedComplaints = complaints.filter((c) => !c.assignedTo && c.status !== "Resolved").length;

  // ---- Room + inventory requests — also hostel-wide, matching Room
  // Allotment / Warden Inventory, which don't scope these by wing either. ----
  const pendingRoomRequests = data.roomRequests.filter((r) => r.status === "Pending").length;
  const pendingInventoryRequests = data.inventoryRequests.filter((r) => r.status === "Pending").length;

  const totalPendingActions =
    pendingRoomRequests + pendingInventoryRequests + pendingGatePasses + pendingLeave + unassignedComplaints + overdueFees;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-300">Welcome back,</p>
            <h2 className="font-display text-2xl font-semibold">{displayName}</h2>
            <p className="mt-1.5 text-sm text-slate-300">
              {totalBeds ? `${occupiedBeds} of ${totalBeds} beds occupied` : "No blocks assigned yet"}{myWing ? ` in ${myWing}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/warden/complaints">
              <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-teal-300 hover:text-teal-300">
                Review complaints
              </span>
            </Link>
            <Link to="/dashboard/warden/notices">
              <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-400">
                Publish notice
              </span>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<UsersIcon />} label="Total residents" value={loading ? "…" : myStudents.length} sub={myWing ? `In ${myWing}` : "Across your hostel"} tone="navy" />
        <StatCard icon={<BedIcon />} label="Occupancy" value={totalBeds ? `${occupancyPct}%` : "—"} sub={totalBeds ? `${vacantBeds} beds vacant` : "No blocks assigned"} tone="teal" />
        <StatCard icon={<CheckSquareIcon />} label="Attendance today" value={loading ? "…" : attendancePct === null ? "—" : `${attendancePct}%`} sub={markedToday ? `${presentToday}/${markedToday} present` : "Not marked yet"} tone={attendancePct !== null && attendancePct < 75 ? "rose" : "teal"} />
        <StatCard icon={<WalletIcon />} label="Fee collection" value={totalDue ? `${collectionPct}%` : "—"} sub={totalDue ? `${inr(totalOutstanding)} pending` : "No fee records yet"} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<QrIcon />} label="Pending gate passes" value={loading ? "…" : pendingGatePasses} sub={`${myGatePasses.length} total`} tone={pendingGatePasses > 0 ? "amber" : "teal"} />
        <StatCard icon={<CalendarClockIcon />} label="Pending leave requests" value={loading ? "…" : pendingLeave} sub={`${myLeaveRequests.length} total`} tone={pendingLeave > 0 ? "amber" : "teal"} />
        <StatCard icon={<WrenchIcon />} label="Open complaints" value={loading ? "…" : openComplaints} sub={`${complaints.length} total filed`} tone={openComplaints > 0 ? "rose" : "teal"} />
        <StatCard icon={<PackageIcon />} label="Pending inventory requests" value={loading ? "…" : pendingInventoryRequests} sub={`${data.inventoryRequests.length} total`} tone={pendingInventoryRequests > 0 ? "amber" : "teal"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Needs your attention" className="lg:col-span-3">
          <ul className="flex flex-col divide-y divide-slate-100 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8">
            <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <span className="text-sm text-ink">Pending gate passes</span>
              <Pill tone="Pending">{pendingGatePasses}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ink">Pending leave requests</span>
              <Pill tone="Pending">{pendingLeave}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ink">Pending room requests</span>
              <Pill tone="Pending">{pendingRoomRequests}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ink">Pending inventory requests</span>
              <Pill tone="Pending">{pendingInventoryRequests}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ink">Unassigned complaints</span>
              <Pill tone="Open">{unassignedComplaints}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ink">Overdue fee accounts</span>
              <Pill tone="Overdue">{overdueFees}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3 last:pb-0 sm:col-span-2">
              <span className="text-sm text-ink">Total pending actions</span>
              <span className="font-display text-sm font-semibold text-ink">{totalPendingActions}</span>
            </li>
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Today's attendance"
          subtitle={latestDate ? `As of ${latestDate}` : undefined}
          action={
            <Link to="/dashboard/warden/attendance" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
              View all <ArrowRightIcon />
            </Link>
          }
        >
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
          ) : markedToday === 0 ? (
            <EmptyState icon={<CheckSquareIcon />} title="No attendance marked yet" description="Attendance recorded for today will show up here." />
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Present</span>
                <span className="font-semibold text-ink">{presentToday}/{markedToday} · {attendancePct}%</span>
              </div>
              <ProgressBar value={presentToday} max={markedToday || 1} tone={attendancePct >= 90 ? "teal" : attendancePct >= 75 ? "amber" : "rose"} />
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-400">Present today</p>
                  <p className="font-display text-lg font-semibold text-teal-600">{presentToday}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Absent today</p>
                  <p className="font-display text-lg font-semibold text-rose-600">{absentToday}</p>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card
          title="Leave requests"
          action={
            <Link to="/dashboard/warden/leave" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
              Review <ArrowRightIcon />
            </Link>
          }
        >
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
          ) : myLeaveRequests.length === 0 ? (
            <EmptyState icon={<CalendarClockIcon />} title="No leave requests yet" description="Leave applications submitted by students will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <span className="text-sm text-ink">Pending</span>
                <Pill tone="Pending">{pendingLeave}</Pill>
              </li>
              <li className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-ink">Approved</span>
                <Pill tone="Approved">{approvedLeave}</Pill>
              </li>
              <li className="flex items-center justify-between gap-3 py-3 last:pb-0">
                <span className="text-sm text-ink">Rejected</span>
                <Pill tone="Rejected">{rejectedLeave}</Pill>
              </li>
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Gate passes"
          action={
            <Link to="/dashboard/warden/gate-passes" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
              Review <ArrowRightIcon />
            </Link>
          }
        >
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
          ) : myGatePasses.length === 0 ? (
            <EmptyState icon={<QrIcon />} title="No gate passes yet" description="Requests submitted by students will show up here." />
          ) : (
            <>
              <ul className="flex flex-col divide-y divide-slate-100">
                <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <span className="text-sm text-ink">Pending approval</span>
                  <Pill tone="Pending">{pendingGatePasses}</Pill>
                </li>
                <li className="flex items-center justify-between gap-3 py-3 last:pb-0">
                  <span className="text-sm text-ink">Approved / current passes</span>
                  <Pill tone="Approved">{approvedGatePasses}</Pill>
                </li>
              </ul>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent activity</p>
                <ul className="flex flex-col divide-y divide-slate-100">
                  {myGatePasses.slice(0, 3).map((p) => (
                    <li key={p.id} className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{p.studentName || "—"}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{p.type || "—"} · {p.from} → {p.to}</p>
                      </div>
                      <Pill tone={p.status}>{p.status}</Pill>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Card>

        <Card title="Fee collection">
          {totalDue === 0 ? (
            <EmptyState icon={<WalletIcon />} title="No fee records yet" description="Fee records imported by the admin office will show up here." />
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Collected</span>
                <span className="font-semibold text-ink">{collectionPct}%</span>
              </div>
              <ProgressBar value={totalCollected} max={totalDue || 1} tone="amber" />
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-400">Total due</p>
                  <p className="text-sm font-semibold text-ink">{inr(totalDue)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Collected</p>
                  <p className="text-sm font-semibold text-ink">{inr(totalCollected)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Outstanding</p>
                  <p className="text-sm font-semibold text-ink">{inr(totalOutstanding)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Overdue accounts</p>
                  <p className="text-sm font-semibold text-rose-600">{overdueFees}</p>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {totalBeds > 0 && (
        <Card title="Bed occupancy">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Beds filled</span>
            <span className="font-semibold text-ink">{occupiedBeds}/{totalBeds}</span>
          </div>
          <ProgressBar value={occupiedBeds} max={totalBeds} tone="teal" />
        </Card>
      )}

      <Card title="Recent notices" action={
        <Link to="/dashboard/warden/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
          Manage <ArrowRightIcon />
        </Link>
      }>
        {data.notices.length === 0 ? (
          <EmptyState title="No notices yet" description="Notices published by admins or wardens will show up here." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {data.notices.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{n.target} · {n.date}{n.postedBy ? ` · ${n.postedBy}` : ""}</p>
                </div>
                <Pill tone={n.priority}>{n.priority}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/dashboard/warden/directory" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
            <UsersIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Student directory</p>
            <p className="truncate text-xs text-slate-400">Search and view all residents</p>
          </div>
        </Link>
        <Link to="/dashboard/warden/rooms" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <BedIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Allot vacant beds</p>
            <p className="truncate text-xs text-slate-400">{vacantBeds} beds free right now</p>
          </div>
        </Link>
        <Link to="/dashboard/warden/fees" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
            <WalletIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Chase fee defaulters</p>
            <p className="truncate text-xs text-slate-400">View pending &amp; overdue fees</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
