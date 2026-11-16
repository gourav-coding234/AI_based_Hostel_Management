import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, Pill, Button, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import { CameraIcon, CheckSquareIcon, LogInIcon, LogOutIcon, ScanIcon } from "../../../components/dashboard/security/icons";
import { approveStudentGatePass, saveSecurityMovement } from "../../../firebase/securityMovement";
import { useGateDesk } from "../../../hooks/useGateDesk";
import { normalizeGender } from "../../../hooks/useAttendanceRoster";
import { isPassActive, isPassOut, passStatus } from "../../../utils/gatePass";
import { downloadCsvAsXlsx } from "../../../utils/xlsxExport";
import { toCsvText } from "../../../utils/csv";

const READER_ID = "security-gate-desk-qr-reader";
const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const stamp = (value) => value?.toDate ? value.toDate().toLocaleString("en-IN") : value ? new Date(value).toLocaleString("en-IN") : "—";
const elapsed = (value, now = new Date()) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Time unavailable";
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};
function parseQr(text) {
  const raw = String(text || "").trim();
  try { const value = JSON.parse(raw); if (value?.gatePassId) return { passId: String(value.gatePassId), studentId: String(value.studentId || "") }; } catch { /* legacy plain ID follows */ }
  return { passId: raw.split("|")[0], studentId: "" };
}
function directionOf(log) { return log.direction || (String(log.type).toUpperCase() === "OUT" ? "Out" : "In"); }
function methodLabel(log) { return String(log.method || (log.gatePassId ? "scan" : "manual")).toLowerCase() === "scan" ? "Pass scan" : "Manual"; }
function dateOf(log) { return log.timeSort || (log.scannedAt?.toDate ? log.scannedAt.toDate().toISOString() : ""); }

export default function GateDesk() {
  const { directory, studentById, passById, statusByStudent, passes, logs, loading, error } = useGateDesk();
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedPassId, setSelectedPassId] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [entryReasonRequired, setEntryReasonRequired] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [filterDirection, setFilterDirection] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [approvingPassId, setApprovingPassId] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");
  const [now, setNow] = useState(() => new Date());
  const scannerRef = useRef(null);

  const passByStudent = useMemo(() => {
    const map = new Map();
    [...passes].sort((a, b) => String(b.from || "").localeCompare(String(a.from || ""))).forEach((pass) => {
      if (!map.has(pass.studentId)) map.set(pass.studentId, pass);
    });
    return map;
  }, [passes]);
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    const matchedPass = passById.get(term);
    if (matchedPass) return [{ kind: "pass", pass: matchedPass, student: studentById.get(matchedPass.studentId) }];
    return directory.filter((student) => `${student.name} ${student.regNo} ${student.wing} ${student.email}`.toLowerCase().includes(term)).slice(0, 8).map((student) => ({ kind: "student", student }));
  }, [search, passById, directory, studentById]);
  const selectedPass = selectedPassId ? passById.get(selectedPassId) : null;
  const pendingPasses = useMemo(() => passes.filter((pass) => passStatus(pass) === "Pending"), [passes]);
  const selectedStudent = selectedStudentId ? studentById.get(selectedStudentId) : selectedPass ? (studentById.get(selectedPass.studentId) || { id: selectedPass.studentId, name: selectedPass.studentName, regNo: selectedPass.registrationNo, wing: selectedPass.wing, gender: selectedPass.gender }) : null;
  const activePass = selectedPass || (selectedStudent ? passByStudent.get(selectedStudent.id) : null);
  const selectedStatus = selectedStudent ? statusByStudent.get(selectedStudent.id) : null;
  const isOut = selectedStatus?.status === "OUT" || (selectedPass && isPassOut(selectedPass));

  const outStudents = useMemo(() => directory.filter((student) => statusByStudent.get(student.id)?.status === "OUT"), [directory, statusByStudent]);
  const passToday = passes.filter((pass) => {
    if (!isPassActive(pass)) return false;
    const today = dayKey(now);
    return (!pass.from || String(pass.from).slice(0, 10) <= today) && (!pass.to || String(pass.to).slice(0, 10) >= today);
  });
  const outByGender = { boys: outStudents.filter((student) => normalizeGender(student.gender) === "Male").length, girls: outStudents.filter((student) => normalizeGender(student.gender) === "Female").length };
  const filteredLogs = useMemo(() => logs.filter((log) => {
    const direction = directionOf(log);
    const gender = normalizeGender(log.gender);
    const matchesSearch = `${log.studentName} ${log.registrationNo} ${log.wing} ${log.guard} ${log.gatePassId}`.toLowerCase().includes(logSearch.trim().toLowerCase());
    return (filterDirection === "All" || direction === filterDirection)
      && (filterGender === "All" || (filterGender === "Boys" ? gender === "Male" : gender === "Female"))
      && (!filterDate || String(dateOf(log)).slice(0, 10) === filterDate)
      && matchesSearch;
  }), [logs, filterDirection, filterGender, filterDate, logSearch]);

  useEffect(() => () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  function selectStudent(student, pass = null) {
    setSelectedStudentId(student?.id || "");
    setSelectedPassId(pass?.id || "");
    setManualReason("");
    setEntryReasonRequired(false);
    setActionError("");
    setMessage("");
  }
  async function approvePass(pass) {
    if (approvingPassId) return;
    setApprovingPassId(pass.id);
    setApprovalError("");
    setApprovalMessage("");
    try {
      await approveStudentGatePass(pass.id);
      setApprovalMessage(`${pass.code || "Gate pass"} approved. The student can now use its QR code.`);
    } catch (err) {
      console.error("Failed to approve gate pass:", err);
      setApprovalError(err.message || "Gate pass could not be approved. Try again.");
    } finally {
      setApprovingPassId("");
    }
  }
  async function stopCamera() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (scanner) { try { await scanner.stop(); scanner.clear(); } catch { /* already stopped */ } }
  }
  async function startCamera() {
    setCameraError("");
    if (scannerRef.current) return;
    setScanning(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const scanner = new Html5Qrcode(READER_ID, { verbose: false });
    scannerRef.current = scanner;
    try {
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 220, height: 220 } }, (text) => {
        const parsed = parseQr(text);
        const pass = passById.get(parsed.passId);
        if (pass && isPassOut(pass)) {
          setActionError("This gate pass QR has already been used for exit. Select the student from Currently Out to record their return.");
        }
        else if (pass && passStatus(pass) === "Completed") {
          setActionError("This gate pass has already been completed and cannot be reused.");
        }
        else if (pass) { selectStudent(studentById.get(pass.studentId), pass); setSearch(""); }
        else if (parsed.studentId && studentById.has(parsed.studentId)) { selectStudent(studentById.get(parsed.studentId)); setSearch(""); }
        else { setSearch(parsed.passId); setActionError("No matching pass was found. Search by student name or registration number."); }
        stopCamera();
      }, () => {});
    } catch (err) {
      console.error("Gate Desk camera could not start:", err);
      scannerRef.current = null;
      setScanning(false);
      setCameraError("Camera access was denied or is unavailable. You can still search by pass ID, student name, or registration number.");
    }
  }
  function submitSearch(event) {
    event.preventDefault();
    const term = search.trim();
    const pass = passById.get(term);
    if (pass) { selectStudent(studentById.get(pass.studentId), pass); return; }
    const exact = directory.find((student) => student.regNo?.toLowerCase() === term.toLowerCase() || student.name?.toLowerCase() === term.toLowerCase());
    if (exact) { selectStudent(exact); return; }
    setActionError("No pass or student matched that search.");
  }
  async function movement(student, direction, pass = null, manual = false) {
    if (!student || busy) return;
    setSelectedStudentId(student.id);
    setSelectedPassId(pass?.id || "");
    if (manual && !manualReason.trim()) { setActionError("Add a reason before recording a manual movement."); return; }
    if (direction === "In" && entryReasonRequired && !manualReason.trim()) { setActionError("Add a reason for this early or late entry."); return; }
    setBusy(student.id); setActionError(""); setMessage("");
    try {
      await saveSecurityMovement({ direction, passId: pass?.id, studentId: student.id, manual, reason: manualReason.trim() });
      setMessage(direction === "Out" ? "Exit logged" : "Journey ended");
      setSearch(""); setSelectedPassId(""); setSelectedStudentId(""); setManualReason(""); setEntryReasonRequired(false);
    } catch (err) {
      console.error("Gate Desk movement failed:", err);
      if (err.message === "ENTRY_REASON_REQUIRED") setEntryReasonRequired(true);
      setActionError(err.messageText || ({ NOT_APPROVED: "Pass not approved yet.", PASS_REJECTED: "This pass was rejected and cannot be used.", PASS_ALREADY_USED: "This pass has already been used.", EXPIRED: "This pass has expired.", ALREADY_OUT: "This student is already marked out.", NOT_OUT_YET: "This student is not currently marked out.", REASON_REQUIRED: "Add a reason before recording a manual movement.", ENTRY_REASON_REQUIRED: "Add a reason for this early or late entry." }[err.message]) || "Could not save the movement. Check the server connection and try again.");
    } finally { setBusy(""); }
  }

  const exportColumns = [
    { label: "Time", value: (row) => row.time || stamp(row.scannedAt) },
    { label: "Student", value: (row) => row.studentName },
    { label: "Registration No", value: (row) => row.registrationNo },
    { label: "Wing", value: (row) => row.wing },
    { label: "Gender", value: (row) => row.gender },
    { label: "Direction", value: directionOf },
    { label: "Method", value: methodLabel },
    { label: "Pass ID", value: (row) => row.gatePassId || "Manual" },
    { label: "Guard", value: (row) => row.guard },
    { label: "Reason", value: (row) => row.reason || "" },
  ];

  return <div className="flex flex-col gap-6 animate-fade-in">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-2xl font-semibold text-ink">Gate Desk</h1><p className="mt-1 text-sm text-slate-500">Live resident movement and pass verification in one place.</p></div>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["Total residents", directory.length], ["In", Math.max(directory.length - outStudents.length, 0)], ["Out", `${outStudents.length} · Boys ${outByGender.boys} / Girls ${outByGender.girls}`], ["Passes active today", passToday.length]].map(([label, value]) => <Card key={label}><p className="font-display text-2xl font-semibold text-ink">{loading ? "…" : value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></Card>)}
    </div>

    <Card title="Search or scan">
      <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row md:items-end">
        <Field label="Pass ID, student name or registration number"><input className={inputCls} value={search} onChange={(event) => { setSearch(event.target.value); setActionError(""); }} placeholder="Search or scan a student's pass…" /></Field>
        <Button type="submit" variant="outline" className="shrink-0"><ScanIcon /> Search</Button>
        <Button type="button" onClick={scanning ? stopCamera : startCamera} className="shrink-0"><CameraIcon /> {scanning ? "Stop camera" : "Scan QR"}</Button>
      </form>
      <div id={READER_ID} className={`mt-3 max-w-[320px] overflow-hidden rounded-xl border border-slate-200 ${scanning ? "block" : "hidden"}`} />
      {cameraError && <p className="mt-3 text-sm text-rose-600">{cameraError}</p>}
      {search.trim() && results.length > 0 && !selectedStudent && <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">{results.map(({ student, pass }) => student && <li key={`${student.id}:${pass?.id || "student"}`}><button type="button" onClick={() => selectStudent(student, pass)} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50">{student.name} · {student.regNo || "No registration number"} · {student.wing || "No wing"}{pass ? ` · ${pass.id}` : ""}</button></li>)}</ul>}
      {actionError && <p role="alert" className="mt-3 text-sm text-rose-600">{actionError}</p>}
      {message && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
    </Card>

    <Card title={`Pending gate pass approvals · ${pendingPasses.length}`}>
      {approvalError && <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{approvalError}</p>}
      {approvalMessage && <p role="status" className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{approvalMessage}</p>}
      {pendingPasses.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">No gate passes are waiting for approval.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead><tr className="text-xs uppercase text-slate-400"><th className="pb-2">Student</th><th className="pb-2">Pass</th><th className="pb-2">Reason</th><th className="pb-2">Window</th><th className="pb-2 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{pendingPasses.map((pass) => {
              const student = studentById.get(pass.studentId) || {};
              const busy = approvingPassId === pass.id;
              return <tr key={pass.id}>
                <td className="py-3 font-medium text-ink">{pass.studentName || student.name || "Student"}<p className="text-xs text-slate-400">{pass.registrationNo || pass.regNo || student.regNo || "Registration unavailable"}</p></td>
                <td className="py-3">{pass.type || "Gate pass"}<p className="text-xs text-slate-400">{pass.code || pass.id}</p></td>
                <td className="py-3">{pass.reason || "—"}</td>
                <td className="py-3">{pass.from || "—"} → {pass.to || "—"}</td>
                <td className="py-3 text-right"><Button type="button" variant="outline" className="px-2.5 py-1 text-xs" title="Approve gate pass" aria-label={`Approve gate pass for ${pass.studentName || student.name || "student"}`} onClick={() => approvePass(pass)} disabled={Boolean(approvingPassId)}><CheckSquareIcon />{busy ? "Approving…" : "Approve"}</Button></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </Card>

    {(selectedStudent || selectedPass) && <Card title="Movement result" action={selectedPass && <Pill tone={passStatus(selectedPass)}>{passStatus(selectedPass)}</Pill>}>
      <div className="flex flex-wrap items-center gap-4">
        {selectedStudent?.photoURL ? <img src={selectedStudent.photoURL} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">{(selectedStudent?.name || selectedPass?.studentName || "?").slice(0, 1).toUpperCase()}</span>}
        <div><p className="font-semibold text-ink">{selectedStudent?.name || selectedPass?.studentName || "Student"}</p><p className="text-sm text-slate-500">{selectedStudent?.regNo || selectedPass?.registrationNo || "—"} · {selectedStudent?.wing || selectedPass?.wing || "No wing"} · {selectedStudent?.gender || selectedPass?.gender || "Unspecified"}</p></div>
        <Pill tone={isOut ? "Pending" : "Approved"}>{isOut ? "Out" : "In"}</Pill>
      </div>
      {activePass && <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><b>Pass:</b> {activePass.type} · {activePass.id} · {passStatus(activePass)}</p><p><b>Reason:</b> {activePass.reason || "—"}</p><p><b>Valid:</b> {activePass.from || "—"} → {activePass.to || "—"}</p><p><b>Exit time:</b> {stamp(activePass.exitTime)}</p></div>}
      {selectedStatus && <p className="mt-3 text-sm text-slate-500">Last movement updated {stamp(selectedStatus.updatedAt)}</p>}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        {isOut && (entryReasonRequired || !isPassOut(activePass)) && <Field label="Entry reason (required)"><textarea required className={`${inputCls} min-h-[88px] resize-y`} value={manualReason} onChange={(event) => setManualReason(event.target.value)} placeholder="Reason for early, late, or manual entry" /></Field>}
        {isOut ? <Button disabled={Boolean(busy)} onClick={() => movement(selectedStudent, "In", isPassOut(activePass) ? activePass : null, !isPassOut(activePass))}><LogInIcon /> {busy === selectedStudent?.id ? "Saving…" : "End journey / Log entry"}</Button>
          : activePass && passStatus(activePass) === "Approved" ? <Button disabled={Boolean(busy) || isExpired(activePass)} onClick={() => movement(selectedStudent, "Out", activePass)}><LogOutIcon /> Log exit</Button> : null}
        {!isOut && (!activePass || passStatus(activePass) !== "Approved" || isExpired(activePass)) && <>
          <Field label="Manual exit reason (required)"><textarea required className={`${inputCls} min-h-[88px] resize-y`} value={manualReason} onChange={(event) => setManualReason(event.target.value)} placeholder="Why is the student leaving without a pass?" /></Field>
          <Button variant="outline" disabled={Boolean(busy)} onClick={() => movement(selectedStudent, "Out", null, true)}><LogOutIcon /> Mark OUT manually</Button>
        </>}
        {isOut && <p className="self-center text-sm text-slate-500">Exit recorded {stamp(selectedStatus?.exitTime || activePass?.exitTime)}</p>}
      </div>
      {activePass && ["Pending", "Rejected", "Completed"].includes(passStatus(activePass)) && <p className="mt-3 text-sm text-slate-500">This pass is {passStatus(activePass).toLowerCase()} and cannot be used to log a pass movement. Manual movement remains available when the student travels without a valid pass.</p>}
    </Card>}

    <Card title={`Currently Out · ${outStudents.length}`}>
      {outStudents.length === 0 ? <EmptyState icon={<LogOutIcon />} title="No students are currently out" description="Students logged out at the gate will appear here." /> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="text-xs uppercase text-slate-400"><th className="pb-2">Student</th><th className="pb-2">Registration</th><th className="pb-2">Wing / gender</th><th className="pb-2">Out for</th><th className="pb-2">Reason</th><th className="pb-2">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{outStudents.map((student) => { const status = statusByStudent.get(student.id); const pass = passes.find((candidate) => isPassOut(candidate) && candidate.studentId === student.id); return <tr key={student.id}><td className="py-3 font-medium text-ink">{student.name}</td><td className="py-3">{student.regNo || "—"}</td><td className="py-3">{student.wing || "—"} · {student.gender || "Unspecified"}</td><td className="py-3">{elapsed(status?.exitTime || status?.updatedAt, now)}</td><td className="py-3">{pass ? `${pass.type}: ${pass.reason || "—"}` : status?.reason || "Manual"}</td><td className="py-3"><Button className="px-3 py-1 text-xs" disabled={Boolean(busy)} onClick={() => movement(student, "In", pass, !pass)}>{busy === student.id ? "Saving…" : "End journey"}</Button></td></tr>; })}</tbody></table></div>}
    </Card>

    <Card title="Combined movement log" action={<Button variant="outline" onClick={() => downloadCsvAsXlsx(toCsvText(filteredLogs, exportColumns), "gate-desk-movements.xlsx")} disabled={filteredLogs.length === 0}>Download Excel</Button>}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><select className={inputCls} value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)}><option>All</option><option>In</option><option>Out</option></select><select className={inputCls} value={filterGender} onChange={(e) => setFilterGender(e.target.value)}><option>All</option><option>Boys</option><option>Girls</option></select><input className={inputCls} type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /><input className={inputCls} value={logSearch} onChange={(e) => setLogSearch(e.target.value)} placeholder="Search student, guard or pass…" /></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="text-xs uppercase text-slate-400">{["Time", "Student", "Registration", "Wing", "Gender", "Direction", "Method", "Pass", "Guard"].map((label) => <th className="pb-2" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredLogs.map((log) => <tr key={`${log.id}:${log.timeSort || ""}`}><td className="py-2.5">{stamp(log.timeSort || log.scannedAt)}</td><td className="py-2.5">{log.studentName}</td><td className="py-2.5">{log.registrationNo || "—"}</td><td className="py-2.5">{log.wing || "—"}</td><td className="py-2.5">{log.gender || "Unspecified"}</td><td className="py-2.5"><Pill tone={directionOf(log) === "Out" ? "Pending" : "Approved"}>{directionOf(log)}</Pill></td><td className="py-2.5">{methodLabel(log)}</td><td className="py-2.5">{log.gatePassId && passById.has(log.gatePassId) ? <button type="button" className="text-teal-700 underline" onClick={() => { const pass = passById.get(log.gatePassId); selectStudent(studentById.get(pass.studentId), pass); }}>{log.gatePassId}</button> : log.gatePassId || "Manual"}</td><td className="py-2.5">{log.guard || "—"}</td></tr>)}</tbody></table>{filteredLogs.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No movement records match these filters.</p>}</div>
    </Card>
  </div>;
}

function isExpired(pass) { const end = pass?.to ? new Date(pass.to) : null; return Boolean(end && !Number.isNaN(end.getTime()) && Date.now() > end.getTime()); }
