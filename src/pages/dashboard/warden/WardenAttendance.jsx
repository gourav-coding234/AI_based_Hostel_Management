import { Card, Pill, ProgressBar } from "../../../components/dashboard/student/ui";
import { CheckSquareIcon } from "../../../components/dashboard/warden/icons";
import { wingAttendanceToday, attendanceTrend, repeatAbsentees } from "../../../data/wardenMock";

export default function WardenAttendance() {
  const totalPresent = wingAttendanceToday.reduce((s, w) => s + w.present, 0);
  const totalStudents = wingAttendanceToday.reduce((s, w) => s + w.total, 0);
  const overallPct = Math.round((totalPresent / totalStudents) * 100);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <CheckSquareIcon />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">Tonight's dinner attendance</p>
            <p className="text-sm text-slate-500">{totalPresent} of {totalStudents} present ({overallPct}%) across the hostel</p>
          </div>
        </div>
      </Card>

      <Card title="Attendance by wing">
        <div className="flex flex-col gap-5">
          {wingAttendanceToday.map((w) => {
            const pct = Math.round((w.present / w.total) * 100);
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

      <Card title="This week's attendance trend">
        <div className="flex items-end gap-3 sm:gap-5">
          {attendanceTrend.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end rounded-lg bg-slate-100">
                <div className="w-full rounded-lg bg-teal-500" style={{ height: `${d.pct}%` }} title={`${d.pct}%`} />
              </div>
              <span className="text-xs font-medium text-slate-500">{d.day}</span>
              <span className="text-xs text-slate-400">{d.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Repeat absentees — flagged for follow-up">
        {repeatAbsentees.length === 0 ? (
          <p className="text-sm text-slate-400">No students flagged this week.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {repeatAbsentees.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{s.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{s.room} · Last absent {s.lastAbsent}</p>
                </div>
                <Pill tone="High">{s.absences} absences</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
