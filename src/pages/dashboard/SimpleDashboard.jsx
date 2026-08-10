import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

const icon = (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 10.5 10 4l7 6.5M5 9.5V17h3.5v-4h3v4H16V9.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Minimal role dashboard: just confirms the sign-in worked and shows who's
 * logged in. Real per-role features (attendance, fees, gate passes, etc.)
 * come in a later phase — this is intentionally bare for now.
 */
export default function SimpleDashboard({ role, dashboardPath }) {
  const { profile, user } = useAuth();

  const navItems = [{ label: "Dashboard", to: dashboardPath, end: true, icon }];

  return (
    <DashboardLayout title={`${role} Dashboard`} navItems={navItems}>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 10.5 8 14.5 16 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">
          You're signed in as {profile?.name || user?.email}
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Role: <span className="font-semibold text-teal-700">{role}</span>
        </p>
        <p className="mx-auto mt-4 max-w-sm text-sm text-slate-400">
          This dashboard is intentionally minimal for now — authentication is working. Features
          for this role will be added in a later phase.
        </p>
      </div>
    </DashboardLayout>
  );
}
