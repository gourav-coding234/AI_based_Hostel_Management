import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, StatCard, Button } from "../../../components/dashboard/student/ui";
import {
  BedIcon,
  WalletIcon,
  CheckSquareIcon,
  WrenchIcon,
  MegaphoneIcon,
  QrIcon,
  UtensilsIcon,
  ArrowRightIcon,
} from "../../../components/dashboard/student/icons";
import {
  myAllocation,
  feeSummary,
  attendanceHistory,
  initialComplaints,
  initialGatePasses,
  notices,
} from "../../../data/studentMock";

export default function Overview() {
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";

  const feeRemaining = feeSummary.total - feeSummary.paid;
  const weekAvgAttendance = Math.round(
    attendanceHistory.reduce((sum, d) => sum + d.pct, 0) / attendanceHistory.length
  );
  const openComplaints = initialComplaints.filter((c) => c.status !== "Resolved").length;
  const activePass = initialGatePasses.find((p) => p.status === "Approved");

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-navy-950 text-white">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-300">Welcome back,</p>
            <h2 className="font-display text-2xl font-semibold">{displayName}</h2>
            <p className="mt-1.5 text-sm text-slate-300">
              {myAllocation.room} · {myAllocation.bed} · {myAllocation.wing}, {myAllocation.floor}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/student/complaints">
              <Button variant="outline" className="border-white/20 text-white hover:border-teal-300 hover:text-teal-300">
                Raise a complaint
              </Button>
            </Link>
            <Link to="/dashboard/student/gate-pass">
              <Button className="bg-teal-500 hover:bg-teal-400">Request gate pass</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BedIcon />}
          label="Room & bed status"
          value={myAllocation.status}
          sub={`${myAllocation.room} · ${myAllocation.bed}`}
          tone="teal"
        />
        <StatCard
          icon={<WalletIcon />}
          label="Fees remaining"
          value={`₹${feeRemaining.toLocaleString("en-IN")}`}
          sub={`Due ${feeSummary.dueDate}`}
          tone="amber"
        />
        <StatCard
          icon={<CheckSquareIcon />}
          label="Attendance this week"
          value={`${weekAvgAttendance}%`}
          sub="Dinner roll call, avg."
          tone="teal"
        />
        <StatCard
          icon={<WrenchIcon />}
          label="Open complaints"
          value={openComplaints}
          sub={`${initialComplaints.length} total filed`}
          tone={openComplaints > 0 ? "rose" : "teal"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Recent notices" className="lg:col-span-2" action={
          <Link to="/dashboard/student/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            View all <ArrowRightIcon />
          </Link>
        }>
          <ul className="flex flex-col divide-y divide-slate-100">
            {notices.slice(0, 3).map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{n.postedBy} · {n.date}</p>
                </div>
                <Pill tone={n.priority}>{n.priority}</Pill>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Active gate pass">
          {activePass ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <QrIcon />
                </span>
                <Pill tone={activePass.status}>{activePass.status}</Pill>
              </div>
              <p className="text-sm font-medium text-ink">{activePass.type}</p>
              <p className="text-xs text-slate-500">{activePass.from} → {activePass.to}</p>
              <Link to="/dashboard/student/gate-pass">
                <Button variant="outline" className="w-full">View QR pass</Button>
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
        <Link to="/dashboard/student/mess" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <UtensilsIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Report a mess issue</p>
            <p className="truncate text-xs text-slate-400">Food, utensils or quality</p>
          </div>
        </Link>
        <Link to="/dashboard/student/inventory" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
            <BedIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Request extra furniture</p>
            <p className="truncate text-xs text-slate-400">Bed, table or chair</p>
          </div>
        </Link>
        <Link to="/dashboard/student/fees" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
            <WalletIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Pay pending fees</p>
            <p className="truncate text-xs text-slate-400">₹{feeRemaining.toLocaleString("en-IN")} remaining</p>
          </div>
        </Link>
      </div>

      <Card>
        <span className="flex items-center gap-2 text-sm text-slate-400">
          <MegaphoneIcon />
          Warden and admin notices, fee reminders, and mess updates all surface here automatically.
        </span>
      </Card>
    </div>
  );
}
