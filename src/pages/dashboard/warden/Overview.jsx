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
  ArrowRightIcon,
} from "../../../components/dashboard/warden/icons";
import { useCollections } from "../../../hooks/useCollection";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function scopeTo(list, wing) {
  if (!wing) return list;
  return list.filter((x) => (x.wing || x.block) === wing);
}

export default function WardenOverview() {
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Warden";
  const myWing = profile?.block;

  const { data } = useCollections({
    blocks: { name: "blocks" },
    complaints: { name: "complaints", options: { orderByField: "date" } },
    fees: { name: "fees" },
    attendance: { name: "attendance", options: { orderByField: "date", orderByDirection: "desc" } },
    roomRequests: { name: "roomRequests" },
    inventoryRequests: { name: "inventoryRequests" },
    notices: { name: "notices", options: { orderByField: "date", limitCount: 3 } },
  });

  const myBlocks = myWing ? data.blocks.filter((b) => b.name === myWing) : data.blocks;
  const totalBeds = myBlocks.reduce((sum, b) => sum + (Number(b.totalBeds) || 0), 0);
  const occupiedBeds = myBlocks.reduce((sum, b) => sum + (Number(b.occupiedBeds) || 0), 0);
  const vacantBeds = Math.max(totalBeds - occupiedBeds, 0);
  const occupancyPct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const complaints = scopeTo(data.complaints, myWing);
  const fees = myWing ? data.fees.filter((f) => f.block === myWing) : data.fees;
  const attendance = data.attendance;
  const roomRequests = data.roomRequests.filter((r) => r.status === "Pending");
  const inventoryRequests = data.inventoryRequests.filter((r) => r.status === "Pending");

  const totalDue = fees.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const totalCollected = fees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const collectionPct = totalDue ? Math.round((totalCollected / totalDue) * 100) : 0;

  // attendance is ordered newest-first, so the most recent ~70 records are
  // the FIRST 70, not the last 70.
  const weekAttendance = attendance.slice(0, 70); // last ~10 days worth if daily-per-student
  const weekAvgAttendance = weekAttendance.length
    ? Math.round((weekAttendance.filter((a) => a.status === "Present").length / weekAttendance.length) * 100)
    : null;

  const openComplaints = complaints.filter((c) => c.status !== "Resolved").length;
  const pendingRequests = roomRequests.length + inventoryRequests.length;

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
        <StatCard icon={<BedIcon />} label="Occupancy" value={totalBeds ? `${occupancyPct}%` : "—"} sub={totalBeds ? `${vacantBeds} beds vacant` : "No blocks assigned"} tone="teal" />
        <StatCard icon={<WalletIcon />} label="Fee collection" value={totalDue ? `${collectionPct}%` : "—"} sub={totalDue ? `${inr(totalCollected)} collected` : "No fee records yet"} tone="amber" />
        <StatCard icon={<CheckSquareIcon />} label="Attendance" value={weekAvgAttendance === null ? "—" : `${weekAvgAttendance}%`} sub="Recent roll call, avg." tone="teal" />
        <StatCard icon={<WrenchIcon />} label="Open complaints" value={openComplaints} sub={`${complaints.length} total filed`} tone={openComplaints > 0 ? "rose" : "teal"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Needs your attention" className="lg:col-span-3">
          <ul className="flex flex-col divide-y divide-slate-100 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8">
            <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <span className="text-sm text-ink">Pending room requests</span>
              <Pill tone="Pending">{roomRequests.length}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ink">Pending inventory requests</span>
              <Pill tone="Pending">{inventoryRequests.length}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ink">Unassigned complaints</span>
              <Pill tone="Open">{complaints.filter((c) => !c.assignedTo && c.status !== "Resolved").length}</Pill>
            </li>
            <li className="flex items-center justify-between gap-3 py-3 last:pb-0">
              <span className="text-sm text-ink">Total pending actions</span>
              <span className="font-display text-sm font-semibold text-ink">{pendingRequests}</span>
            </li>
          </ul>
        </Card>
      </div>

      {totalBeds > 0 && (
        <Card title="Occupancy vs. fee collection">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Bed occupancy</span>
                <span className="font-semibold text-ink">{occupiedBeds}/{totalBeds}</span>
              </div>
              <ProgressBar value={occupiedBeds} max={totalBeds} tone="teal" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Fee collection</span>
                <span className="font-semibold text-ink">{collectionPct}%</span>
              </div>
              <ProgressBar value={totalCollected} max={totalDue || 1} tone="amber" />
            </div>
          </div>
        </Card>
      )}

      <Card title="Recent notices" action={
        <Link to="/dashboard/warden/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
          Manage <ArrowRightIcon />
        </Link>
      }>
        {data.notices.length === 0 ? (
          <EmptyState title="No notices yet" description="Notices you publish will show up here." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {data.notices.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{n.target} · {n.date}</p>
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
