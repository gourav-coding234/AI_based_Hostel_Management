import { useMemo, useState } from "react";
import { Card, Pill, Button, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { QrIcon, CheckIcon, XIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { updateDocument } from "../../../firebase/firestore";

const statusFilters = ["All Statuses", "Pending", "Approved", "Rejected", "Completed"];

export default function GatePasses() {
  const passesQuery = useCollection("gatePasses", { orderByField: "from" });
  const passes = passesQuery.data;
  const wingFilters = ["All Wings", ...Array.from(new Set(passes.map((p) => p.wing).filter(Boolean)))];

  const [wingFilter, setWingFilter] = useState("All Wings");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return passes.filter((p) => {
      const wingOk = wingFilter === "All Wings" || p.wing === wingFilter;
      const statusOk = statusFilter === "All Statuses" || p.status === statusFilter;
      return wingOk && statusOk;
    });
  }, [passes, wingFilter, statusFilter]);

  const pendingCount = passes.filter((p) => p.status === "Pending").length;
  const outCount = passes.filter((p) => p.tripState === "Out").length;

  async function decide(id, status) {
    try {
      await updateDocument("gatePasses", id, { status });
    } catch (err) {
      console.error("Failed to update gate pass:", err);
    }
  }

  const columns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (p) => (
        <>
          <p className="font-medium text-ink">{p.studentName}</p>
          <p className="text-xs text-slate-400">{p.wing || "—"}, {p.room || "—"}</p>
        </>
      ),
    },
    {
      key: "type",
      label: "Type & reason",
      render: (p) => (
        <>
          <p>{p.type}</p>
          <p className="text-xs text-slate-400">{p.reason}</p>
        </>
      ),
    },
    { key: "from", label: "Window", sortable: true, render: (p) => `${p.from} → ${p.to}` },
    { key: "tripState", label: "Trip" },
    {
      key: "status",
      label: "Status / action",
      render: (p) => (
        <div className="flex items-center gap-2">
          <Pill tone={p.status}>{p.status}</Pill>
          {p.status === "Pending" && (
            <>
              <Button variant="outline" className="px-2.5 py-1 text-xs" onClick={() => decide(p.id, "Approved")}>
                <CheckIcon />
              </Button>
              <Button variant="danger" className="px-2.5 py-1 text-xs" onClick={() => decide(p.id, "Rejected")}>
                <XIcon />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <QrIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Gate pass management</p>
            <p className="text-sm text-slate-500">Review, approve, and track outings for students in your wings.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<QrIcon />} label="Pending requests" value={pendingCount} sub="Awaiting your decision" tone={pendingCount > 0 ? "amber" : "teal"} />
        <StatCard icon={<CheckIcon />} label="Currently out" value={outCount} sub="Students off-campus on a pass" tone="navy" />
        <StatCard icon={<QrIcon />} label="Total this term" value={passes.length} sub="Gate passes recorded" tone="teal" />
      </div>

      <Card title="Gate pass requests">
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
          loading={passesQuery.loading}
          searchKeys={["studentName", "type", "wing", "room"]}
          searchPlaceholder="Search gate passes…"
          emptyTitle="No gate passes yet"
          emptyDescription="Requests submitted by students will show up here."
          emptyIcon={<QrIcon />}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
