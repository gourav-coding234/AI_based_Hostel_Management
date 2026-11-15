import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Pill, StatCard, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import DataTable from "../../../components/ui/DataTable";
import { useCollection } from "../../../hooks/useCollection";
import { CheckSquareIcon, UploadIcon } from "../../../components/dashboard/admin/icons";

export default function AdminAttendance() {
  const attendanceQuery = useCollection("attendance", { limitCount: 1000 });
  const [selectedDate, setSelectedDate] = useState("");
  const rows = useMemo(() => attendanceQuery.data.filter((row) => !selectedDate || String(row.date || "").slice(0, 10) === selectedDate), [attendanceQuery.data, selectedDate]);
  const counts = useMemo(() => rows.reduce((total, row) => {
    const status = String(row.status || "").toLowerCase();
    if (status === "present") total.present += 1;
    else if (status === "absent") total.absent += 1;
    else if (status === "leave") total.leave += 1;
    return total;
  }, { present: 0, absent: 0, leave: 0 }), [rows]);

  const columns = [
    { key: "studentName", label: "Student", sortable: true, render: (row) => <><p className="font-medium text-ink">{row.studentName || "—"}</p><p className="text-xs text-slate-400">{row.registrationNo || row.regNo || row.studentId || ""}</p></> },
    { key: "hostel", label: "Hostel", render: (row) => row.hostel || row.hostelType || row.hostelResidence || "—" },
    { key: "wing", label: "Block", render: (row) => row.wing || row.block || "—" },
    { key: "room", label: "Room", render: (row) => row.room || "—" },
    { key: "date", label: "Date", sortable: true },
    { key: "status", label: "Status", render: (row) => <Pill tone={row.status}>{row.status || "—"}</Pill> },
    { key: "markedByName", label: "Marked by", render: (row) => row.markedByName || row.markedBy || "—" },
  ];

  return <div className="flex flex-col gap-6 animate-fade-in">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={<CheckSquareIcon />} label="Attendance records" value={rows.length} sub={selectedDate || "Loaded records · filter by date below"} tone="navy" />
      <StatCard icon={<CheckSquareIcon />} label="Present" value={counts.present} tone="teal" />
      <StatCard icon={<CheckSquareIcon />} label="Absent" value={counts.absent} tone="rose" />
      <StatCard icon={<CheckSquareIcon />} label="On leave" value={counts.leave} tone="amber" />
    </div>
    <Card title="Attendance management" subtitle="Review real attendance records. Import corrected or historical records through Data Import.">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Filter by date"><input type="date" className={`${inputCls} sm:w-56`} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></Field>
        <Link to="/dashboard/admin/data-import" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-700"><UploadIcon /> Import attendance</Link>
      </div>
      <DataTable columns={columns} rows={rows} loading={attendanceQuery.loading} error={attendanceQuery.error} searchKeys={["studentName", "registrationNo", "regNo", "studentId", "hostel", "block", "wing", "room", "date", "status", "markedByName"]} searchPlaceholder="Search student, registration, room, or status…" emptyTitle="No attendance records" emptyDescription="Attendance records will appear when staff take attendance or the admin imports them." emptyIcon={<CheckSquareIcon />} pageSize={15} />
      {!attendanceQuery.error && !attendanceQuery.loading && attendanceQuery.data.length >= 1000 && <p className="mt-3 text-xs text-amber-700">Showing the latest 1,000 records. Use a specific date or import file to manage historical attendance.</p>}
    </Card>
    {attendanceQuery.data.length === 0 && !attendanceQuery.loading && !attendanceQuery.error && <EmptyState title="No attendance data yet" description="Once attendance is recorded, the register and summary cards will update." />}
  </div>;
}
