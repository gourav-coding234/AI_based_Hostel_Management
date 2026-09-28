import { useMemo, useState } from "react";
import { Card, Pill, Button, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { QrIcon, CheckIcon, DownloadIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";
import { downloadTextFile } from "../../../utils/csv";

function toCsv(headers, rows) {
  const lines = [headers.map((h) => h.label).join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(h.value(row) ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

const statusFilters = ["All Statuses", "Pending", "Approved", "Rejected", "Completed"];

export default function GatePasses() {
  const { data, loading } = useCollections({
    passes: { name: "gatePasses", options: { orderByField: "from" } },
    blocks: { name: "blocks" },
  });
  const passes = data.passes;
  const blockFilters = ["All Blocks", ...data.blocks.map((b) => b.name)];

  const [blockFilter, setBlockFilter] = useState("All Blocks");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return passes.filter((p) => {
      const blockOk = blockFilter === "All Blocks" || p.block === blockFilter;
      const statusOk = statusFilter === "All Statuses" || p.status === statusFilter;
      return blockOk && statusOk;
    });
  }, [passes, blockFilter, statusFilter]);

  const pendingCount = passes.filter((p) => p.status === "Pending").length;
  const outCount = passes.filter((p) => p.tripState === "Out").length;

  const gatePassCsvHeaders = [
    { label: "Student", value: (p) => p.studentName },
    { label: "Block", value: (p) => p.block },
    { label: "Room", value: (p) => p.room },
    { label: "Type", value: (p) => p.type },
    { label: "Reason", value: (p) => p.reason },
    { label: "From", value: (p) => p.from },
    { label: "To", value: (p) => p.to },
    { label: "Trip State", value: (p) => p.tripState },
    { label: "Status", value: (p) => p.status },
  ];

  function downloadGatePasses() {
    downloadTextFile(toCsv(gatePassCsvHeaders, filtered), "gate-passes.csv");
  }

  const columns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (p) => (
        <>
          <p className="font-medium text-ink">{p.studentName}</p>
          <p className="text-xs text-slate-400">{p.block || "—"}, {p.room || "—"}</p>
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
      label: "Status",
      render: (p) => <Pill tone={p.status}>{p.status}</Pill>,
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
            <p className="text-sm text-slate-500">Every gate pass request institute-wide — view, search, and export for oversight.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<QrIcon />} label="Pending requests" value={pendingCount} sub="Awaiting warden decision" tone={pendingCount > 0 ? "amber" : "teal"} />
        <StatCard icon={<CheckIcon />} label="Currently out" value={outCount} sub="Students off-campus on a pass" tone="navy" />
        <StatCard icon={<QrIcon />} label="Total this term" value={passes.length} sub="Gate passes recorded" tone="teal" />
      </div>

      <Card title="All gate passes">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select className={`${inputCls} sm:w-48`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
              {blockFilters.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button variant="outline" onClick={downloadGatePasses} disabled={filtered.length === 0}>
            <DownloadIcon /> Download CSV
          </Button>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          searchKeys={["studentName", "type", "block", "room"]}
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
