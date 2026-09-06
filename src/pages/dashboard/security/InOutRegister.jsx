import { useMemo, useState } from "react";
import { Card, Pill } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { ScanIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";

const FILTERS = ["All", "In", "Out"];

const columns = [
  { key: "studentName", label: "Student", sortable: true },
  { key: "room", label: "Room", render: (l) => l.room || "—" },
  { key: "passId", label: "Pass ID" },
  { key: "direction", label: "Direction", render: (l) => <Pill tone={l.direction === "Out" ? "Pending" : "Approved"}>{l.direction}</Pill> },
  { key: "time", label: "Time", sortable: true },
  { key: "guard", label: "Logged by" },
];

export default function SecurityInOutRegister() {
  const logQuery = useCollection("gateLogs", { orderByField: "timeSort" });
  const [filter, setFilter] = useState("All");

  const rows = useMemo(() => {
    return logQuery.data.filter((l) => filter === "All" || l.direction === filter);
  }, [logQuery.data, filter]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="In / Out register">
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
