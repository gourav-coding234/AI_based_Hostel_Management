import { useMemo, useState } from "react";
import { Card, Pill, Field, inputCls } from "../../../components/dashboard/student/ui";
import DonutChart from "../../../components/dashboard/student/DonutChart";
import { CheckSquareIcon } from "../../../components/dashboard/parent/icons";
import { attendanceLog, attendanceLogRange } from "../../../data/studentMock";
import { myChild } from "../../../data/parentMock";

const MODES = [
  { id: "day", label: "Day-wise" },
  { id: "month", label: "Month-wise" },
  { id: "range", label: "Date range" },
];

const STATUS_COLORS = {
  Present: "text-teal-500",
  Absent: "text-rose-500",
  Leave: "text-amber-500",
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const logByDate = new Map(attendanceLog.map((r) => [r.date, r]));

function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function summarize(records) {
  const counts = { Present: 0, Absent: 0, Leave: 0 };
  records.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });
  const total = records.length;
  const pct = total ? Math.round((counts.Present / total) * 100) : 0;
  return { counts, total, pct };
}

function segmentsFrom(counts) {
  return [
    { label: "Present", value: counts.Present, colorClass: STATUS_COLORS.Present },
    { label: "Absent", value: counts.Absent, colorClass: STATUS_COLORS.Absent },
    { label: "Leave", value: counts.Leave, colorClass: STATUS_COLORS.Leave },
  ];
}

const allMonths = (() => {
  const set = new Set(attendanceLog.map((r) => r.date.slice(0, 7)));
  return Array.from(set).sort().reverse();
})();

function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function ParentAttendance() {
  const [mode, setMode] = useState("day");
  const [calendarMonth, setCalendarMonth] = useState(allMonths[0]);
  const [selectedDate, setSelectedDate] = useState(attendanceLogRange.end);
  const [pickedMonth, setPickedMonth] = useState(allMonths[0]);
  const [rangeFrom, setRangeFrom] = useState(() => {
    const end = new Date(attendanceLogRange.end);
    end.setDate(end.getDate() - 29);
    return toISO(end);
  });
  const [rangeTo, setRangeTo] = useState(attendanceLogRange.end);

  const overall = useMemo(() => summarize(attendanceLog), []);

  const calendarDays = useMemo(() => {
    const [y, m] = calendarMonth.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const leadingBlanks = first.getDay();
    const cells = Array.from({ length: leadingBlanks }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${calendarMonth}-${String(day).padStart(2, "0")}`;
      cells.push({ day, iso, record: logByDate.get(iso) });
    }
    return cells;
  }, [calendarMonth]);

  const selectedRecord = logByDate.get(selectedDate);
  const monthSummary = useMemo(() => summarize(attendanceLog.filter((r) => r.date.slice(0, 7) === pickedMonth)), [pickedMonth]);
  const rangeSummary = useMemo(
    () => summarize(attendanceLog.filter((r) => r.date >= rangeFrom && r.date <= rangeTo)),
    [rangeFrom, rangeTo]
  );

  function shiftCalendarMonth(delta) {
    const idx = allMonths.indexOf(calendarMonth);
    const nextIdx = idx - delta;
    if (nextIdx >= 0 && nextIdx < allMonths.length) setCalendarMonth(allMonths[nextIdx]);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <CheckSquareIcon />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">{myChild.name}'s attendance</p>
              <p className="text-sm text-slate-500">
                {overall.pct}% present overall · {attendanceLogRange.start} to {attendanceLogRange.end}
              </p>
            </div>
          </div>
          <div className="flex gap-1 rounded-full border border-slate-200 p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  mode === m.id ? "bg-navy-950 text-white" : "text-slate-500 hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {mode === "day" && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftCalendarMonth(-1)}
              disabled={allMonths.indexOf(calendarMonth) >= allMonths.length - 1}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>
            <p className="font-display text-sm font-semibold text-ink">{monthLabel(calendarMonth)}</p>
            <button
              type="button"
              onClick={() => shiftCalendarMonth(1)}
              disabled={allMonths.indexOf(calendarMonth) <= 0}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i} className="pb-1 text-xs font-semibold text-slate-400">{w}</span>
            ))}
            {calendarDays.map((cell, i) => {
              if (!cell) return <span key={i} />;
              const isSelected = cell.iso === selectedDate;
              const dotColor = cell.record ? STATUS_COLORS[cell.record.status] : "text-slate-200";
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => setSelectedDate(cell.iso)}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-xs transition-colors ${
                    isSelected ? "border-navy-950 bg-navy-950/5 font-semibold text-ink" : "border-transparent text-slate-500 hover:border-slate-200"
                  }`}
                >
                  {cell.day}
                  <span className={`h-1.5 w-1.5 rounded-full bg-current ${dotColor}`} />
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-ink">
                {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-xs text-slate-400">Tap any date above to see that day's status</p>
            </div>
            {selectedRecord ? (
              <Pill tone={selectedRecord.status}>{selectedRecord.status}</Pill>
            ) : (
              <Pill tone="Normal">No record</Pill>
            )}
          </div>
        </Card>
      )}

      {mode === "month" && (
        <Card title="Monthly breakdown">
          <div className="mb-5">
            <Field label="Month">
              <select value={pickedMonth} onChange={(e) => setPickedMonth(e.target.value)} className={`${inputCls} sm:w-56`}>
                {allMonths.map((ym) => (
                  <option key={ym} value={ym}>{monthLabel(ym)}</option>
                ))}
              </select>
            </Field>
          </div>
          <DonutChart segments={segmentsFrom(monthSummary.counts)} centerLabel={`${monthSummary.pct}%`} centerSub="present" />
          <p className="mt-5 text-xs text-slate-400">{monthSummary.total} day{monthSummary.total === 1 ? "" : "s"} recorded in {monthLabel(pickedMonth)}</p>
        </Card>
      )}

      {mode === "range" && (
        <Card title="Custom date range">
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="From">
              <input type="date" value={rangeFrom} min={attendanceLogRange.start} max={rangeTo} onChange={(e) => setRangeFrom(e.target.value)} className={inputCls} />
            </Field>
            <Field label="To">
              <input type="date" value={rangeTo} min={rangeFrom} max={attendanceLogRange.end} onChange={(e) => setRangeTo(e.target.value)} className={inputCls} />
            </Field>
          </div>
          {rangeSummary.total === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No attendance records in this range.</p>
          ) : (
            <>
              <DonutChart segments={segmentsFrom(rangeSummary.counts)} centerLabel={`${rangeSummary.pct}%`} centerSub="present" />
              <p className="mt-5 text-xs text-slate-400">{rangeSummary.total} day{rangeSummary.total === 1 ? "" : "s"} between {rangeFrom} and {rangeTo}</p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
