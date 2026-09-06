import { Link } from "react-router-dom";
import { StatCard } from "../../../components/dashboard/student/ui";
import ActivityFeed from "../../../components/dashboard/ActivityFeed";
import { QrIcon, ScanIcon, UserPlusIcon, SirenIcon, ArrowRightIcon } from "../../../components/dashboard/security/icons";
import { useCollections } from "../../../hooks/useCollection";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function SecurityOverview() {
  const { data } = useCollections({
    gatePasses: { name: "gatePasses", options: { orderByField: "from" } },
    gateLogs: { name: "gateLogs", options: { orderByField: "timeSort", limitCount: 4 } },
    visitors: { name: "visitors", options: { orderByField: "inTimeSort", limitCount: 6 } },
    incidents: { name: "incidents", options: { orderByField: "date" } },
  });
  const { gatePasses, gateLogs, visitors, incidents } = data;

  const currentlyOut = gatePasses.filter((p) => p.tripState === "Out").length;
  const expiringSoon = gatePasses.filter((p) => p.status === "Approved" && p.tripState !== "Returned").length;
  const today = todayStr();
  const visitorsToday = visitors.filter((v) => (v.inTime || "").startsWith(today)).length;
  const openIncidents = incidents.filter((i) => i.status !== "Resolved").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<QrIcon />} label="Students currently out" value={currentlyOut} sub="Live gate pass status" tone="amber" />
        <StatCard icon={<ScanIcon />} label="Passes to watch" value={expiringSoon} sub="Approved, not yet returned" tone="navy" />
        <StatCard icon={<UserPlusIcon />} label="Visitors today" value={visitorsToday} sub={`${visitors.length} logged recently`} tone="teal" />
        <StatCard icon={<SirenIcon />} label="Open incidents" value={openIncidents} sub={`${incidents.length} logged total`} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed
          title="Recent gate activity"
          items={gateLogs.map((l) => ({
            id: l.id,
            title: `${l.studentName} — ${l.direction} (${l.passId})`,
            subtitle: `${l.room || "—"} · logged by ${l.guard || "—"}`,
            meta: l.time,
          }))}
        />
        <ActivityFeed
          title="Recent visitors"
          items={visitors.map((v) => ({
            id: v.id,
            title: v.visitorName,
            subtitle: v.purpose,
            meta: v.outTime ? "Checked out" : "On premises",
          }))}
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition-shadow duration-200 hover:shadow-md sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Quick actions</h3>
            <p className="mt-1 text-sm text-slate-500">Jump straight to the most common gate-desk tasks.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            to="/dashboard/security/gate-scan"
            className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 hover:shadow-sm"
          >
            Verify a gate pass <ArrowRightIcon />
          </Link>
          <Link
            to="/dashboard/security/visitors"
            className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 hover:shadow-sm"
          >
            Log a new visitor <ArrowRightIcon />
          </Link>
          <Link
            to="/dashboard/security/incidents"
            className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 hover:shadow-sm"
          >
            Report an incident <ArrowRightIcon />
          </Link>
        </div>
      </div>

      {openIncidents > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 shadow-sm shadow-amber-100">
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
