import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, StatCard, ProgressBar } from "../../../components/dashboard/student/ui";
import {
  BedIcon,
  WalletIcon,
  CheckSquareIcon,
  WrenchIcon,
  UsersIcon,
  ArrowRightIcon,
} from "../../../components/dashboard/warden/icons";
import {
  hostelStats,
  feeCollectionStats,
  attendanceTrend,
  allComplaints,
  roomRequests,
  inventoryRequests,
  wardenNotices,
} from "../../../data/wardenMock";

function inr(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function WardenOverview() {
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Warden";

  const occupancyPct = Math.round((hostelStats.occupiedBeds / hostelStats.totalBeds) * 100);
  const collectionPct = Math.round((feeCollectionStats.totalCollected / feeCollectionStats.totalDue) * 100);
  const weekAvgAttendance = Math.round(
    attendanceTrend.reduce((sum, d) => sum + d.pct, 0) / attendanceTrend.length
  );
  const openComplaints = allComplaints.filter((c) => c.status !== "Resolved").length;
  const pendingRequests = roomRequests.length + inventoryRequests.filter((r) => r.status === "Pending").length;

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-navy-950 text-white">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-300">Welcome back,</p>
            <h2 className="font-display text-2xl font-semibold">{displayName}</h2>
            <p className="mt-1.5 text-sm text-slate-300">
              {hostelStats.occupiedBeds} of {hostelStats.totalBeds} beds occupied across A, B & C Wings
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
        <StatCard icon={<BedIcon />} label="Occupancy" value={`${occupancyPct}%`} sub={`${hostelStats.vacantBeds} beds vacant`} tone="teal" />
        <StatCard icon={<WalletIcon />} label="Fee collection" value={`${collectionPct}%`} sub={`${inr(feeCollectionStats.totalCollected)} collected`} tone="amber" />
        <StatCard icon={<CheckSquareIcon />} label="Attendance this week" value={`${weekAvgAttendance}%`} sub="Dinner roll call, avg." tone="teal" />
        <StatCard icon={<WrenchIcon />} label="Open complaints" value={openComplaints} sub={`${allComplaints.length} total filed`} tone={openComplaints > 0 ? "rose" : "teal"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Attendance trend — last 7 days" className="lg:col-span-2">
          <div className="flex items-end gap-3 sm:gap-5">
            {attendanceTrend.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end rounded-lg bg-slate-100">
                  <div className="w-full rounded-lg bg-teal-500" style={{ height: `${d.pct}%` }} title={`${d.pct}%`} />
                </div>
                <span className="text-xs font-medium text-slate-500">{d.day}</span>
                <span className="text-xs text-slate-400">{d.pct}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Needs your attention">
          <ul className="flex flex-col divide-y divide-slate-100">
            <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <span className="text-sm text-ink">Pending room requests</span>
              <Pill tone="Pending">{roomRequests.length}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ink">Pending inventory requests</span>
              <Pill tone="Pending">{inventoryRequests.filter((r) => r.status === "Pending").length}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ink">Unassigned complaints</span>
              <Pill tone="Open">{allComplaints.filter((c) => !c.assignedTo && c.status !== "Resolved").length}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3 last:pb-0">
              <span className="text-sm text-ink">Total pending actions</span>
              <span className="font-display text-sm font-semibold text-ink">{pendingRequests}</span>
            </li>
          </ul>
        </Card>
      </div>

      <Card title="Occupancy vs. fee collection">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Bed occupancy</span>
              <span className="font-semibold text-ink">{hostelStats.occupiedBeds}/{hostelStats.totalBeds}</span>
            </div>
            <ProgressBar value={hostelStats.occupiedBeds} max={hostelStats.totalBeds} tone="teal" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Fee collection</span>
              <span className="font-semibold text-ink">{collectionPct}%</span>
            </div>
            <ProgressBar value={feeCollectionStats.totalCollected} max={feeCollectionStats.totalDue} tone="amber" />
          </div>
        </div>
      </Card>

      <Card title="Recent notices" action={
        <Link to="/dashboard/warden/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
          Manage <ArrowRightIcon />
        </Link>
      }>
        <ul className="flex flex-col divide-y divide-slate-100">
          {wardenNotices.slice(0, 3).map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{n.target} · {n.date}</p>
              </div>
              <Pill tone={n.priority}>{n.priority}</Pill>
            </li>
          ))}
        </ul>
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
            <p className="truncate text-xs text-slate-400">{hostelStats.vacantBeds} beds free right now</p>
          </div>
        </Link>
        <Link to="/dashboard/warden/fees" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
            <WalletIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Chase fee defaulters</p>
            <p className="truncate text-xs text-slate-400">View pending & overdue fees</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
