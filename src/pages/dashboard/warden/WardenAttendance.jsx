import { useMemo } from "react";
import { Card, Pill, ProgressBar } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import DataTable from "../../../components/ui/DataTable";
import { CheckSquareIcon } from "../../../components/dashboard/warden/icons";
import { useCollections } from "../../../hooks/useCollection";

export default function WardenAttendance() {
  const { data, loading } = useCollections({
    attendance: { name: "attendance", options: { orderByField: "date", orderByDirection: "desc" } },
    students: { name: "students" },
  });
  const { attendance, students } = data;

  const wingByStudentId = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s.wing])), [students]);

  // attendance is ordered newest-first (orderByDirection: "desc"), so the
  // latest date is the FIRST record, not the last.
  const latestDate = attendance.length ? attendance[0].date : null;
  const todayRecords = attendance.filter((a) => a.date === latestDate);

  const byWing = useMemo(() => {
    const map = new Map();
    todayRecords.forEach((a) => {
      const wing = wingByStudentId[a.studentId] || "Unassigned";
      if (!map.has(wing)) map.set(wing, { present: 0, total: 0 });
      const entry = map.get(wing);
      entry.total += 1;
      if (a.status === "Present") entry.present += 1;
    });
    return Array.from(map.entries()).map(([wing, v]) => ({ wing, ...v }));
  }, [todayRecords, wingByStudentId]);

  const totalPresent = todayRecords.filter((a) => a.status === "Present").length;
  const totalStudents = todayRecords.length;
  const overallPct = totalStudents ? Math.round((totalPresent / totalStudents) * 100) : 0;

  const trend = useMemo(() => {
    const dates = Array.from(new Set(attendance.map((a) => a.date))).sort().slice(-7);
    return dates.map((date) => {
      const dayRecords = attendance.filter((a) => a.date === date);
      const present = dayRecords.filter((a) => a.status === "Present").length;
      return { day: date, pct: dayRecords.length ? Math.round((present / dayRecords.length) * 100) : 0 };
    });
  }, [attendance]);

  const repeatAbsentees = useMemo(() => {
    const counts = new Map();
    attendance.forEach((a) => {
      if (a.status !== "Absent") return;
      const key = a.studentId;
      if (!counts.has(key)) counts.set(key, { id: key, name: a.studentName, room: a.room, absences: 0, lastAbsent: a.date });
      const entry = counts.get(key);
      entry.absences += 1;
      if (a.date > entry.lastAbsent) entry.lastAbsent = a.date;
    });
    return Array.from(counts.values())
      .filter((e) => e.absences >= 3)
      .sort((a, b) => b.absences - a.absences);
  }, [attendance]);

  if (loading) {
    return <Card><p className="py-10 text-center text-sm text-slate-400">Loading…</p></Card>;
  }

  if (attendance.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <Card>
          <EmptyState icon={<CheckSquareIcon />} title="No attendance recorded yet" description="Attendance you or the mess staff log will show up here." />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <CheckSquareIcon />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">Attendance for {latestDate}</p>
            <p className="text-sm text-slate-500">{totalPresent} of {totalStudents} present ({overallPct}%) across the hostel</p>
          </div>
        </div>
      </Card>

      <Card title="Attendance by wing">
        <div className="flex flex-col gap-5">
          {byWing.map((w) => {
            const pct = w.total ? Math.round((w.present / w.total) * 100) : 0;
            return (
              <div key={w.wing}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{w.wing}</span>
                  <span className="text-slate-500">{w.present}/{w.total} present · {pct}%</span>
                </div>
                <ProgressBar value={w.present} max={w.total} tone={pct >= 90 ? "teal" : pct >= 75 ? "amber" : "rose"} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Attendance trend">
        <div className="flex items-end gap-3 sm:gap-5">
          {trend.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end rounded-lg bg-slate-100">
                <div className="w-full rounded-lg bg-teal-500" style={{ height: `${d.pct}%` }} title={`${d.pct}%`} />
              </div>
              <span className="text-xs font-medium text-slate-500">{d.day.slice(5)}</span>
              <span className="text-xs text-slate-400">{d.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Repeat absentees — flagged for follow-up">
        <DataTable
          columns={[
            { key: "name", label: "Student", sortable: true },
            { key: "room", label: "Room", sortable: true, render: (s) => s.room || "—" },
            { key: "lastAbsent", label: "Last absent", sortable: true },
            { key: "absences", label: "Absences", sortable: true, render: (s) => <Pill tone="High">{s.absences} absences</Pill> },
          ]}
          rows={repeatAbsentees}
          searchKeys={["name", "room"]}
          searchPlaceholder="Search students…"
          emptyTitle="No students flagged"
          emptyDescription="Students absent 3 or more times will show up here."
          pageSize={10}
        />
      </Card>
    </div>
  );
}
