import { Link } from "react-router-dom";
import { StatCard, Pill } from "../../../components/dashboard/student/ui";
import ActivityFeed from "../../../components/dashboard/ActivityFeed";
import { QrIcon, ScanIcon, UserPlusIcon, SirenIcon, ArrowRightIcon } from "../../../components/dashboard/security/icons";
import { gatePassLog, initialInOutLog, initialVisitors, initialIncidents } from "../../../data/securityMock";

export default function SecurityOverview() {
  const currentlyOut = gatePassLog.filter((p) => p.tripState === "Out").length;
  const expiringSoon = gatePassLog.filter((p) => p.status === "Approved" && p.tripState !== "Returned").length;
  const visitorsToday = initialVisitors.filter((v) => v.checkIn.startsWith("10 Aug")).length;
  const openIncidents = initialIncidents.filter((i) => i.status !== "Resolved").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<QrIcon />} label="Students currently out" value={currentlyOut} sub="Live gate pass status" tone="amber" />
        <StatCard icon={<ScanIcon />} label="Passes to watch" value={expiringSoon} sub="Approved, not yet returned" tone="navy" />
        <StatCard icon={<UserPlusIcon />} label="Visitors today" value={visitorsToday} sub={`${initialVisitors.length} logged total`} tone="teal" />
        <StatCard icon={<SirenIcon />} label="Open incidents" value={openIncidents} sub={`${initialIncidents.length} logged total`} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed
          title="Recent gate activity"
          items={initialInOutLog.slice(0, 4).map((l) => ({
            id: l.id,
            title: `${l.student} — ${l.direction} (${l.passId})`,
            subtitle: `${l.room} · logged by ${l.guard}`,
            meta: l.time,
          }))}
        />
        <ActivityFeed
          title="Recent visitors"
          items={initialVisitors.map((v) => ({
            id: v.id,
            title: v.name,
            subtitle: v.purpose,
            meta: v.status,
          }))}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Quick actions</h3>
            <p className="mt-1 text-sm text-slate-500">Jump straight to the most common gate-desk tasks.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            to="/dashboard/security/gate-scan"
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-teal-300 hover:text-teal-700"
          >
            Verify a gate pass <ArrowRightIcon />
          </Link>
          <Link
            to="/dashboard/security/visitors"
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-teal-300 hover:text-teal-700"
          >
            Log a new visitor <ArrowRightIcon />
          </Link>
          <Link
            to="/dashboard/security/incidents"
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-teal-300 hover:text-teal-700"
          >
            Report an incident <ArrowRightIcon />
          </Link>
        </div>
      </div>

      {initialIncidents.some((i) => i.status !== "Resolved") && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          There are open incidents that may need follow-up.{" "}
          <Link to="/dashboard/security/incidents" className="font-semibold underline">
            Review incidents
          </Link>
          .
        </div>
      )}
    </div>
  );
}
