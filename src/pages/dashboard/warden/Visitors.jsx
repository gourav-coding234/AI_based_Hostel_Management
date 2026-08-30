import { useMemo, useState } from "react";
import { Card, Pill, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import { EyeIcon, UsersIcon, QrIcon } from "../../../components/dashboard/warden/icons";
import { wardenVisitors, wings } from "../../../data/wardenMock";

const wingFilters = ["All Wings", ...wings.map((w) => w.name)];
const statusFilters = ["All Statuses", "On premises", "Checked out"];

export default function Visitors() {
  const [wingFilter, setWingFilter] = useState("All Wings");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return wardenVisitors.filter((v) => {
      const wingOk = wingFilter === "All Wings" || v.wing === wingFilter;
      const statusOk = statusFilter === "All Statuses" || v.status === statusFilter;
      return wingOk && statusOk;
    });
  }, [wingFilter, statusFilter]);

  const onPremises = wardenVisitors.filter((v) => v.status === "On premises").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <EyeIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Visitor management</p>
            <p className="text-sm text-slate-500">Visitor registrations, QR passes, and entry/exit history across your wings.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<UsersIcon />} label="On premises now" value={onPremises} sub="Across all wings" tone={onPremises > 0 ? "amber" : "teal"} />
        <StatCard icon={<EyeIcon />} label="Logged recently" value={wardenVisitors.length} sub="Visitor check-ins recorded" tone="navy" />
        <StatCard icon={<QrIcon />} label="QR passes issued" value={wardenVisitors.length} sub="One per registered visitor" tone="teal" />
      </div>

      <Card title="Visitor log">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <select className={`${inputCls} sm:w-48`} value={wingFilter} onChange={(e) => setWingFilter(e.target.value)}>
            {wingFilters.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No visitors match these filters.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {filtered.map((v) => (
              <li key={v.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{v.name}</p>
                    <span className="text-xs text-slate-400">· {v.wing}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{v.purpose}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    In: {v.checkIn}{v.checkOut ? ` · Out: ${v.checkOut}` : ""}
                  </p>
                </div>
                <Pill tone={v.status === "On premises" ? "Pending" : "Resolved"}>{v.status}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
