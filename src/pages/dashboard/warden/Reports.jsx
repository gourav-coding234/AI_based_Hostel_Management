import { Card, Button } from "../../../components/dashboard/student/ui";
import { ChartIcon, DownloadIcon } from "../../../components/dashboard/warden/icons";
import {
  reportTypes,
  wings,
  allComplaints,
  leaveRequests,
  wardenVisitors,
} from "../../../data/wardenMock";

// Builds a simple CSV string from an array of flat objects.
function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

// Flatten room/bed occupancy into one row per room for the occupancy report.
const occupancyRows = wings.flatMap((w) =>
  w.rooms.map((r) => ({
    wing: w.name,
    room: r.room,
    capacity: r.capacity,
    occupied: r.beds.filter((b) => b.status === "occupied").length,
    vacant: r.beds.filter((b) => b.status === "vacant").length,
  }))
);

const reportData = {
  "RPT-OCC": occupancyRows,
  "RPT-CMP": allComplaints,
  "RPT-LV": leaveRequests,
  "RPT-VIS": wardenVisitors,
};

function download(id, name) {
  const rows = reportData[id] ?? [];
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
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
        {reportTypes.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-semibold text-ink">{r.name}</p>
                <p className="mt-1 text-sm text-slate-500">{r.description}</p>
                <p className="mt-2 text-xs text-slate-400">{r.rows} row{r.rows === 1 ? "" : "s"}</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => download(r.id, r.name)}>
              <DownloadIcon /> Download CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
