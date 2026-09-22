import { Card, Button } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { ChartIcon, DownloadIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";
import { downloadTextFile } from "../../../utils/csv";

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]).filter((h) => h !== "createdAt" && h !== "updatedAt");
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

function download(rows, name) {
  downloadTextFile(toCsv(rows), `${name.toLowerCase().replace(/\s+/g, "-")}.csv`);
}

export default function Reports() {
  const { data, loading } = useCollections({
    students: { name: "students" },
    fees: { name: "fees" },
    blocks: { name: "blocks" },
    complaints: { name: "complaints" },
  });

  const reports = [
    { id: "RPT-STU", name: "Student directory", description: "Full list of residents with room, block and contact details.", rows: data.students },
    { id: "RPT-FEE", name: "Fee collection summary", description: "Per-student dues, collections and outstanding balances.", rows: data.fees },
    { id: "RPT-OCC", name: "Occupancy report", description: "Room and bed occupancy across every block.", rows: data.blocks },
    { id: "RPT-CMP", name: "Complaints log", description: "All complaints filed institute-wide with current status.", rows: data.complaints },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <ChartIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Reports & export</p>
            <p className="text-sm text-slate-500">Download institute-wide data as CSV for offline review or sharing.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-semibold text-ink">{r.name}</p>
                <p className="mt-1 text-sm text-slate-500">{r.description}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {loading ? "Loading…" : `${r.rows.length} row${r.rows.length === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>
            <Button variant="outline" className="mt-4" disabled={loading || r.rows.length === 0} onClick={() => download(r.rows, r.name)}>
              <DownloadIcon /> Download CSV
            </Button>
          </Card>
        ))}
      </div>

      {!loading && data.students.length === 0 && data.fees.length === 0 && data.blocks.length === 0 && data.complaints.length === 0 && (
        <EmptyState icon={<ChartIcon />} title="No data to export yet" description="Once records exist in the database, they'll be downloadable here." />
      )}
    </div>
  );
}
