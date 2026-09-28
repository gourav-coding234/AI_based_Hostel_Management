import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { CheckSquareIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { useStudentDirectory } from "../../../hooks/useStudentDirectory";
import { saveAttendanceForDate, getCollection } from "../../../firebase/firestore";
import { downloadXlsxFile } from "../../../utils/xlsxExport";

// Security marks Present / Absent. "Not Marked" is the default for a student
// with no record yet — a UI-only placeholder, never written to Firestore
// (same convention as the Warden page), so it can't skew anyone's
// attendance percentage. "Leave" is a status the Warden/Student views
// already use; Security can't set it, but it is shown (and preserved) when
// a record already carries it.
const NOT_MARKED = "Not Marked";
const MARKABLE = ["Present", "Absent"];

// Same date key the Warden Attendance page and Security Overview use, so all
// of them always look at the same day's records.
function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function formatMarkedAt(ts) {
  // markedAt is a Firestore server timestamp; it can briefly be null
  // client-side right after a write before the snapshot round-trips.
  if (!ts) return "";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
}

// Export-only stamp with the year, e.g. "28 Sep 2026, 9:05 am".
function formatMarkedAtFull(ts) {
  if (!ts) return "";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const EXCEL_COLUMNS = [
  { label: "Date", value: (r) => r.date },
  { label: "Student ID", value: (r) => r.studentId },
  { label: "Student Name", value: (r) => r.studentName },
  { label: "Block/Wing", value: (r) => r.wing || "" },
  { label: "Room", value: (r) => r.room || "" },
  { label: "Bed", value: (r) => r.bed || "" },
  { label: "Status", value: (r) => r.status },
  { label: "Marked By", value: (r) => r.markedByName || "" },
  { label: "Marked At", value: (r) => formatMarkedAtFull(r.markedAt) },
];

export default function SecurityAttendance() {
  const { user, profile } = useAuth();

  // Same Student Directory join Warden Attendance uses (users + students,
  // left-joined). Security only reads room/bed/wing from it — nothing on
  // this page can edit them.
  const { directory, loading: directoryLoading } = useStudentDirectory();
  const [selectedDate, setSelectedDate] = useState(() => toISO(new Date()));

  // The selected date's records from the shared `attendance` collection
  // (live), whoever wrote them — Warden or Security.
  const { data: attendance, loading: attendanceLoading } = useCollection("attendance", {
    where: [["date", "==", selectedDate]],
  });

  // Existing docs keyed by studentId: this is what makes a save an
  // update-in-place on the same document instead of a duplicate.
  const existingForDate = useMemo(() => {
    const map = new Map();
    attendance.forEach((a) => map.set(a.studentId, a));
    return map;
  }, [attendance]);

  const roster = useMemo(
    () => directory.map((s) => ({ ...s, existing: existingForDate.get(s.id) || null })),
    [directory, existingForDate]
  );

  // Only the guard's unsaved edits live here, keyed by studentId. A row shows
  // `edits[id] ?? saved status ?? Not Marked`, so saved data (including what
  // the Warden changes while this page is open) always comes from Firestore
  // and is never overwritten by stale local state. Dropped on date change.
  const [edits, setEdits] = useState({});
  const [downloadMessage, setDownloadMessage] = useState("");
  useEffect(() => {
    setEdits({});
    setDownloadMessage("");
  }, [selectedDate]);

  const statusOf = (s) => edits[s.id] ?? s.existing?.status ?? NOT_MARKED;

  function setStatus(studentId, status) {
    setEdits((d) => ({ ...d, [studentId]: status }));
  }

  function markAll(status) {
    setEdits((d) => {
      const next = { ...d };
      roster.forEach((s) => {
        next[s.id] = status;
      });
      return next;
    });
  }

  // Rows whose value differs from what's saved. Only these are written, so
  // students the guard didn't touch keep the Warden's (or an earlier
  // shift's) "marked by" instead of being re-stamped as Security's.
  const changed = useMemo(
    () =>
      roster.filter((s) => {
        const next = edits[s.id];
        return next !== undefined && next !== NOT_MARKED && next !== (s.existing?.status ?? NOT_MARKED);
      }),
    [roster, edits]
  );

  // Summary from the SAVED records of students on the roster. Percentage is
  // Present ÷ marked, the same basis the Warden page uses.
  const summary = useMemo(() => {
    const present = roster.filter((s) => s.existing?.status === "Present").length;
    const absent = roster.filter((s) => s.existing?.status === "Absent").length;
    const marked = roster.filter((s) => s.existing).length;
    return {
      present,
      absent,
      marked,
      notMarked: roster.length - marked,
      pct: marked ? Math.round((present / marked) * 100) : 0,
    };
  }, [roster]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  async function handleSaveAttendance() {
    setSaveError("");
    setSaveMessage("");
    setDownloadMessage("");

    if (!selectedDate) {
      setSaveError("Pick a date before saving attendance.");
      return;
    }
    if (changed.length === 0) {
      setSaveError("Mark at least one student as Present or Absent before saving.");
      return;
    }

    // One row per student. If a record already exists for this student/date
    // (Warden's or Security's) its id is reused so the save updates that same
    // document; new ones get the deterministic studentId_date id. Either way:
    // no duplicates.
    const existingIdByStudentId = new Map();
    changed.forEach((s) => {
      if (s.existing?.id) existingIdByStudentId.set(s.id, s.existing.id);
    });

    const records = changed.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      wing: s.wing,
      room: s.room,
      bed: s.bed,
      date: selectedDate,
      status: edits[s.id],
    }));

    setSaving(true);
    try {
      const written = await saveAttendanceForDate(records, existingIdByStudentId, {
        uid: user?.uid,
        name: profile?.name || user?.email || "Security",
      });
      setEdits({});
      setSaveMessage(`Saved attendance for ${written} student${written === 1 ? "" : "s"} on ${selectedDate}.`);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      setSaveError("Couldn't save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Excel export: re-reads the selected date's records straight from
  // Firestore at click time (every record for that date — not the table's
  // page, not the in-progress edits) and writes a real .xlsx workbook.
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadExcel() {
    if (!selectedDate) return;
    setDownloading(true);
    setDownloadMessage("");
    try {
      const records = await getCollection("attendance", { whereClauses: [["date", "==", selectedDate]] });
      if (records.length === 0) {
        setDownloadMessage(`No attendance has been taken for ${selectedDate} yet — nothing to download.`);
        return;
      }
      const rows = [...records].sort(
        (a, b) => String(a.wing || "").localeCompare(String(b.wing || "")) || String(a.studentName || "").localeCompare(String(b.studentName || ""))
      );
      await downloadXlsxFile(rows, EXCEL_COLUMNS, `attendance-${selectedDate}.xlsx`, "Attendance");
    } catch (err) {
      console.error("Failed to download attendance:", err);
      setDownloadMessage("Couldn't download the attendance sheet. Please try again.");
    } finally {
      setDownloading(false);
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
      render: (r) => {
        const value = statusOf(r);
        // A saved record can't go back to "Not Marked" (Security has no
        // delete), and "Leave" is only listed for records that already have it.
        const options = [
          ...(r.existing ? [] : [NOT_MARKED]),
          ...MARKABLE,
          ...(r.existing?.status === "Leave" ? ["Leave"] : []),
        ];
        return (
          <select className={`${inputCls} w-36`} value={value} onChange={(e) => setStatus(r.id, e.target.value)}>
            {options.map((o) => (
              <option key={o} value={o} disabled={o === "Leave"}>{o}</option>
            ))}
          </select>
        );
      },
    },
    {
      key: "markedBy",
      label: "Last marked by",
      // Who last updated this student's record for the date (and when), so a
      // guard can see the Warden — or another shift — already took it.
      render: (r) =>
        r.existing ? (
          <span className="text-xs text-slate-500">
            {r.existing.markedByName || "Staff"}
            {formatMarkedAt(r.existing.markedAt) ? ` · ${formatMarkedAt(r.existing.markedAt)}` : ""}
          </span>
        ) : (
          <span className="text-xs text-slate-300">Not marked yet</span>
        ),
    },
  ];

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
                {summary.marked > 0
                  ? `${summary.marked} of ${roster.length} already marked for this date`
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
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Take attendance"
        subtitle="Loaded from the Student Directory — room, bed and wing always match each student's current allocation. If the Warden already marked a student for this date, saving here updates that same record instead of creating a duplicate."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {changed.length} unsaved change{changed.length === 1 ? "" : "s"}
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
            emptyDescription="Students will appear here once Wardens/Admins add accounts and room allocations."
            emptyIcon={<CheckSquareIcon />}
            pageSize={20}
          />

          {saveError && <p className="text-sm text-rose-600">{saveError}</p>}
          {saveMessage && <p className="text-sm text-teal-700">{saveMessage}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSaveAttendance} disabled={saving || loading || changed.length === 0}>
              {saving ? "Saving…" : "Save attendance"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadExcel}
              disabled={loading || downloading || attendance.length === 0}
              title={attendance.length === 0 ? `No attendance recorded for ${selectedDate} yet.` : undefined}
            >
              {downloading ? "Preparing…" : "Download Excel"}
            </Button>
          </div>
          {!loading && attendance.length === 0 && (
            <p className="text-xs text-slate-400">No attendance recorded for {selectedDate} yet — nothing to export.</p>
          )}
          {downloadMessage && <p className="text-sm text-rose-600">{downloadMessage}</p>}
        </div>
      </Card>

      <Card title="Attendance summary">
        {loading ? (
          <p className="py-4 text-center text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="Present">{summary.present} Present</Pill>
            <Pill tone="Absent">{summary.absent} Absent</Pill>
            <Pill tone="Pending">{summary.notMarked} Not Marked</Pill>
            <span className="text-sm font-semibold text-ink">
              {summary.pct}% attendance
              <span className="ml-1 text-xs font-normal text-slate-400">
                ({summary.present} of {summary.marked} marked · {selectedDate})
              </span>
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
