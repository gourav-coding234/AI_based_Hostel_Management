import { useMemo, useState } from "react";
import { Card, Pill, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { EyeIcon, UsersIcon, QrIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";

const statusFilters = ["All Statuses", "On premises", "Checked out"];

export default function Visitors() {
  const visitorsQuery = useCollection("visitors", { orderByField: "inTimeSort" });
  const visitors = visitorsQuery.data.map((v) => ({ ...v, status: v.outTime ? "Checked out" : "On premises" }));
  const wingFilters = ["All Wings", ...Array.from(new Set(visitors.map((v) => v.wing || v.block).filter(Boolean)))];

  const [wingFilter, setWingFilter] = useState("All Wings");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return visitors.filter((v) => {
      const wingOk = wingFilter === "All Wings" || (v.wing || v.block) === wingFilter;
      const statusOk = statusFilter === "All Statuses" || v.status === statusFilter;
      return wingOk && statusOk;
    });
  }, [visitors, wingFilter, statusFilter]);

  const onPremises = visitors.filter((v) => v.status === "On premises").length;

  const columns = [
    {
      key: "visitorName",
      label: "Visitor",
      sortable: true,
      render: (v) => (
        <>
          <p className="font-medium text-ink">{v.visitorName}</p>
          <p className="text-xs text-slate-400">{v.wing || v.block || "—"}</p>
        </>
      ),
    },
    { key: "purpose", label: "Purpose" },
    { key: "inTime", label: "In / Out", sortable: true, render: (v) => `${v.inTime}${v.outTime ? ` → ${v.outTime}` : ""}` },
    { key: "status", label: "Status", render: (v) => <Pill tone={v.status === "On premises" ? "Pending" : "Resolved"}>{v.status}</Pill> },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <EyeIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Visitor management</p>
            <p className="text-sm text-slate-500">Visitor registrations and entry/exit history across your wings.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<UsersIcon />} label="On premises now" value={onPremises} sub="Across all wings" tone={onPremises > 0 ? "amber" : "teal"} />
        <StatCard icon={<EyeIcon />} label="Logged total" value={visitors.length} sub="Visitor check-ins recorded" tone="navy" />
        <StatCard icon={<QrIcon />} label="QR passes issued" value={visitors.length} sub="One per registered visitor" tone="teal" />
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

        <DataTable
          columns={columns}
          rows={filtered}
          loading={visitorsQuery.loading}
          searchKeys={["visitorName", "purpose", "wing", "block"]}
          searchPlaceholder="Search visitors…"
          emptyTitle="No visitors logged yet"
          emptyDescription="Visitor check-ins logged by security will show up here."
          emptyIcon={<EyeIcon />}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
