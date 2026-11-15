import { useMemo, useState } from "react";
import { Card, inputCls, Button, Pill } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { UsersIcon } from "../../../components/dashboard/admin/icons";
import { useStudentDirectory } from "../../../hooks/useStudentDirectory";
import { downloadXlsxFile } from "../../../utils/xlsxExport";

function dateValue(value) {
  if (value?.toDate) return value.toDate();
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  return dateValue(value)?.toLocaleDateString("en-IN") || "—";
}

const COLUMNS = [
  { key: "name", label: "Student", sortable: true },
  { key: "regNo", label: "Registration no.", sortable: true, render: (row) => row.regNo || "—" },
  { key: "id", label: "Student ID", render: (row) => row.accountUid || row.userId || row.id || "—" },
  { key: "email", label: "Email", render: (row) => row.email || "—" },
  { key: "phone", label: "Contact", render: (row) => row.phone || "—" },
  { key: "hostelType", label: "Hostel", sortable: true, render: (row) => row.hostelType || "—" },
  { key: "wing", label: "Block", sortable: true, render: (row) => row.wing || row.hostelResidence || "—" },
  { key: "room", label: "Room", sortable: true, render: (row) => row.room || "—" },
  { key: "createdAt", label: "Registered", render: (row) => formatDate(row.createdAt || row.registeredAt || row.registrationDate) },
  { key: "status", label: "Account", render: (row) => <Pill tone={row.hasAccount ? "Approved" : "Pending"}>{row.hasAccount ? (row.status || "Active") : "No portal account"}</Pill> },
];

const EXPORT_COLUMNS = [
  { label: "Student Name", value: (row) => row.name },
  { label: "Registration Number", value: (row) => row.regNo },
  { label: "Student ID", value: (row) => row.accountUid || row.userId || row.id },
  { label: "Email", value: (row) => row.email },
  { label: "Contact Number", value: (row) => row.phone },
  { label: "Hostel", value: (row) => row.hostelType },
  { label: "Block", value: (row) => row.wing || row.hostelResidence },
  { label: "Room", value: (row) => row.room },
  { label: "Registration Date", value: (row) => formatDate(row.createdAt || row.registeredAt || row.registrationDate) },
  { label: "Account Status", value: (row) => row.hasAccount ? (row.status || "Active") : "No portal account" },
];

export default function StudentDirectory() {
  const { directory, loading, error } = useStudentDirectory();
  const [hostelFilter, setHostelFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const hostels = useMemo(() => ["All", ...new Set(directory.map((student) => student.hostelType).filter(Boolean))], [directory]);
  const blocks = useMemo(() => ["All", ...new Set(directory.map((student) => student.wing || student.hostelResidence).filter(Boolean))], [directory]);
  const filtered = useMemo(() => directory.filter((student) =>
    (hostelFilter === "All" || student.hostelType === hostelFilter) &&
    (blockFilter === "All" || (student.wing || student.hostelResidence) === blockFilter) &&
    (statusFilter === "All" || (statusFilter === "Account active" ? student.hasAccount && student.status !== "Inactive" : !student.hasAccount || student.status === "Inactive"))),
  [directory, hostelFilter, blockFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900"><UsersIcon /></span>
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Student directory</h2>
              <p className="text-sm text-slate-500">{filtered.length} of {directory.length} hostel residents</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Filter by hostel" className={`${inputCls} sm:w-44`} value={hostelFilter} onChange={(event) => setHostelFilter(event.target.value)}>
              {hostels.map((hostel) => <option key={hostel} value={hostel}>{hostel === "All" ? "All hostels" : hostel}</option>)}
            </select>
            <select aria-label="Filter by block" className={`${inputCls} sm:w-36`} value={blockFilter} onChange={(event) => setBlockFilter(event.target.value)}>
              {blocks.map((block) => <option key={block} value={block}>{block === "All" ? "All blocks" : block}</option>)}
            </select>
            <select aria-label="Filter by account status" className={`${inputCls} sm:w-44`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All account statuses</option>
              <option value="Account active">Account active</option>
              <option value="Account needed">Account needed / inactive</option>
            </select>
            <Button variant="outline" disabled={loading || filtered.length === 0} onClick={() => downloadXlsxFile(filtered, EXPORT_COLUMNS, "student-directory.xlsx", "Student Directory")}>Download Excel</Button>
          </div>
        </div>
      </Card>
      <Card>
        <DataTable
          columns={COLUMNS}
          rows={filtered}
          loading={loading}
          error={error}
          searchKeys={["name", "regNo", "id", "accountUid", "email", "phone", "hostelType", "wing", "hostelResidence", "room"]}
          searchPlaceholder="Search name, registration no., ID, contact, block or room…"
          emptyTitle="No residents match these filters"
          emptyDescription="Check the hostel allocation records or adjust your filters."
          emptyIcon={<UsersIcon />}
          pageSize={20}
        />
      </Card>
    </div>
  );
}
