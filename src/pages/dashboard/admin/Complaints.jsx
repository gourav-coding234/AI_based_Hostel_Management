import { useMemo, useState } from "react";
import { Card, Pill, Button, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { WrenchIcon, DownloadIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";
import { downloadTextFile } from "../../../utils/csv";

function toCsv(headers, rows) {
  const lines = [headers.map((h) => h.label).join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(h.value(row) ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

const statusFilters = ["All Statuses", "Open", "In Progress", "Resolved"];

const columns = [
  {
    key: "title",
    label: "Complaint",
    sortable: true,
    render: (c) => (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-ink">{c.title}</span>
        <Pill tone={c.priority}>{c.priority}</Pill>
      </div>
    ),
  },
  {
    key: "studentName",
    label: "Student",
    sortable: true,
    render: (c) => (
      <>
        <p>{c.studentName}</p>
        <p className="text-xs text-slate-400">{c.block || "—"}, {c.room || "—"}</p>
      </>
    ),
  },
  { key: "category", label: "Category" },
  { key: "date", label: "Date", sortable: true },
  { key: "assignedTo", label: "Assigned to", render: (c) => c.assignedTo || "—" },
  { key: "status", label: "Status", render: (c) => <Pill tone={c.status}>{c.status}</Pill> },
];

export default function Complaints() {
  const { data, loading } = useCollections({
    complaints: { name: "complaints", options: { orderByField: "date" } },
    blocks: { name: "blocks" },
  });
  const allComplaints = data.complaints;
  const blockFilters = ["All Blocks", ...data.blocks.map((b) => b.name)];

  const [blockFilter, setBlockFilter] = useState("All Blocks");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filtered = useMemo(() => {
    return allComplaints.filter((c) => {
      const blockOk = blockFilter === "All Blocks" || c.block === blockFilter;
      const statusOk = statusFilter === "All Statuses" || c.status === statusFilter;
      return blockOk && statusOk;
    });
  }, [allComplaints, blockFilter, statusFilter]);

  const openCount = allComplaints.filter((c) => c.status === "Open").length;
  const inProgressCount = allComplaints.filter((c) => c.status === "In Progress").length;
  const resolvedCount = allComplaints.filter((c) => c.status === "Resolved").length;

  const complaintCsvHeaders = [
    { label: "Complaint", value: (c) => c.title },
    { label: "Student", value: (c) => c.studentName },
    { label: "Block", value: (c) => c.block },
    { label: "Room", value: (c) => c.room },
    { label: "Category", value: (c) => c.category },
    { label: "Date", value: (c) => c.date },
    { label: "Assigned To", value: (c) => c.assignedTo },
    { label: "Priority", value: (c) => c.priority },
    { label: "Status", value: (c) => c.status },
  ];

  function downloadComplaints() {
    downloadTextFile(toCsv(complaintCsvHeaders, filtered), "complaints.csv");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
              <WrenchIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">All complaints</p>
              <p className="text-sm text-slate-500">Every complaint filed institute-wide, for escalation and oversight.</p>
            </div>
          </div>
          <div className="flex gap-3 text-xs text-slate-500">
            <span><span className="font-semibold text-ink">{openCount}</span> open</span>
            <span><span className="font-semibold text-ink">{inProgressCount}</span> in progress</span>
            <span><span className="font-semibold text-ink">{resolvedCount}</span> resolved</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select className={`${inputCls} sm:w-48`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
              {blockFilters.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button variant="outline" onClick={downloadComplaints} disabled={filtered.length === 0}>
            <DownloadIcon /> Download CSV
          </Button>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          searchKeys={["title", "studentName", "category", "block", "room"]}
          searchPlaceholder="Search complaints…"
          emptyTitle="No complaints yet"
          emptyDescription="Complaints filed by students institute-wide will show up here."
          emptyIcon={<WrenchIcon />}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
