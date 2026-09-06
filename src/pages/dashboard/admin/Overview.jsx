import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, StatCard, ProgressBar } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import {
  UsersIcon,
  BuildingIcon,
  WalletIcon,
  WrenchIcon,
  ArrowRightIcon,
  ChartIcon,
} from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
}

export default function AdminOverview() {
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Admin";

  const { data, loading } = useCollections({
    blocks: { name: "blocks" },
    students: { name: "students" },
    wardens: { name: "users", options: { where: [["role", "==", "Warden"]] } },
    complaints: { name: "complaints" },
    fees: { name: "fees" },
    notices: { name: "notices", options: { orderByField: "date", limitCount: 3 } },
  });

  const { blocks, students, wardens, complaints, fees, notices } = data;

  const totalBeds = blocks.reduce((sum, b) => sum + (Number(b.totalBeds) || 0), 0);
  const occupiedBeds = blocks.reduce((sum, b) => sum + (Number(b.occupiedBeds) || 0), 0);
  const occupancyPct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const totalDue = fees.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const totalCollected = fees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const collectionPct = totalDue ? Math.round((totalCollected / totalDue) * 100) : 0;

  const openComplaints = complaints.filter((c) => c.status !== "Resolved").length;

  const enrollmentTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString("en-IN", { month: "short" }) });
    }
    const counts = Object.fromEntries(months.map((m) => [m.key, 0]));
    students.forEach((s) => {
      const created = tsToDate(s.createdAt);
      if (!created) return;
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      if (key in counts) counts[key] += 1;
    });
    // cumulative headcount up to each month, ending at current total
    let running = students.length - months.reduce((sum, m) => sum + counts[m.key], 0);
    return months.map((m) => {
      running += counts[m.key];
      return { month: m.month, students: Math.max(running, 0) };
    });
  }, [students]);
  const maxEnrollment = Math.max(1, ...enrollmentTrend.map((d) => d.students));

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
              {students.length} students across {blocks.length} blocks, managed by {wardens.length} wardens
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
        <StatCard icon={<UsersIcon />} label="Total students" value={loading ? "…" : students.length} sub={`${wardens.length} wardens on staff`} tone="teal" />
        <StatCard icon={<BuildingIcon />} label="Occupancy" value={totalBeds ? `${occupancyPct}%` : "—"} sub={totalBeds ? `${occupiedBeds}/${totalBeds} beds filled` : "No blocks recorded yet"} tone="navy" />
        <StatCard icon={<WalletIcon />} label="Fee collection" value={totalDue ? `${collectionPct}%` : "—"} sub={totalDue ? `${inr(totalCollected)} collected` : "No fee records yet"} tone="amber" />
        <StatCard icon={<WrenchIcon />} label="Open complaints" value={openComplaints} sub={`${complaints.length} filed institute-wide`} tone={openComplaints > 0 ? "rose" : "teal"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Enrollment trend — last 6 months" className="lg:col-span-2">
          {students.length === 0 ? (
            <EmptyState title="No students yet" description="Once students are added, the enrollment trend will show here." />
          ) : (
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
          )}
        </Card>

        <Card title="Blocks at a glance">
          {blocks.length === 0 ? (
            <EmptyState icon={<BuildingIcon />} title="No blocks yet" description="Add blocks via Data Import or the Blocks page." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.warden || "No warden assigned"}</p>
                  </div>
                  <Pill tone={b.totalBeds && b.occupiedBeds / b.totalBeds > 0.95 ? "Urgent" : "General"}>
                    {b.occupiedBeds || 0}/{b.totalBeds || 0}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Occupancy vs. fee collection">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Bed occupancy</span>
              <span className="font-semibold text-ink">{occupiedBeds}/{totalBeds}</span>
            </div>
            <ProgressBar value={occupiedBeds} max={totalBeds || 1} tone="teal" />
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

      <Card title="Recent notices" action={
        <Link to="/dashboard/admin/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
          Manage <ArrowRightIcon />
        </Link>
      }>
        {notices.length === 0 ? (
          <EmptyState title="No notices yet" description="Notices you publish will show up here." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {notices.map((n) => (
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
