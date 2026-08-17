import { useEffect, useMemo, useState } from "react";
import { Card, Pill, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import DonutChart from "../../../components/dashboard/student/DonutChart";
import { CheckSquareIcon } from "../../../components/dashboard/parent/icons";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";
import { useStudentCollection } from "../../../hooks/useStudentCollection";

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

function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function ParentAttendance() {
  // IMPORTANT: every hook below runs unconditionally, on every render, in
  // the same order — the "not linked / loading / error" early return only
  // happens in the JSX at the very end, never in the middle of these calls.
  const linked = useLinkedStudent();
  const { studentUser, linkedStudentId } = linked;
  const attendance = useStudentCollection("attendance", linkedStudentId, { orderByField: "date", orderByDirection: "asc" });
  const log = attendance.items;

  const logByDate = useMemo(() => new Map(log.map((r) => [r.date, r])), [log]);
  const allMonths = useMemo(() => {
    const set = new Set(log.map((r) => r.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [log]);
  const rangeBounds = log.length ? { start: log[0].date, end: log[log.length - 1].date } : null;

  const [mode, setMode] = useState("day");
  const [calendarMonth, setCalendarMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [pickedMonth, setPickedMonth] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  // Fill in sensible defaults once real data arrives (data loads
  // asynchronously, so it isn't available yet when useState first runs).
  // Only sets values that are still empty, so it never clobbers a date the
  // user already picked.
  useEffect(() => {
    if (!rangeBounds) return;
    setCalendarMonth((cur) => cur || allMonths[0] || "");
    setSelectedDate((cur) => cur || rangeBounds.end);
    setPickedMonth((cur) => cur || allMonths[0] || "");
    setRangeTo((cur) => cur || rangeBounds.end);
    setRangeFrom((cur) => {
      if (cur) return cur;
      const end = new Date(rangeBounds.end);
      end.setDate(end.getDate() - 29);
      const clamped = toISO(end);
      return clamped < rangeBounds.start ? rangeBounds.start : clamped;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log]);

  const overall = useMemo(() => summarize(log), [log]);

  const calendarDays = useMemo(() => {
    if (!calendarMonth) return [];
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
  }, [calendarMonth, logByDate]);

  const selectedRecord = logByDate.get(selectedDate);
  const monthSummary = useMemo(() => summarize(log.filter((r) => r.date.slice(0, 7) === pickedMonth)), [log, pickedMonth]);
  const rangeSummary = useMemo(
    () => summarize(log.filter((r) => r.date >= rangeFrom && r.date <= rangeTo)),
    [log, rangeFrom, rangeTo]
  );

  function shiftCalendarMonth(delta) {
    const idx = allMonths.indexOf(calendarMonth);
    const nextIdx = idx - delta;
    if (nextIdx >= 0 && nextIdx < allMonths.length) setCalendarMonth(allMonths[nextIdx]);
  }

  const status = <LinkedStudentStatus {...linked} />;
  if (status) return status;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <CheckSquareIcon />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">{studentUser?.name || "Your child"}'s attendance</p>
              <p className="text-sm text-slate-500">
                {log.length === 0 ? "No records yet" : `${overall.pct}% present overall · ${rangeBounds.start} to ${rangeBounds.end}`}
              </p>
            </div>
          </div>
          {log.length > 0 && (
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
          )}
        </div>
      </Card>

      {attendance.loading && log.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">Loading attendance…</p>
      )}

      {!attendance.loading && log.length === 0 && (
        <EmptyState
          icon={<CheckSquareIcon />}
          title="No attendance records yet"
          description="Night attendance the warden marks for your child will show up here."
        />
      )}

      {log.length > 0 && mode === "day" && (
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
            <p className="font-display text-sm font-semibold text-ink">{calendarMonth ? monthLabel(calendarMonth) : "—"}</p>
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
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                  : "No date selected"}
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

      {log.length > 0 && mode === "month" && (
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
          <p className="mt-5 text-xs text-slate-400">{monthSummary.total} day{monthSummary.total === 1 ? "" : "s"} recorded in {pickedMonth ? monthLabel(pickedMonth) : "—"}</p>
        </Card>
      )}

      {log.length > 0 && mode === "range" && (
        <Card title="Custom date range">
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="From">
              <input type="date" value={rangeFrom} min={rangeBounds.start} max={rangeTo} onChange={(e) => setRangeFrom(e.target.value)} className={inputCls} />
            </Field>
            <Field label="To">
              <input type="date" value={rangeTo} min={rangeFrom} max={rangeBounds.end} onChange={(e) => setRangeTo(e.target.value)} className={inputCls} />
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
