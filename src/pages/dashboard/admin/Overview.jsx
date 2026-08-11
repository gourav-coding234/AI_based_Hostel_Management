import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, StatCard, ProgressBar } from "../../../components/dashboard/student/ui";
import {
  UsersIcon,
  BuildingIcon,
  WalletIcon,
  WrenchIcon,
  ArrowRightIcon,
  ChartIcon,
} from "../../../components/dashboard/admin/icons";
import {
  overviewStats,
  blocks,
  enrollmentTrend,
  allBlockComplaints,
  feeOverviewByBlock,
  instituteNotices,
} from "../../../data/adminMock";

function inr(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function AdminOverview() {
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Admin";

  const totalBeds = blocks.reduce((sum, b) => sum + b.totalBeds, 0);
  const occupiedBeds = blocks.reduce((sum, b) => sum + b.occupiedBeds, 0);
  const occupancyPct = Math.round((occupiedBeds / totalBeds) * 100);

  const totalDue = feeOverviewByBlock.reduce((sum, f) => sum + f.totalDue, 0);
  const totalCollected = feeOverviewByBlock.reduce((sum, f) => sum + f.collected, 0);
  const collectionPct = Math.round((totalCollected / totalDue) * 100);

  const openComplaints = allBlockComplaints.filter((c) => c.status !== "Resolved").length;
  const maxEnrollment = Math.max(...enrollmentTrend.map((d) => d.students));

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-navy-950 text-white">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-300">Welcome back,</p>
            <h2 className="font-display text-2xl font-semibold">{displayName}</h2>
            <p className="mt-1.5 text-sm text-slate-300">
              {overviewStats.totalStudents} students across {overviewStats.totalBlocks} blocks, managed by {overviewStats.totalWardens} wardens
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/admin/wardens">
              <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-teal-300 hover:text-teal-300">
                Manage wardens
              </span>
            </Link>
            <Link to="/dashboard/admin/users">
              <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-400">
                Add account
              </span>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<UsersIcon />} label="Total students" value={overviewStats.totalStudents} sub={`${overviewStats.totalWardens} wardens on staff`} tone="teal" />
        <StatCard icon={<BuildingIcon />} label="Occupancy" value={`${occupancyPct}%`} sub={`${occupiedBeds}/${totalBeds} beds filled`} tone="navy" />
        <StatCard icon={<WalletIcon />} label="Fee collection" value={`${collectionPct}%`} sub={`${inr(totalCollected)} collected`} tone="amber" />
        <StatCard icon={<WrenchIcon />} label="Open complaints" value={openComplaints} sub={`${allBlockComplaints.length} filed institute-wide`} tone={openComplaints > 0 ? "rose" : "teal"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Enrollment trend — last 6 months" className="lg:col-span-2">
          <div className="flex items-end gap-3 sm:gap-5">
            {enrollmentTrend.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end rounded-lg bg-slate-100">
                  <div
                    className="w-full rounded-lg bg-teal-500"
                    style={{ height: `${(d.students / maxEnrollment) * 100}%` }}
                    title={`${d.students} students`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">{d.month}</span>
                <span className="text-xs text-slate-400">{d.students}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Blocks at a glance">
          <ul className="flex flex-col divide-y divide-slate-100">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.warden}</p>
                </div>
                <Pill tone={b.occupiedBeds / b.totalBeds > 0.95 ? "Urgent" : "General"}>
                  {b.occupiedBeds}/{b.totalBeds}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

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
            <ProgressBar value={totalCollected} max={totalDue} tone="amber" />
          </div>
        </div>
      </Card>

      <Card title="Recent notices" action={
        <Link to="/dashboard/admin/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
          Manage <ArrowRightIcon />
        </Link>
      }>
        <ul className="flex flex-col divide-y divide-slate-100">
          {instituteNotices.slice(0, 3).map((n) => (
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
        <Link to="/dashboard/admin/wardens" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
            <UsersIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Warden roster</p>
            <p className="truncate text-xs text-slate-400">View & reassign block wardens</p>
          </div>
        </Link>
        <Link to="/dashboard/admin/complaints" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
            <WrenchIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Escalated complaints</p>
            <p className="truncate text-xs text-slate-400">{openComplaints} open across all blocks</p>
          </div>
        </Link>
        <Link to="/dashboard/admin/reports" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <ChartIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Reports</p>
            <p className="truncate text-xs text-slate-400">Export institute-wide data</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
