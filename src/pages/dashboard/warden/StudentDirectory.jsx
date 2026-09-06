import { useMemo, useState } from "react";
import { Card, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { UsersIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";

const COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "room", label: "Room", sortable: true, render: (r) => r.room || "—" },
  { key: "wing", label: "Wing", sortable: true, render: (r) => r.wing || "—" },
  { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
  { key: "email", label: "Email", render: (r) => r.email || "—" },
];

export default function StudentDirectory() {
  const studentsQuery = useCollection("students", { orderByField: "name", orderByDirection: "asc" });
  const studentDirectory = studentsQuery.data;

  const [wingFilter, setWingFilter] = useState("All");
  const wings = ["All", ...Array.from(new Set(studentDirectory.map((s) => s.wing).filter(Boolean)))];

  const scoped = useMemo(
    () => (wingFilter === "All" ? studentDirectory : studentDirectory.filter((s) => s.wing === wingFilter)),
    [studentDirectory, wingFilter]
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
              <UsersIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Student directory</p>
              <p className="text-sm text-slate-500">{studentDirectory.length} resident{studentDirectory.length === 1 ? "" : "s"} across the hostel</p>
            </div>
          </div>
          <select className={`${inputCls} sm:w-44`} value={wingFilter} onChange={(e) => setWingFilter(e.target.value)}>
            {wings.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={COLUMNS}
          rows={scoped}
          loading={studentsQuery.loading}
          error={studentsQuery.error}
          searchKeys={["name", "room", "id", "email"]}
          searchPlaceholder="Search by name, room, or ID…"
          emptyTitle="No students yet"
          emptyDescription="Student accounts and room allocations will show up here."
          emptyIcon={<UsersIcon />}
          pageSize={12}
        />
      </Card>
    </div>
  );
}
