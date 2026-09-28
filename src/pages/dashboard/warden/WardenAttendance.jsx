import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls, ProgressBar } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import DataTable from "../../../components/ui/DataTable";
import { CheckSquareIcon, DownloadIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { useStudentDirectory } from "../../../hooks/useStudentDirectory";
import { saveAttendanceForDate } from "../../../firebase/firestore";
import { downloadXlsxFile } from "../../../utils/xlsxExport";

// The Student/Parent attendance pages already render three statuses
// (Present/Absent/Leave — see student/Attendance.jsx's STATUS_COLORS and
// Pill's tone map), so "Leave" is the one extra state this project
// actually supports beyond Present/Absent, and it's preserved here rather
// than introducing an unrelated "Late"/"Excused" the rest of the app
// doesn't know how to display. "Pending" is a UI-only placeholder for "not
// marked yet" — it is never written to Firestore.
const STATUS_OPTIONS = ["Pending", "Present", "Absent", "Leave"];

function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function formatMarkedAt(ts) {
  // markedAt is a Firestore server timestamp; it can briefly be null
  // client-side right after a write before the snapshot round-trips.
  if (!ts) return "";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function WardenAttendance() {
  const { user, profile } = useAuth();

  // A warden assigned to a specific block (users/{uid}.block — the same
  // field Student Directory's `assignedWing` and Overview's `myWing`
  // already key off) only manages that wing's roster, so any export they
  // take must be scoped the same way rather than leaking every wing's
  // attendance to a wing-restricted warden.
  const assignedWing = profile?.block && profile.block !== "Unassigned" ? profile.block : "";

  const { directory, loading: directoryLoading } = useStudentDirectory();
  const { data: attendance, loading: attendanceLoading } = useCollection("attendance", {
    orderByField: "date",
    orderByDirection: "desc",
  });

  const wingByStudentId = useMemo(() => Object.fromEntries(directory.map((s) => [s.id, s.wing])), [directory]);

  // ---- Take attendance: date picker + editable roster ----
  const [selectedDate, setSelectedDate] = useState(() => toISO(new Date()));

  // Existing attendance docs for the selected date, keyed by studentId —
  // this is what makes "save" an update-in-place instead of a duplicate,
  // and what lets an already-taken day be corrected later.
  const existingForDate = useMemo(() => {
    const map = new Map();
    attendance.forEach((a) => {
      if (a.date === selectedDate) map.set(a.studentId, a);
    });
    return map;
  }, [attendance, selectedDate]);

  const roster = useMemo(
    () => directory.map((s) => ({ ...s, existing: existingForDate.get(s.id) || null })),
    [directory, existingForDate]
  );

  // Local edits for the visible date only — Firestore (via existingForDate
  // above) is what the draft is seeded from and what "after a refresh"
  // reflects; this state never substitutes for it. Re-seeded whenever the
  // selected date changes, so switching dates always starts from what's
  // actually saved rather than carrying over another day's edits.
  const [draftStatus, setDraftStatus] = useState({});
  useEffect(() => {
    const next = {};
    roster.forEach((s) => {
      next[s.id] = s.existing?.status || "Pending";
    });
    setDraftStatus(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, directoryLoading]);

  function setStatus(studentId, status) {
    setDraftStatus((d) => ({ ...d, [studentId]: status }));
  }

  function markAll(status) {
    setDraftStatus((d) => {
      const next = { ...d };
      roster.forEach((s) => {
        next[s.id] = status;
      });
      return next;
    });
  }

  const markedCount = useMemo(
    () => roster.filter((s) => (draftStatus[s.id] || "Pending") !== "Pending").length,
    [roster, draftStatus]
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  async function handleSaveAttendance() {
    setSaveError("");
    setSaveMessage("");

    // Guard against the two things bad input could realistically do here:
    // no date selected, or (defensively) a roster row with no student id.
    if (!selectedDate) {
      setSaveError("Pick a date before saving attendance.");
      return;
    }
    const marked = roster.filter((s) => s.id && (draftStatus[s.id] || "Pending") !== "Pending");
    if (marked.length === 0) {
      setSaveError("Mark at least one student as Present or Absent before saving.");
      return;
    }

    // One row per student, deduped by student id by construction (roster
    // is already one entry per student) — this is what "no duplicate
    // attendance records for the same student/date" comes down to: each
    // save targets at most one doc per (studentId, selectedDate), created
    // if it doesn't exist yet or updated in place if it does.
    const existingIdByStudentId = new Map();
    marked.forEach((s) => {
      if (s.existing?.id) existingIdByStudentId.set(s.id, s.existing.id);
    });

    const records = marked.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      wing: s.wing,
      room: s.room,
      bed: s.bed,
      date: selectedDate,
      status: draftStatus[s.id],
    }));

    setSaving(true);
    try {
      const written = await saveAttendanceForDate(records, existingIdByStudentId, {
        uid: user?.uid,
        name: profile?.name || user?.email || "Warden",
      });
      setSaveMessage(`Saved attendance for ${written} student${written === 1 ? "" : "s"} on ${selectedDate}.`);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      setSaveError("Couldn't save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const rosterColumns = [
    { key: "name", label: "Name", sortable: true },
    { key: "id", label: "Student ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "wing", label: "Wing/Block", sortable: true, render: (r) => r.wing || "—" },
    { key: "room", label: "Room", sortable: true, render: (r) => r.room || "—" },
    { key: "bed", label: "Bed", render: (r) => r.bed || "—" },
    {
      key: "status",
      label: "Attendance",
      render: (r) => (
        <select
          className={`${inputCls} w-36`}
          value={draftStatus[r.id] || "Pending"}
          onChange={(e) => setStatus(r.id, e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === "Pending" ? "Pending / Not marked" : s}</option>
          ))}
        </select>
      ),
    },
  ];

  // ---- Analysis (by wing / trend / repeat absentees) — unchanged in
  // shape, just re-keyed off the date being taken instead of "whatever
  // the newest record in the DB happens to be", so the summary and wing
  // stats update immediately after a save. ----
  const todayRecords = useMemo(() => attendance.filter((a) => a.date === selectedDate), [attendance, selectedDate]);

  // What actually gets exported: the saved Firestore records for the
  // selected date (not the in-progress `draftStatus` edits above), scoped
  // to the warden's assigned wing when they have one.
  const exportRecords = useMemo(
    () => (assignedWing ? todayRecords.filter((a) => (a.wing || wingByStudentId[a.studentId]) === assignedWing) : todayRecords),
    [todayRecords, assignedWing, wingByStudentId]
  );

  const EXCEL_COLUMNS = [
    { label: "Date", value: (r) => r.date },
    { label: "Student ID", value: (r) => r.studentId },
    { label: "Student Name", value: (r) => r.studentName },
    { label: "Wing/Block", value: (r) => r.wing || "" },
    { label: "Room", value: (r) => r.room || "" },
    { label: "Bed", value: (r) => r.bed || "" },
    { label: "Status", value: (r) => r.status },
    { label: "Marked By", value: (r) => r.markedByName || "" },
    { label: "Marked At", value: (r) => formatMarkedAt(r.markedAt) },
  ];

  async function handleDownloadExcel() {
    if (exportRecords.length === 0) return;
    await downloadXlsxFile(exportRecords, EXCEL_COLUMNS, `attendance-${selectedDate}.xlsx`, "Attendance");
  }

  const byWing = useMemo(() => {
    const map = new Map();
    todayRecords.forEach((a) => {
      const wing = a.wing || wingByStudentId[a.studentId] || "Unassigned";
      if (!map.has(wing)) map.set(wing, { present: 0, total: 0 });
      const entry = map.get(wing);
      entry.total += 1;
      if (a.status === "Present") entry.present += 1;
    });
    return Array.from(map.entries()).map(([wing, v]) => ({ wing, ...v }));
  }, [todayRecords, wingByStudentId]);

  const totalPresent = todayRecords.filter((a) => a.status === "Present").length;
  const totalAbsent = todayRecords.filter((a) => a.status === "Absent").length;
  const totalMarked = todayRecords.length;
  const overallPct = totalMarked ? Math.round((totalPresent / totalMarked) * 100) : 0;

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

  const loading = directoryLoading || attendanceLoading;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <CheckSquareIcon />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">Attendance for {selectedDate}</p>
              <p className="text-sm text-slate-500">
                {totalMarked > 0
                  ? `${totalPresent} present · ${totalAbsent} absent · ${overallPct}% present of ${totalMarked} marked`
                  : "No attendance marked for this date yet"}
              </p>
            </div>
          </div>
          <Field label="Date">
            <input
              type="date"
              className={`${inputCls} sm:w-44`}
              value={selectedDate}
              max={toISO(new Date())}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Take attendance"
        subtitle="Loaded from the Student Directory — room, bed and wing always match each student's current allocation."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {markedCount} of {roster.length} marked
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => markAll("Present")}>
                Mark all Present
              </Button>
              <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => markAll("Absent")}>
                Mark all Absent
              </Button>
            </div>
          </div>

          <DataTable
            columns={rosterColumns}
            rows={roster}
            loading={loading}
            searchKeys={["name", "id", "room"]}
            searchPlaceholder="Search by name, room, or ID…"
            emptyTitle="No students in the directory yet"
            emptyDescription="Add Student accounts and room allocations first — see Student Directory."
            emptyIcon={<CheckSquareIcon />}
            pageSize={20}
          />

          {saveError && <p className="text-sm text-rose-600">{saveError}</p>}
          {saveMessage && <p className="text-sm text-teal-700">{saveMessage}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSaveAttendance} disabled={saving || loading}>
              {saving ? "Saving…" : "Save attendance"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadExcel}
              disabled={loading || exportRecords.length === 0}
              title={exportRecords.length === 0 ? `No attendance recorded for ${selectedDate} yet.` : undefined}
            >
              <DownloadIcon /> Download Excel
            </Button>
          </div>
          {!loading && exportRecords.length === 0 && (
            <p className="text-xs text-slate-400">No attendance recorded for {selectedDate} yet — nothing to export.</p>
          )}
        </div>
      </Card>

      {attendance.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckSquareIcon />}
            title="No attendance recorded yet"
            description="Mark and save attendance above — it will show up here."
          />
        </Card>
      ) : (
        <>
          <Card title="Attendance by wing">
            {byWing.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No attendance marked for {selectedDate} yet.</p>
            ) : (
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
            )}
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
        </>
      )}
    </div>
  );
}
