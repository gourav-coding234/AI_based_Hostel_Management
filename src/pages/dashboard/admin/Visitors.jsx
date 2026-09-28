import { useMemo, useState } from "react";
import { Card, Pill, StatCard, Button, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { EyeIcon, UsersIcon, QrIcon, DownloadIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";
import { downloadTextFile } from "../../../utils/csv";

function toCsv(headers, rows) {
  const lines = [headers.map((h) => h.label).join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(h.value(row) ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

const statusFilters = ["All Statuses", "On premises", "Checked out"];

const columns = [
  {
    key: "visitorName",
    label: "Visitor",
    sortable: true,
    render: (v) => (
      <>
        <p className="font-medium text-ink">{v.visitorName}</p>
        <p className="text-xs text-slate-400">{v.block || "—"}</p>
      </>
    ),
  },
  { key: "purpose", label: "Purpose" },
  { key: "idProof", label: "ID proof", render: (v) => v.idProof || "—" },
  { key: "inTime", label: "In / Out", sortable: true, render: (v) => `${v.inTime}${v.outTime ? ` → ${v.outTime}` : ""}` },
  { key: "status", label: "Status", render: (v) => <Pill tone={v.status === "On premises" ? "Pending" : "Resolved"}>{v.status}</Pill> },
];

export default function Visitors() {
  const { data, loading } = useCollections({
    visitors: { name: "visitors", options: { orderByField: "inTimeSort" } },
    blocks: { name: "blocks" },
  });
  const visitors = data.visitors.map((v) => ({ ...v, status: v.outTime ? "Checked out" : "On premises" }));
  const blockFilters = ["All Blocks", ...data.blocks.map((b) => b.name)];

  const [blockFilter, setBlockFilter] = useState("All Blocks");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return visitors.filter((v) => {
      const blockOk = blockFilter === "All Blocks" || v.block === blockFilter;
      const statusOk = statusFilter === "All Statuses" || v.status === statusFilter;
      return blockOk && statusOk;
    });
  }, [visitors, blockFilter, statusFilter]);

  const onPremises = visitors.filter((v) => v.status === "On premises").length;

  const visitorCsvHeaders = [
    { label: "Visitor Name", value: (v) => v.visitorName },
    { label: "Purpose", value: (v) => v.purpose },
    { label: "ID Proof", value: (v) => v.idProof },
    { label: "Block", value: (v) => v.block },
    { label: "Student/Host", value: (v) => v.hostName || v.studentName },
    { label: "In Time", value: (v) => v.inTime },
    { label: "Out Time", value: (v) => v.outTime },
    { label: "Status", value: (v) => v.status },
  ];

  function downloadVisitors() {
    downloadTextFile(toCsv(visitorCsvHeaders, filtered), "visitors.csv");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <EyeIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Visitor management</p>
            <p className="text-sm text-slate-500">Institute-wide visitor registrations, QR passes, and entry/exit history.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<UsersIcon />} label="On premises now" value={onPremises} sub="Across all blocks" tone={onPremises > 0 ? "amber" : "teal"} />
        <StatCard icon={<EyeIcon />} label="Logged total" value={visitors.length} sub="Visitor check-ins recorded" tone="navy" />
        <StatCard icon={<QrIcon />} label="QR passes issued" value={visitors.length} sub="One per registered visitor" tone="teal" />
      </div>

      <Card title="Visitor log">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select className={`${inputCls} sm:w-48`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
              {blockFilters.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button variant="outline" onClick={downloadVisitors} disabled={filtered.length === 0}>
            <DownloadIcon /> Download CSV
          </Button>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          searchKeys={["visitorName", "purpose", "block"]}
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
