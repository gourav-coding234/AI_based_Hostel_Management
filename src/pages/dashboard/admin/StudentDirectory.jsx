import { useMemo, useState } from "react";
import { Card, inputCls, Button, Pill } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { UsersIcon } from "../../../components/dashboard/admin/icons";
import { useStudentDirectory } from "../../../hooks/useStudentDirectory";
import { downloadXlsxFile } from "../../../utils/xlsxExport";
import { useCollection } from "../../../hooks/useCollection";

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
  { key: "regNo", label: "Student ID", render: (row) => row.regNo || "—" },
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
  { label: "Student ID", value: (row) => row.regNo },
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
  const register = useCollection("studentRegister", { live: false, limitCount: 5000 });
  const [genderTab, setGenderTab] = useState("Boys");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const allStudents = useMemo(() => {
    const rows = [];
    [...register.data, ...directory].forEach((student) => {
      const reg = String(student.regNo || student.registrationNo || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
      const email = String(student.email || "").trim().toLowerCase();
      const index = rows.findIndex((old) =>
        (reg && reg === String(old.regNo || old.registrationNo || "").replace(/[^a-z0-9]/gi, "").toLowerCase()) ||
        (email && email === String(old.email || "").trim().toLowerCase()) ||
        (student.accountUid && student.accountUid === (old.accountUid || old.userId))
      );
      const old = index >= 0 ? rows[index] : {};
      const merged = { ...old, ...Object.fromEntries(Object.entries(student).filter(([, value]) => value !== "" && value != null)), regNo: student.regNo || student.registrationNo || old.regNo, gender: student.gender || old.gender, hostelType: student.hostelType || old.hostelType };
      if (index >= 0) rows[index] = merged;
      else rows.push(merged);
    });
    return rows.map((student) => ({ ...student,
      hostelType: student.hostelType || (/^(female|f|girl)/i.test(student.gender || "") ? "Girls Hostel" : /^(male|m|boy)/i.test(student.gender || "") ? "Boys Hostel" : "")
    }));
  }, [register.data, directory]);
  const byGender = useMemo(() => allStudents.filter((student) => {
    const hostel = student.hostelType || (/^(female|f|girl)/i.test(student.gender || "") ? "Girls Hostel" : /^(male|m|boy)/i.test(student.gender || "") ? "Boys Hostel" : "");
    return hostel === (genderTab === "Boys" ? "Boys Hostel" : "Girls Hostel");
  }), [allStudents, genderTab]);
  const hostels = useMemo(() => ["All", ...new Set(byGender.map((student) => student.hostelType).filter(Boolean))], [byGender]);
  const blocks = useMemo(() => ["All", ...new Set(byGender.map((student) => student.wing || student.hostelResidence).filter(Boolean))], [byGender]);
  const filtered = useMemo(() => byGender.filter((student) =>
    (hostelFilter === "All" || student.hostelType === hostelFilter) &&
    (blockFilter === "All" || (student.wing || student.hostelResidence) === blockFilter) &&
    (statusFilter === "All" || (statusFilter === "Account active" ? student.hasAccount && student.status !== "Inactive" : !student.hasAccount || student.status === "Inactive"))),
  [byGender, hostelFilter, blockFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900"><UsersIcon /></span>
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Student directory</h2>
              <p className="text-sm text-slate-500">{filtered.length} of {byGender.length} students · {genderTab}</p>
            </div>
          </div>
        <div className="flex flex-wrap gap-2">
            <div className="flex rounded-xl border border-slate-200 p-1" role="tablist" aria-label="Student gender">
              {["Boys", "Girls"].map((tab) => <button key={tab} role="tab" aria-selected={genderTab === tab} className={`rounded-lg px-3 py-2 text-sm font-semibold ${genderTab === tab ? "bg-navy-950 text-white" : "text-slate-600"}`} onClick={() => { setGenderTab(tab); setHostelFilter("All"); setBlockFilter("All"); }}>{tab}</button>)}
            </div>
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
          loading={loading || register.loading}
          error={error || register.error}
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
