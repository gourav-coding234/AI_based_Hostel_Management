import { useMemo, useState } from "react";
import { Card, Pill, Button } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { ScanIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { toCsvText, downloadTextFile } from "../../../utils/csv";

const FILTERS = ["All", "In", "Out"];

const columns = [
  { key: "studentName", label: "Student", sortable: true },
  { key: "room", label: "Room", render: (l) => l.room || "—" },
  { key: "passId", label: "Pass ID" },
  { key: "direction", label: "Direction", render: (l) => <Pill tone={l.direction === "Out" ? "Pending" : "Approved"}>{l.direction}</Pill> },
  { key: "time", label: "Time", sortable: true, sortValue: (l) => chronoKey(l) },
  { key: "guard", label: "Logged by" },
];

// Real Firestore Timestamp -> "YYYY-MM-DD HH:mm:ss" (local); blank if the
// scan timestamp isn't there (never invented).
function csvStamp(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// Chronological key: the sortable ISO `timeSort` written with every log,
// falling back to the server scan time for any older entry without one.
function chronoKey(l) {
  if (l.timeSort) return l.timeSort;
  const d = l.scannedAt?.toDate ? l.scannedAt.toDate() : null;
  return d ? d.toISOString() : "";
}

export default function SecurityInOutRegister() {
  const logQuery = useCollection("gateLogs", { orderByField: "timeSort" });
  // gateLogs don't store a wing, so it is looked up from the student's
  // allocation record (same fallback the rest of the app uses).
  const studentsQuery = useCollection("students");
  const [filter, setFilter] = useState("All");

  const rows = useMemo(() => {
    return logQuery.data.filter((l) => filter === "All" || l.direction === filter);
  }, [logQuery.data, filter]);

  const wingByStudent = useMemo(
    () => new Map(studentsQuery.data.map((st) => [st.id, st.wing || st.hostelResidence || ""])),
    [studentsQuery.data]
  );

  // Export the WHOLE filtered dataset from the live gateLogs query — not the
  // paginated slice the table shows — oldest first.
  const exportRows = useMemo(
    () => [...rows].sort((a, b) => chronoKey(a).localeCompare(chronoKey(b))),
    [rows]
  );

  const csvColumns = [
    { label: "Student ID", value: (l) => l.studentId },
    { label: "Student Name", value: (l) => l.studentName },
    { label: "Room", value: (l) => l.room },
    { label: "Block/Wing", value: (l) => l.wing || wingByStudent.get(l.studentId) || "" },
    { label: "Gate Pass ID", value: (l) => l.passId },
    { label: "Direction", value: (l) => l.direction },
    { label: "Time", value: (l) => l.time },
    { label: "Security Guard", value: (l) => l.guard },
    { label: "Scan Timestamp", value: (l) => csvStamp(l.scannedAt) },
  ];

  function download() {
    if (exportRows.length === 0) return;
    downloadTextFile(toCsvText(exportRows, csvColumns), "in-out-register.csv");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card
        title="In / Out register"
        action={
          <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={download} disabled={logQuery.loading || exportRows.length === 0}>
            Download ({exportRows.length})
          </Button>
        }
      >
        <div className="mb-4 flex gap-2 rounded-full border border-slate-200 bg-slate-50/60 p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                filter === f ? "bg-navy-950 text-white shadow-sm" : "text-slate-500 hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={logQuery.loading}
          searchKeys={["studentName", "room", "passId", "guard"]}
          searchPlaceholder="Search by student name…"
          emptyTitle="No gate activity logged yet"
          emptyDescription="Entries logged from Gate Scan will show up here."
          emptyIcon={<ScanIcon />}
          pageSize={12}
        />
      </Card>
    </div>
  );
}
