import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, StatCard, ProgressBar } from "../../../components/dashboard/student/ui";
import { EmptyState, ErrorState } from "../../../components/ui/DataState";
import {
  UsersIcon,
  BuildingIcon,
  WalletIcon,
  WrenchIcon,
  ArrowRightIcon,
  ChartIcon,
  QrIcon,
  CalendarClockIcon,
  EyeIcon,
  AlertIcon,
  MegaphoneIcon,
} from "../../../components/dashboard/admin/icons";
import { useCollection, useCollections } from "../../../hooks/useCollection";

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

  // Keep the overview a lightweight snapshot: cap activity lists and reuse
  // the result briefly instead of holding listeners open on every register.
  const { data, loading: snapshotLoading, error: overviewError } = useCollections({
    blocks: { name: "blocks" },
    students: { name: "students" },
    // Overview only needs the count; avoid role + orderBy composite index.
    wardens: { name: "users", options: { where: [["role", "==", "Warden"]], limitCount: 100 } },
    complaints: { name: "complaints", options: { orderByField: "date", limitCount: 100 } },
    fees: { name: "fees" },
    notices: { name: "notices", options: { orderByField: "date", limitCount: 5 } },
    leaveRequests: { name: "leaveRequests", options: { orderByField: "from", limitCount: 100 } },
    visitors: { name: "visitors", options: { where: [["outTime", "==", ""]], limitCount: 100 } },
    expenses: { name: "expenses" },
    feedback: { name: "feedback", options: { limitCount: 100 } },
  }, { live: false, maxDocs: 100, cacheMs: 60_000 });

  const { blocks, students, wardens, complaints, fees, notices, leaveRequests, visitors, expenses, feedback } = data;
  const gatePassQuery = useCollection("gatePasses", { limitCount: 1000 });
  const movementQuery = useCollection("inOutStatus", { limitCount: 2000 });
  const gatePasses = gatePassQuery.data;
  const loading = snapshotLoading || gatePassQuery.loading || movementQuery.loading;
  const studentsOut = movementQuery.data.filter((entry) => entry.status === "OUT").length;
  const recentByDate = (records, field) => [...records].sort((a, b) => String(b[field] || "").localeCompare(String(a[field] || "")));
  const recentComplaints = recentByDate(complaints, "date");
  const recentGatePasses = recentByDate(gatePasses, "from");
  const recentLeaveRequests = recentByDate(leaveRequests, "from");
  const recentNotices = recentByDate(notices, "date").slice(0, 3);

  // Occupancy
  const totalBeds = blocks.reduce((sum, b) => sum + (Number(b.totalBeds) || 0), 0);
  const occupiedBeds = blocks.reduce((sum, b) => sum + (Number(b.occupiedBeds) || 0), 0);
  const occupancyPct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Fees
  const totalDue = fees.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const totalCollected = fees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const totalPending = Math.max(totalDue - totalCollected, 0);
  const totalExpenses = expenses.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
  const availableBalance = totalCollected - totalExpenses;
  const collectionPct = totalDue ? Math.round((totalCollected / totalDue) * 100) : 0;
  const studentsWithDues = fees.filter((f) => (Number(f.total) || 0) - (Number(f.paid) || 0) > 0).length;

  // Complaints
  const openComplaints = complaints.filter((c) => c.status !== "Resolved").length;

  // Gate passes
  const pendingGatePasses = gatePasses.filter((p) => p.status === "Pending").length;

  // Leave requests
  const pendingLeaveRequests = leaveRequests.filter((r) => r.status === "Pending").length;

  // Visitors currently inside
  const visitorsInside = visitors.length;

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
    <div className="admin-overview flex flex-col gap-6 animate-fade-in">
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
            <Link to="/dashboard/admin/users">
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

      <p className="-mt-3 text-xs text-slate-400">This overview uses a short snapshot (up to 100 records per collection) to keep loading light. Figures based on activity lists may be partial; open a register for the full current data.</p>
      {overviewError && <ErrorState message={overviewError} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/dashboard/admin/student-register"><StatCard icon={<UsersIcon />} label="Total students" value={loading ? "…" : students.length} sub={`${wardens.length} wardens on staff`} tone="teal" /></Link>
        <Link to="/dashboard/admin/data-import"><StatCard icon={<BuildingIcon />} label="Hostel occupancy" value={totalBeds ? `${occupancyPct}%` : "—"} sub={totalBeds ? `${occupiedBeds}/${totalBeds} beds filled` : "Add blocks in Data Import"} tone="navy" /></Link>
        <Link to="/dashboard/admin/fees"><StatCard icon={<WalletIcon />} label="Fee collection" value={totalDue ? `${collectionPct}%` : "—"} sub={totalDue ? `${inr(totalCollected)} collected` : "No fee records yet"} tone="amber" /></Link>
        <Link to="/dashboard/admin/complaints"><StatCard icon={<WrenchIcon />} label="Open complaints in snapshot" value={openComplaints} sub={`${complaints.length} recent records loaded`} tone={openComplaints > 0 ? "rose" : "teal"} /></Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link to="/dashboard/admin/gate-passes"><StatCard icon={<QrIcon />} label="Pending gate passes" value={loading ? "…" : pendingGatePasses} sub={`${gatePasses.length} requests total`} tone={pendingGatePasses > 0 ? "amber" : "teal"} /></Link>
        <Link to="/dashboard/admin/gate-passes"><StatCard icon={<QrIcon />} label="Students currently out" value={loading ? "…" : studentsOut} sub="Live gate movement status" tone={studentsOut > 0 ? "amber" : "teal"} /></Link>
        <Link to="/dashboard/admin/leave"><StatCard icon={<CalendarClockIcon />} label="Pending leave requests" value={loading ? "…" : pendingLeaveRequests} sub={`${leaveRequests.length} filed overall`} tone={pendingLeaveRequests > 0 ? "amber" : "teal"} /></Link>
        <Link to="/dashboard/admin/visitors"><StatCard icon={<EyeIcon />} label="Visitors on premises" value={loading ? "…" : visitorsInside} sub="Checked in and not yet checked out" tone={visitorsInside > 0 ? "amber" : "teal"} /></Link>
        <Link to="/dashboard/admin/users"><StatCard icon={<UsersIcon />} label="Total wardens" value={loading ? "…" : wardens.length} sub={`${blocks.length} blocks to manage`} tone="navy" /></Link>
        <Link to="/dashboard/admin/fees"><StatCard icon={<AlertIcon />} label="Students with dues" value={loading ? "…" : studentsWithDues} sub={totalPending ? `${inr(totalPending)} pending` : "No dues pending"} tone={studentsWithDues > 0 ? "rose" : "teal"} /></Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/dashboard/admin/expenses"><StatCard icon={<WalletIcon />} label="Hostel expenses" value={loading ? "..." : inr(totalExpenses)} sub={`${expenses.length} recorded entries`} tone="amber" /></Link>
        <Link to="/dashboard/admin/expenses"><StatCard icon={<WalletIcon />} label="Calculated available balance" value={loading ? "..." : inr(availableBalance)} sub="Collections minus recorded expenses; not a live bank balance" tone={availableBalance < 0 ? "rose" : "teal"} /></Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/dashboard/admin/feedback"><StatCard icon={<MegaphoneIcon />} label="Student feedback" value={loading ? "…" : feedback.length} sub="Items loaded in this overview snapshot" tone="teal" /></Link>
        <Link to="/dashboard/admin/student-register"><StatCard icon={<UsersIcon />} label="Academic student register" value="Open register" sub="Full roster loads only when you open it" tone="navy" /></Link>
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
            <EmptyState icon={<BuildingIcon />} title="No blocks yet" description="Add blocks in Data Import." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {blocks.map((b) => {
                const total = Number(b.totalBeds) || 0;
                const occupied = Number(b.occupiedBeds) || 0;
                const pct = total ? Math.round((occupied / total) * 100) : 0;
                return (
                  <li key={b.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{b.name}</p>
                        <p className="text-xs text-slate-400">{b.warden || "No warden assigned"}</p>
                      </div>
                      <Pill tone={total && occupied / total > 0.95 ? "Urgent" : "General"}>
                        {occupied}/{total}
                      </Pill>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={occupied} max={total || 1} tone={pct > 95 ? "amber" : "teal"} />
                      <span className="w-9 shrink-0 text-right text-xs text-slate-400">{pct}%</span>
                    </div>
                  </li>
                );
              })}
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
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Total fee amount</p>
            <p className="text-sm font-semibold text-ink">{inr(totalDue)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Collected</p>
            <p className="text-sm font-semibold text-ink">{inr(totalCollected)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Pending</p>
            <p className="text-sm font-semibold text-ink">{inr(totalPending)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Collection rate</p>
            <p className="text-sm font-semibold text-ink">{collectionPct}%</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Recent complaints" action={
          <Link to="/dashboard/admin/complaints" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            View all <ArrowRightIcon />
          </Link>
        }>
          {complaints.length === 0 ? (
            <EmptyState icon={<WrenchIcon />} title="No complaints yet" description="Complaints filed by students will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {recentComplaints.slice(0, 3).map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{c.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{c.studentName || "—"} · {c.block || "—"} · {c.date || "—"}</p>
                  </div>
                  <Pill tone={c.status}>{c.status}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent gate pass requests" action={
          <Link to="/dashboard/admin/gate-passes" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            View all <ArrowRightIcon />
          </Link>
        }>
          {gatePasses.length === 0 ? (
            <EmptyState icon={<QrIcon />} title="No gate passes yet" description="Gate pass requests will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {recentGatePasses.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{p.studentName || "—"}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{p.block || "—"} · {p.from} → {p.to}</p>
                  </div>
                  <Pill tone={p.status}>{p.status}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent leave requests" action={
          <Link to="/dashboard/admin/leave" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            View all <ArrowRightIcon />
          </Link>
        }>
          {leaveRequests.length === 0 ? (
            <EmptyState icon={<CalendarClockIcon />} title="No leave requests yet" description="Leave requests will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {recentLeaveRequests.slice(0, 3).map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{r.studentName || "—"}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{r.block || "—"} · {r.from} → {r.to}</p>
                  </div>
                  <Pill tone={r.status}>{r.status}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent notices" action={
          <Link to="/dashboard/admin/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            Manage <ArrowRightIcon />
          </Link>
        }>
          {notices.length === 0 ? (
            <EmptyState icon={<MegaphoneIcon />} title="No notices yet" description="Notices you publish will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {recentNotices.map((n) => (
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/dashboard/admin/users" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
            <UsersIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Users & wardens</p>
            <p className="truncate text-xs text-slate-400">Manage accounts & reassign block wardens</p>
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
        <Link to="/dashboard/admin/gate-passes" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <QrIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Gate passes</p>
            <p className="truncate text-xs text-slate-400">{pendingGatePasses} pending approval</p>
          </div>
        </Link>
        <Link to="/dashboard/admin/leave" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <CalendarClockIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Leave requests</p>
            <p className="truncate text-xs text-slate-400">{pendingLeaveRequests} pending approval</p>
          </div>
        </Link>
        <Link to="/dashboard/admin/visitors" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <EyeIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Visitors</p>
            <p className="truncate text-xs text-slate-400">{visitorsInside} currently on premises</p>
          </div>
        </Link>
        <Link to="/dashboard/admin/fees" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
            <WalletIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Fees</p>
            <p className="truncate text-xs text-slate-400">{studentsWithDues} students with dues</p>
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
