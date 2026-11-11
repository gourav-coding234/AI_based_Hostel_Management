import { useMemo, useState } from "react";
import { downloadCsvAsXlsx } from "../../../utils/xlsxExport";
import { Card, Pill, Button } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { ScanIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import LeaveExit from "./LeaveExit";
import { toCsvText } from "../../../utils/csv";
import { useAuth } from "../../../context/AuthContext";
import { useStudentDirectory } from "../../../hooks/useStudentDirectory";
import { recordManualMovement, recordGateMovement } from "../../../firebase/firestore";
import { isPassOut } from "../../../utils/gatePass";
import { normalizeGender } from "../../../hooks/useAttendanceRoster";

const FILTERS = ["All", "In", "Out"];

const columns = [
  { key: "studentName", label: "Student", sortable: true },
  { key: "room", label: "Room", render: (l) => l.room || "—" },
  { key: "registrationNo", label: "Registration No", render: (l) => l.registrationNo || "—" },
  { key: "gender", label: "Gender", render: (l) => l.gender || "Unspecified" },
  { key: "gatePassId", label: "Pass ID", render: (l) => l.gatePassId || "Manual" },
  { key: "direction", label: "Direction", render: (l) => <Pill tone={l.direction === "Out" || l.type === "OUT" ? "Pending" : "Approved"}>{l.direction || l.type}</Pill> },
  { key: "method", label: "Method", render: (l) => l.method || "Scan" },
  { key: "time", label: "Time", sortable: true, sortValue: (l) => chronoKey(l) },
  { key: "guard", label: "Logged by" },
];

// Real Firestore Timestamp -> "YYYY-MM-DD HH:mm:ss" (local); blank if the
// scan timestamp isn't there (never invented).
function csvStamp(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// Chronological key: the sortable ISO `timeSort` written with every log,
// falling back to the server scan time for any older entry without one.
function chronoKey(l) {
  if (l.timeSort) return l.timeSort;
  const d = l.scannedAt?.toDate ? l.scannedAt.toDate() : null;
  return d ? d.toISOString() : "";
}

export default function SecurityInOutRegister() {
  const { user, profile } = useAuth();
  const logsQuery = useCollection("inOutLogs", { orderByField: "timeSort", limitCount: 500 });
  const oldLogsQuery = useCollection("gateLogs", { orderByField: "timeSort", limitCount: 500 });
  const statusQuery = useCollection("inOutStatus", { limitCount: 1000 });
  const passesQuery = useCollection("gatePasses", { limitCount: 1000 });
  const { directory, loading: directoryLoading } = useStudentDirectory();
  const [filter, setFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const actor = { uid: user?.uid || "", name: profile?.name || user?.email || "Security" };

  const studentById = useMemo(() => new Map(directory.map((student) => [student.id, student])), [directory]);
  const allLogs = useMemo(() => [
    ...logsQuery.data,
    ...oldLogsQuery.data.map((l) => ({ ...l, gatePassId: l.passId, type: String(l.direction || "").toUpperCase() })),
  ].map((log) => {
    const student = studentById.get(log.studentId) || {};
    return { ...log, registrationNo: log.registrationNo || student.regNo || "", gender: log.gender || student.gender || "Unspecified", wing: log.wing || student.wing || "" };
  }), [logsQuery.data, oldLogsQuery.data, studentById]);
  const statusByStudent = useMemo(() => new Map(statusQuery.data.map((entry) => [entry.studentId || entry.id, entry.status])), [statusQuery.data]);
  const activePassByStudent = useMemo(() => new Map(passesQuery.data.filter(isPassOut).map((pass) => [pass.studentId, pass])), [passesQuery.data]);
  const matchedStudents = directory.filter((s) => `${s.name} ${s.regNo} ${s.room}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8);
  const currentlyOut = directory.filter((student) => statusByStudent.get(student.id) === "OUT");
  const outByGender = useMemo(() => ({
    Male: currentlyOut.filter((student) => normalizeGender(student.gender) === "Male").length,
    Female: currentlyOut.filter((student) => normalizeGender(student.gender) === "Female").length,
    Unspecified: currentlyOut.filter((student) => normalizeGender(student.gender) === "Unspecified").length,
  }), [currentlyOut]);

  async function markManual(student) {
    if (busy) return;
    setBusy(student.id);
    setActionError("");
    try { await recordManualMovement(student, actor); }
    catch (err) { console.error("Manual gate movement failed:", err); setActionError("Could not save this entry. Check the security role's Firestore access and try again."); }
    finally { setBusy(""); }
  }

  async function endJourney(student) {
    if (busy) return;
    setBusy(student.id);
    setActionError("");
    try {
      const activePass = activePassByStudent.get(student.id);
      if (activePass) await recordGateMovement(activePass.id, "In", actor, student.id);
      else await recordManualMovement(student, actor);
    } catch (err) {
      console.error("Failed to end the student's journey:", err);
      setActionError("Could not record the student's return. Refresh the register and try again.");
    } finally {
      setBusy("");
    }
  }

  const rows = useMemo(() => {
    return allLogs.filter((l) => (filter === "All" || (l.direction || (l.type === "OUT" ? "Out" : "In")) === filter)
      && (genderFilter === "All" || normalizeGender(l.gender) === genderFilter));
  }, [allLogs, filter, genderFilter]);

  // Export the WHOLE filtered dataset from the live gateLogs query — not the
  // paginated slice the table shows — oldest first.
  const exportRows = useMemo(
    () => [...rows].sort((a, b) => chronoKey(a).localeCompare(chronoKey(b))),
    [rows]
  );

  const csvColumns = [
    { label: "Registration No", value: (l) => l.registrationNo || l.studentId },
    { label: "Student Name", value: (l) => l.studentName },
    { label: "Room", value: (l) => l.room },
    { label: "Block/Wing", value: (l) => l.wing || "" },
    { label: "Gender", value: (l) => l.gender || "Unspecified" },
    { label: "Gate Pass ID", value: (l) => l.gatePassId || l.passId || "Manual" },
    { label: "Direction", value: (l) => l.direction || l.type },
    { label: "Method", value: (l) => l.method || "scan" },
    { label: "Time", value: (l) => l.time },
    { label: "Security Guard", value: (l) => l.guard },
    { label: "Scan Timestamp", value: (l) => csvStamp(l.scannedAt) },
  ];

  function download() {
    if (exportRows.length === 0) return;
    downloadCsvAsXlsx(toCsvText(exportRows, csvColumns), "in-out-register.xlsx");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card
        title="In & Out register"
        action={
          <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={download} disabled={logsQuery.loading || oldLogsQuery.loading || exportRows.length === 0}>
            Download ({exportRows.length})
          </Button>
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Total", directory.length], ["In", Math.max(directory.length - currentlyOut.length, 0)], ["Out", currentlyOut.length], ["Out · Boys / Girls / Unspecified", `${outByGender.Male} / ${outByGender.Female} / ${outByGender.Unspecified}`]].map(([label, count]) => <div key={label} className="rounded-xl border border-slate-200 p-3 text-center"><p className="font-display text-xl font-semibold text-ink">{count}</p><p className="text-xs text-slate-500">{label}</p></div>)}
        </div>
        <div className="mb-6 rounded-xl border border-slate-200 p-4">
          <h3 className="font-display font-semibold text-ink">Manual in / out</h3>
          <p className="mt-1 text-xs text-slate-500">Search by student name or registration number, then tap once to record their next movement.</p>
          <input className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm sm:max-w-lg" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or registration number…" />
          {actionError && <p role="alert" className="mt-2 text-sm text-rose-600">{actionError}</p>}
          {search.trim() && <ul className="mt-3 divide-y divide-slate-100">{matchedStudents.map((student) => {
            const status = statusByStudent.get(student.id) || "IN";
            const activePass = activePassByStudent.get(student.id);
            return <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span className="text-sm text-ink">{student.name} · {student.regNo || "No registration number"} · {student.room || "No room"}</span>
              <div className="flex items-center gap-2"><Pill tone={status === "OUT" ? "Pending" : "Approved"}>{status}</Pill><Button className="px-3 py-1 text-xs" disabled={Boolean(busy) || directoryLoading} onClick={() => status === "OUT" ? endJourney(student) : markManual(student)}>{busy === student.id ? "Saving…" : status === "OUT" ? "End journey / Mark IN" : "Mark OUT"}</Button></div>
              {status === "OUT" && <p className="w-full text-xs text-slate-500">{activePass ? `${activePass.type || "Pass"}: ${activePass.reason || "No reason"} · Exit ${activePass.exitTime?.toDate ? activePass.exitTime.toDate().toLocaleString("en-IN") : "time unavailable"}` : "Manual exit · no active gate pass"}</p>}
            </li>;
          })}</ul>}
        </div>
        {currentlyOut.length > 0 && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="font-display font-semibold text-ink">Currently out · {currentlyOut.length}</h3>
          <ul className="mt-2 divide-y divide-amber-100">{currentlyOut.map((student) => {
            const activePass = activePassByStudent.get(student.id);
            return <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span className="text-sm text-ink">{student.name} · {student.gender || "Unspecified"} · {student.wing || "No wing"}</span>
              <Button className="px-3 py-1 text-xs" disabled={Boolean(busy)} onClick={() => endJourney(student)}>{busy === student.id ? "Saving…" : activePass ? "End journey / Mark IN" : "Mark IN"}</Button>
              <p className="w-full text-xs text-slate-500">{activePass ? `${activePass.type || "Pass"}: ${activePass.reason || "No reason"} · Exit ${activePass.exitTime?.toDate ? activePass.exitTime.toDate().toLocaleString("en-IN") : "time unavailable"}` : "Manual exit · no active gate pass"}</p>
            </li>;
          })}</ul>
        </div>}
        <div className="mb-4 flex gap-2 rounded-full border border-slate-200 bg-slate-50/60 p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                filter === f ? "bg-navy-950 text-white shadow-sm" : "text-slate-500 hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Filter gate activity by gender">
          {["All", "Male", "Female", "Unspecified"].map((gender) => <button key={gender} type="button" onClick={() => setGenderFilter(gender)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${genderFilter === gender ? "bg-teal-700 text-white" : "border border-slate-200 text-slate-600"}`}>{gender === "Male" ? "Boys" : gender === "Female" ? "Girls" : gender === "All" ? "All genders" : gender}</button>)}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={logsQuery.loading || oldLogsQuery.loading || passesQuery.loading || statusQuery.loading}
          searchKeys={["studentName", "registrationNo", "wing", "gender", "gatePassId", "passId", "guard"]}
          searchPlaceholder="Search by student name or registration number…"
          emptyTitle="No gate activity logged yet"
          emptyDescription="Entries logged from Gate Scan will show up here."
          emptyIcon={<ScanIcon />}
          pageSize={12}
        />
      </Card>
      <LeaveExit />
    </div>
  );
}
