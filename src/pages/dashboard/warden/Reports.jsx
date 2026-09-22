import { Card, Button } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { ChartIcon, DownloadIcon } from "../../../components/dashboard/warden/icons";
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
    complaints: { name: "complaints" },
    leaveRequests: { name: "leaveRequests" },
    visitors: { name: "visitors" },
  });

  const reports = [
    { id: "RPT-OCC", name: "Room occupancy", description: "Room and bed occupancy for your wings.", rows: data.students },
    { id: "RPT-CMP", name: "Complaints log", description: "All complaints filed with current status.", rows: data.complaints },
    { id: "RPT-LV", name: "Leave requests", description: "Leave applications and their approval status.", rows: data.leaveRequests },
    { id: "RPT-VIS", name: "Visitor log", description: "Visitor check-ins and check-outs.", rows: data.visitors },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <ChartIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Reports &amp; export</p>
            <p className="text-sm text-slate-500">Download data for your wings as CSV for offline review or sharing.</p>
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

      {!loading && Object.values(data).every((rows) => rows.length === 0) && (
        <EmptyState icon={<ChartIcon />} title="No data to export yet" description="Once records exist in the database, they'll be downloadable here." />
      )}
    </div>
  );
}
