import { useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { createUserAccount } from "../../../firebase/adminUsers";
import ConfirmDialog from "../../../components/dashboard/ConfirmDialog";
import { Card, Button, Field, Pill, EmptyState } from "../../../components/dashboard/student/ui";
import { UploadIcon } from "../../../components/dashboard/admin/icons";
import { parseDataFile, validateRecords } from "../../../utils/fileImport";
import { bulkAddDocuments, bulkUpsertStudentsByEmail, bulkUpsertStudentAcademicRecords, bulkDeleteDocuments, deleteDocument, getCollection, updateDocument, logAudit, reconcileStudentAccountLinks, reconcileStudentRecordsForAccount } from "../../../firebase/firestore";
import { IMPORT_TARGETS } from "../../../utils/importSchemas";
import { useCollection } from "../../../hooks/useCollection";
import { isDemoMode } from "../../../data/demoFixtures";
import AdminBlocksSection from "./AdminBlocksSection";

function validateMixedRecords(records) {
  if (!records.length) return { validRecords: [], errors: [{ row: 0, field: "dataType", message: "The file has no data rows." }], byTarget: {} };
  const routeKey = Object.keys(records[0]).find((key) => key.trim().toLowerCase() === "datatype");
  const groups = new Map();
  const errors = [];
  const normalizeType = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const identifyTarget = (record) => {
    const value = routeKey ? String(record[routeKey] || "").trim().toLowerCase() : "";
    if (value) {
      return IMPORT_TARGETS.find((candidate) => [candidate.key, candidate.collection, candidate.label].some((name) => normalizeType(name) === normalizeType(value))) || null;
    }

    const has = (...keys) => keys.every((key) => String(record[key] ?? "").trim() !== "");
    const candidates = [
      ["studentRegister", has("regNo", "gender", "branch", "year")],
      ["students", has("email", "name") && !has("regNo") && ["hostelResidence", "wing", "floor", "room", "bed"].some((key) => String(record[key] ?? "").trim())],
      ["fees", has("studentId", "studentName", "total", "paid")],
      ["attendance", has("studentId", "studentName", "date", "status")],
      ["complaints", has("studentId", "category", "description")],
      ["gatePasses", has("studentId", "type", "from", "to", "reason")],
      ["leaveRequests", has("studentId", "from", "to", "reason")],
      ["visitors", has("visitorName")],
      ["inventory", has("item", "quantity")],
      ["incidents", has("title", "severity", "location")],
      ["emergencyContacts", has("name", "phone")],
      ["expenses", has("category", "description", "amount", "date") && !has("total", "paid")],
      ["feedback", has("subject", "message")],
      ["blocks", has("name", "totalBeds")],
      ["dutyRoster", has("guardName", "shift")],
      ["notices", has("title", "target")],
    ].filter(([, matches]) => matches);
    return candidates.length === 1 ? IMPORT_TARGETS.find((item) => item.key === candidates[0][0]) : null;
  };

  records.forEach((record, index) => {
    const item = identifyTarget(record);
    if (!item) {
      const route = routeKey ? String(record[routeKey] || "").trim() : "";
      errors.push({ row: index + 2, field: routeKey || "dataType", message: route
        ? `Unknown dataType “${route}”. Use a supported type key, collection name, or label.`
        : "Could not identify one destination from this row. Add a dataType value (for example, studentRegister or fees)." });
      return;
    }
    if (!groups.has(item.key)) groups.set(item.key, []);
    const data = { ...record };
    if (routeKey) delete data[routeKey];
    const sourceRow = Number(record.__sourceRow) || index + 2;
    delete data.__sourceRow;
    groups.get(item.key).push({ sourceRow, data });
  });

  const byTarget = {};
  for (const item of IMPORT_TARGETS) {
    const group = groups.get(item.key) || [];
    if (!group.length) continue;
    const result = validateRecords(group.map((entry) => entry.data), item.columns, item.dedupeKeys || []);
    byTarget[item.key] = result.validRecords;
    result.errors.forEach((error) => {
      const sourceRow = error.row > 1 ? group[error.row - 2]?.sourceRow : undefined;
      errors.push({ ...error, row: sourceRow ?? error.row, field: `${item.label}${error.field ? ` · ${error.field}` : ""}` });
    });
  }

  return { validRecords: Object.values(byTarget).flat(), errors, byTarget };
}

function looksLikeAcademicRoster(records) {
  const headerKeys = new Set(Object.keys(records[0] || {}).map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const hasRegistrationNumber = headerKeys.has("regno") || headerKeys.has("registrationno") || headerKeys.has("registrationnumber");
  return hasRegistrationNumber && ["gender", "branch", "year"].every((key) => headerKeys.has(key));
}

async function fingerprintRecords(records) {
  const canonicalRows = records
    .map((record) => JSON.stringify(Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))))
    .sort();
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalRows));
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  let hash = 2166136261;
  for (const byte of new Uint8Array(bytes)) hash = Math.imul(hash ^ byte, 16777619);
  return `fnv-${(hash >>> 0).toString(16)}-${bytes.byteLength}`;
}

async function resolveStudentIds(records, importedRegister = [], allowMissingReference = true) {
  const accounts = await getCollection("users", { whereClauses: [["role", "==", "Student"]] });
  const accountByUid = new Map(accounts.map((account) => [account.id, account]));
  const uidByEmail = new Map(accounts.map((account) => [String(account.email || "").trim().toLowerCase(), account.id]));
  const uidByRegistration = new Map();
  const accountIdsByName = new Map();
  const normalizedName = (value) => String(value || "").trim().toLowerCase().replace(/[.,']/g, "").replace(/\s+/g, " ");
  for (const account of accounts) {
    const name = normalizedName(account.name);
    if (!name) continue;
    if (!accountIdsByName.has(name)) accountIdsByName.set(name, new Set());
    accountIdsByName.get(name).add(account.id);
  }
  const uidByUniqueName = new Map([...accountIdsByName]
    .filter(([, ids]) => ids.size === 1)
    .map(([name, ids]) => [name, ids.values().next().value]));
  for (const roster of importedRegister) {
    const uid = uidByEmail.get(String(roster.email || "").trim().toLowerCase());
    if (uid && roster.regNo) uidByRegistration.set(String(roster.regNo).trim(), uid);
  }

  const registrationNumbers = [...new Set(records.map((record) => String(record.studentId || record.studentID || record.regNo || record.registrationNo || "").trim())
    .filter((reference) => reference && !accountByUid.has(reference) && !reference.includes("@") && !uidByRegistration.has(reference)))];
  for (let i = 0; i < registrationNumbers.length; i += 30) {
    const chunk = registrationNumbers.slice(i, i + 30);
    const roster = await getCollection("studentRegister", { whereClauses: [["regNo", "in", chunk]] });
    for (const entry of roster) {
      const uid = uidByEmail.get(String(entry.email || "").trim().toLowerCase());
      if (uid && entry.regNo) uidByRegistration.set(String(entry.regNo).trim(), uid);
    }
  }

  const resolved = [];
  const failed = [];
  for (const record of records) {
    const reference = String(record.studentId || record.studentID || record.regNo || record.registrationNo || record.studentEmail || record.email || "").trim();
    const studentName = record.studentName || record.name || "";
    if (!reference && allowMissingReference) {
      resolved.push(record);
      continue;
    }
    const uid = accountByUid.has(reference)
      ? reference
      : uidByEmail.get(reference.toLowerCase()) || uidByRegistration.get(reference) || uidByUniqueName.get(normalizedName(reference)) || uidByUniqueName.get(normalizedName(studentName));
    if (!uid) {
      failed.push({ studentId: reference, studentName, reason: `Student ID ${reference || "(blank)"} could not be matched by account ID, email, registration number, or a unique student name.` });
      continue;
    }
    resolved.push({ ...record, studentId: uid, studentName: studentName || accountByUid.get(uid)?.name || "" });
  }
  return { resolved, failed, studentUids: new Set(accountByUid.keys()) };
}

function expandStudentBundleRows(records) {
  const expanded = [];
  const sharedSeen = new Set();
  const add = (source, sourceRow, type, data, sharedKey = "") => {
    if (sharedKey) {
      const key = `${type}:${sharedKey}`;
      if (sharedSeen.has(key)) return;
      sharedSeen.add(key);
    }
    expanded.push({ dataType: type, __sourceRow: sourceRow, ...data });
  };
  const present = (record, key) => String(record[key] ?? "").trim() !== "";

  records.forEach((record, index) => {
    const sourceRow = index + 2;
    const typeValue = String(record.dataType || "").trim().toLowerCase();
    const isAcademicRoster = present(record, "regNo") && present(record, "gender") && present(record, "branch") && present(record, "year");
    const isStudentBundle = ["students", "student", "student roster", "student roster (room/bed)"].includes(typeValue) || isAcademicRoster;
    if (!isStudentBundle) {
      expanded.push({ ...record, __sourceRow: sourceRow });
      return;
    }

    if (!present(record, "regNo") && !present(record, "studentId") && !present(record, "total")) {
      expanded.push({ ...record, __sourceRow: sourceRow });
      return;
    }

    if (present(record, "regNo") && present(record, "gender") && present(record, "branch") && present(record, "year")) {
      add(record, sourceRow, "studentRegister", {
        regNo: record.regNo, name: record.name, gender: record.gender, branch: record.branch,
        branchCode: record.branchCode, year: record.year, batch: record.batch,
        admissionYear: record.admissionYear, email: record.email, phone: record.phone,
        hostelResidence: record.hostelResidence, wing: record.wing, room: record.room, bed: record.bed,
      });
    }
    if (present(record, "email") && present(record, "name")) {
      add(record, sourceRow, "students", {
        email: record.email, name: record.name, hostelResidence: record.hostelResidence,
        wing: record.wing, floor: record.floor, room: record.room, bed: record.bed, allottedOn: record.allottedOn,
      });
    }
    if (present(record, "studentId") && present(record, "studentName") && present(record, "total") && present(record, "paid")) {
      add(record, sourceRow, "fees", {
        studentId: record.studentId, studentName: record.studentName, block: record.block,
        total: record.total, paid: record.paid, dueDate: record.dueDate, status: record.status,
      });
    }
    if (present(record, "studentId") && present(record, "studentName") && present(record, "category") && present(record, "description")) {
      add(record, sourceRow, "complaints", {
        studentId: record.studentId, studentName: record.studentName, category: record.category,
        description: record.description, status: "Open", date: record.date,
      });
    }
    if (present(record, "studentId") && present(record, "studentName") && present(record, "type") && present(record, "from") && present(record, "to")) {
      const leaveType = /medical|home visit|family function|overnight|leave/i.test(String(record.type));
      add(record, sourceRow, leaveType ? "leaveRequests" : "gatePasses", {
        studentId: record.studentId, studentName: record.studentName, type: record.type,
        from: record.from, to: record.to, block: record.block || record.hostelResidence,
        wing: record.wing, status: "Pending",
      });
    }
    if (present(record, "visitorName") && present(record, "purpose")) {
      add(record, sourceRow, "visitors", {
        visitorName: record.visitorName, block: record.block, studentId: record.studentId,
        studentName: record.studentName, purpose: record.purpose, idProof: record.idProof,
        inTime: record.inTime, outTime: record.outTime,
      });
    }
    if (present(record, "title") && present(record, "target") && present(record, "priority") && present(record, "postedBy")) {
      add(record, sourceRow, "notices", {
        title: record.title, target: record.target, priority: record.priority,
        date: record.date, postedBy: record.postedBy,
      }, `${record.title}|${record.target}|${record.date}|${record.priority}`);
    }
    if (present(record, "item") && present(record, "quantity")) {
      add(record, sourceRow, "inventory", {
        item: record.item, location: record.location, quantity: record.quantity, condition: record.condition,
      });
    }
    if (present(record, "title") && present(record, "severity") && present(record, "reportedBy")) {
      add(record, sourceRow, "incidents", {
        title: record.title, category: record.category, severity: record.severity,
        date: record.date, reportedBy: record.reportedBy,
      }, `${record.title}|${record.severity}|${record.date}|${record.reportedBy}`);
    }
    if (present(record, "category") && present(record, "description") && present(record, "amount") && present(record, "paymentMethod")) {
      add(record, sourceRow, "expenses", {
        category: record.category, description: record.description, amount: record.amount,
        date: record.date, paymentMethod: record.paymentMethod,
      });
    }
    if (present(record, "subject") && present(record, "message")) {
      add(record, sourceRow, "feedback", {
        studentName: record.studentName, studentId: record.studentId,
        subject: record.subject, message: record.message, date: record.date,
      });
    }
    if (present(record, "guardName") && present(record, "shift")) {
      add(record, sourceRow, "dutyRoster", {
        guardName: record.guardName, shift: record.shift, date: record.date, gate: record.gate,
      }, `${record.guardName}|${record.shift}|${record.date}|${record.gate}`);
    }
    if ((present(record, "name") || present(record, "block")) && present(record, "totalBeds")) {
      const name = record.name || record.block;
      add(record, sourceRow, "blocks", {
        name, type: record.type, warden: record.warden, totalRooms: record.totalRooms,
        totalBeds: record.totalBeds, occupiedBeds: record.occupiedBeds,
      }, name);
    }
  });
  return expanded;
}

async function importRecords(target, records, createdBy) {
  if (target.key === "blocks") {
    const current = await getCollection("blocks");
    const names = new Set(current.map((block) => String(block.name || "").trim().toLocaleLowerCase()));
    const newRecords = records.filter((record) => {
      const key = String(record.name || "").trim().toLocaleLowerCase();
      if (!key || names.has(key)) return false;
      names.add(key);
      return true;
    }).map((record) => ({
      ...record,
      name: String(record.name || "").trim(),
      ...(record.type ? { type: record.type } : {}),
      ...(record.warden ? {} : { warden: "Unassigned" }),
      totalRooms: Number(record.totalRooms || 0),
      totalBeds: Number(record.totalBeds || 0),
      occupiedBeds: Number(record.occupiedBeds || 0),
    }));
    const skipped = records.length - newRecords.length;
    const written = newRecords.length ? await bulkAddDocuments("blocks", newRecords, createdBy) : 0;
    return { written, failed: skipped ? [{ target: "Hostel blocks", reason: `${skipped} block row(s) matched an existing block name and were skipped.` }] : [] };
  }
  if (target.key === "students") {
    const accountResult = await ensureStudentAccounts(records, target.onProgress);
    const result = await bulkUpsertStudentsByEmail(records, createdBy);
    return {
      ...result,
      createdAccounts: accountResult.createdAccounts,
      failed: result.failed.map((failure) => ({
        ...failure,
        reason: accountResult.errors.get(failure.email) || failure.reason,
      })),
    };
  }
  if (target.key === "studentRegister") {
    const accountResult = await ensureStudentAccounts(records.filter((record) => record.email), target.onProgress);
    const { written, linked } = await bulkUpsertStudentAcademicRecords(records, createdBy);
    return { written, linked, createdAccounts: accountResult.createdAccounts, failed: Array.from(accountResult.errors, ([email, reason]) => ({ email, reason })) };
  }
  if (target.key === "visitors") {
    const withSortableTime = records.map((record) => {
      const parsed = record.inTime ? Date.parse(record.inTime) : NaN;
      return { ...record, inTimeSort: Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString() };
    });
    const written = await bulkAddDocuments(target.collection, withSortableTime, createdBy);
    return { written, failed: [] };
  }
  const written = await bulkAddDocuments(target.collection, records, createdBy);
  return { written, failed: [] };
}

async function ensureStudentAccounts(records, onProgress) {
  let createdAccounts = 0;
  const errors = new Map();
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record.email || !record.name) {
      errors.set(record.email || `row-${index + 2}`, "A student name and valid email are required to create a login.");
      onProgress?.(index + 1, records.length, createdAccounts);
      continue;
    }
    try {
      await createUserAccount({
        name: record.name,
        email: record.email,
        password: "123456",
        role: "Student",
        registrationNo: record.regNo || record.registrationNo || "",
        gender: record.gender || "",
        branch: record.branch || "",
        year: record.year || "",
        wing: record.wing || "",
        room: record.room || "",
        bed: record.bed || "",
        phone: record.phone || "",
        hostelResidence: record.hostelResidence || record.block,
      });
      createdAccounts += 1;
    } catch (error) {
      if (error?.code === "auth/email-already-in-use") {
        try {
          const existing = (await getCollection("users", { whereClauses: [["email", "==", record.email.trim().toLowerCase()]], limitCount: 2 }))
            .find((account) => account.role === "Student");
          if (!existing) throw new Error("An account already uses this email, but no matching Student profile was found.");
          const registrationNo = record.regNo || record.registrationNo || "";
          if (registrationNo) await updateDocument("users", existing.id, {
            registrationNo,
            regNo: registrationNo,
            gender: record.gender || "",
            branch: record.branch || "",
            year: record.year || "",
          });
          if (registrationNo) await reconcileStudentRecordsForAccount(registrationNo, existing.id);
        } catch (linkError) {
          errors.set(record.email, linkError?.message || "Could not link the existing Student account to this registration number.");
        }
      } else {
        errors.set(record.email, error?.message || "Could not create the student login account.");
      }
    }
    onProgress?.(index + 1, records.length, createdAccounts);
  }
  return { createdAccounts, errors };
}

export default function DataImport() {
  const { user } = useAuth();
  const [targetKey, setTargetKey] = useState("mixed");
  const isMixedImport = targetKey === "mixed";
  const target = IMPORT_TARGETS.find((t) => t.key === targetKey);

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | parsing | validated | importing | done | error
  const [parseError, setParseError] = useState("");
  const [validation, setValidation] = useState(null); // { validRecords, errors }
  const [importedCount, setImportedCount] = useState(0);
  const [importFailures, setImportFailures] = useState([]);
  const [importProgress, setImportProgress] = useState(null);
  const [fileAlreadyImported, setFileAlreadyImported] = useState(null);
  const [fileFingerprint, setFileFingerprint] = useState("");
  const [attendanceRepair, setAttendanceRepair] = useState({ busy: false, error: "", result: null });
  const inputRef = useRef(null);

  async function linkExistingAttendance() {
    setAttendanceRepair({ busy: true, error: "", result: null });
    try {
      const result = await reconcileStudentAccountLinks();
      setAttendanceRepair({ busy: false, error: "", result });
      logAudit({ actor: user?.email || user?.uid || "Admin", action: "Linked student records to accounts", target: `${result.accountsProcessed} student accounts checked; ${result.attendance} attendance records linked` }).catch(() => {});
    } catch (error) {
      console.error("Failed to reconcile student records:", error);
      setAttendanceRepair({ busy: false, error: error.message || "Student records could not be linked.", result: null });
    }
  }

  function reset() {
    setFile(null);
    setStatus("idle");
    setParseError("");
    setValidation(null);
    setImportedCount(0);
    setImportFailures([]);
    setImportProgress(null);
    setFileAlreadyImported(null);
    setFileFingerprint("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setStatus("parsing");
    setParseError("");
    setValidation(null);
    setFileAlreadyImported(null);

    try {
      const { records } = await parseDataFile(f);
      const fingerprint = await fingerprintRecords(records);
      setFileFingerprint(fingerprint);
      const priorImport = await getCollection("auditLogs", {
        whereClauses: [["importFileHash", "==", fingerprint]],
        limitCount: 1,
      });
      if (priorImport.length) {
        setFileAlreadyImported(priorImport[0]);
        setStatus("duplicate");
        return;
      }
      if (!isMixedImport && looksLikeAcademicRoster(records)) {
        setValidation({
          validRecords: [],
          errors: [{ row: 1, field: "Data type", message: "This file contains academic student registration columns. Select Mixed data or Student register (academic) so it is saved to the Student Register." }],
        });
        setStatus("validated");
        return;
      }
      const result = isMixedImport
        ? validateMixedRecords(expandStudentBundleRows(records))
        : validateRecords(records, target.columns, target.dedupeKeys || []);
      setValidation(result);
      setStatus("validated");
    } catch (err) {
      console.error("File parse failed:", err);
      setParseError(err.message || "Couldn't read that file.");
      setStatus("error");
    }
  }

  async function handleImport() {
    if (!validation || validation.validRecords.length === 0 || fileAlreadyImported) return;
    setStatus("importing");
    setImportFailures([]);
    setImportProgress(null);
    try {
      if (isMixedImport) {
        let writtenTotal = 0;
        let createdAccountsTotal = 0;
        const failures = [];
        const linkedCollections = new Set(["fees", "attendance", "complaints", "gatePasses", "visitors", "leaveRequests", "feedback"]);
        const priority = { students: 0, studentRegister: 1 };
        const orderedTargets = [...IMPORT_TARGETS].sort((a, b) => (priority[a.key] ?? 2) - (priority[b.key] ?? 2));

        for (const item of orderedTargets) {
          const rows = validation.byTarget[item.key] || [];
          if (!rows.length) continue;
          try {
            let rowsToImport = rows;
            if (linkedCollections.has(item.key)) {
              const result = await resolveStudentIds(rows, validation.byTarget.studentRegister || []);
              rowsToImport = result.resolved;
              failures.push(...result.failed.map((failure) => ({ ...failure, target: item.label })));
            }
            if (!rowsToImport.length) continue;
            const { written, failed = [], createdAccounts = 0 } = await importRecords({ ...item, onProgress: (done, total, createdCount) => setImportProgress({ target: item.label, done, total, createdAccounts: createdCount }) }, rowsToImport, user?.uid);
            writtenTotal += written;
            createdAccountsTotal += createdAccounts || 0;
            failures.push(...failed.map((failure) => ({ ...failure, target: item.label })));
          } catch (err) {
            console.error(`Mixed import failed for ${item.collection}:`, err);
            failures.push({ target: item.label, reason: err.message || "This data section could not be saved." });
          }
        }
        setImportedCount(writtenTotal);
        if (writtenTotal > 0) {
          try {
            await logAudit({
              actor: user?.email || user?.uid || "Admin",
              action: "Imported data file",
              target: `${file?.name || "Mixed data file"} · ${writtenTotal} records`,
              metadata: { importFileHash: fileFingerprint },
            });
          } catch (auditError) {
            console.error("Import succeeded but duplicate-file history could not be saved:", auditError);
            failures.push({ target: "Repeat-file protection", reason: "Import completed, but its duplicate-file record could not be saved. Avoid uploading this same file again." });
          }
        }
        setImportFailures(failures);
        setImportProgress({ done: writtenTotal, total: writtenTotal, createdAccounts: createdAccountsTotal, finished: true });
        setStatus("done");
        return;
      }
      let recordsToImport = validation.validRecords;
      const linkingFailures = [];
      if (target.key === "attendance") {
        const result = await resolveStudentIds(recordsToImport);
        recordsToImport = result.resolved;
        linkingFailures.push(...result.failed.map((failure) => ({ ...failure, target: target.label })));
      }
      const { written, failed = [], createdAccounts } = await importRecords({ ...target, onProgress: (done, total, createdCount) => setImportProgress({ target: target.label, done, total, createdAccounts: createdCount }) }, recordsToImport, user?.uid);
      setImportedCount(written);
      if (written > 0) {
        try {
          await logAudit({
            actor: user?.email || user?.uid || "Admin",
            action: "Imported data file",
            target: `${file?.name || target.label} · ${written} records`,
            metadata: { importFileHash: fileFingerprint },
          });
        } catch (auditError) {
          console.error("Import succeeded but duplicate-file history could not be saved:", auditError);
          failed.push({ target: "Repeat-file protection", reason: "Import completed, but its duplicate-file record could not be saved. Avoid uploading this same file again." });
        }
      }
      setImportFailures([...linkingFailures, ...failed]);
      if (createdAccounts) setImportProgress({ target: target.label, done: validation.validRecords.length, total: validation.validRecords.length, createdAccounts, finished: true });
      setStatus("done");
    } catch (err) {
      console.error("Import failed:", err);
      setParseError("Import failed while writing to the database. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <AdminBlocksSection />
      <Card
        title="Bulk data import"
        subtitle="Upload a CSV or Excel file to add records to the correct database sections. Every row is validated before it is written."
      >
        <div className="flex flex-col gap-4">
          <Field label="Data type">
            <select
              className="input"
              value={targetKey}
              onChange={(e) => {
                setTargetKey(e.target.value);
                reset();
              }}
            >
              <option value="mixed">Mixed data (route each row by dataType)</option>
              {IMPORT_TARGETS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
            <p className="font-medium text-ink">{isMixedImport ? "Mixed data file format" : `Expected columns for “${target.label}”`}</p>
            {isMixedImport ? (
              <div className="mt-1 text-xs text-slate-500">
                <p>Include the union of the columns needed by your data types in the header row, then put different record types on separate rows. The system routes recognizable rows automatically using their fields.</p>
                <p className="mt-1">For rows with ambiguous fields, add a <code>dataType</code> value such as <code>studentRegister</code> or <code>fees</code>. Type keys, collection names, and labels are accepted; spaces and punctuation are ignored.</p>
                <p className="mt-1">Student roster rows need a valid <code>email</code> and <code>name</code>. Missing Student logins are created automatically with initial password <code>123456</code>; existing Student accounts are reused without changing their passwords. Ask new students to change the shared initial password after signing in.</p>
                <p className="mt-1">Supported types: {IMPORT_TARGETS.map((item) => item.key).join(", ")}.</p>
              </div>
            ) : target.description && <p className="mt-1 text-xs text-slate-500">{target.description}</p>}
            {!isMixedImport && <div className="mt-2 flex flex-wrap gap-1.5">
              {target.columns.map((c) => (
                <span
                  key={c.key}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    c.required ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {c.key}
                  {c.required ? " *" : ""}
                </span>
              ))}
            </div>}
            {!isMixedImport && <p className="mt-2 text-xs text-slate-400">* required column. First row of the file must be the header row.</p>}
          </div>

          <Field label="File (.csv, .xlsx, .xls)">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-teal-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-400"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            <Button type="button" onClick={linkExistingAttendance} disabled={attendanceRepair.busy || isDemoMode()}>
              {attendanceRepair.busy ? "Linking student records…" : "Link attendance to accounts"}
            </Button>
            <p className="text-xs text-slate-500">Run once after student accounts are created to connect attendance and related records by registration number.</p>
          </div>
          {attendanceRepair.error && <p role="alert" className="border-t border-rose-100 pt-3 text-sm text-rose-700">Student record linking failed: {attendanceRepair.error}</p>}
          {attendanceRepair.result && (
            <div role="status" className="border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-600">
                Checked {attendanceRepair.result.accountsProcessed} student accounts; linked {attendanceRepair.result.attendance} attendance, {attendanceRepair.result.fees} fees, {attendanceRepair.result.gatePasses} gate passes, and {attendanceRepair.result.leaveRequests} leave requests.
              </p>
            </div>
          )}

          {status === "parsing" && <p className="text-sm text-slate-400">Reading file…</p>}
          {status === "importing" && importProgress && <p role="status" className="text-sm text-slate-500">Creating student accounts: {importProgress.done} of {importProgress.total} processed; {importProgress.createdAccounts} new account{importProgress.createdAccounts === 1 ? "" : "s"} created.</p>}

          {status === "error" && parseError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{parseError}</div>
          )}

          {status === "duplicate" && (
            <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This exact file was already imported{fileAlreadyImported?.target ? ` (${fileAlreadyImported.target})` : ""}. Import is blocked to prevent duplicate records. Choose a different file or change its contents before importing.
            </div>
          )}

          {validation && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Pill tone={validation.validRecords.length > 0 ? "Resolved" : "Open"}>
                  {validation.validRecords.length} valid row{validation.validRecords.length === 1 ? "" : "s"}
                </Pill>
                {validation.errors.length > 0 && (
                  <Pill tone="Open">{validation.errors.length} error{validation.errors.length === 1 ? "" : "s"}</Pill>
                )}
                <span className="text-xs text-slate-400">from {file?.name}</span>
              </div>

              {isMixedImport && validation.byTarget && <div className="flex flex-wrap gap-2">
                {IMPORT_TARGETS.filter((item) => validation.byTarget[item.key]?.length).map((item) => <Pill key={item.key} tone="Resolved">{item.label}: {validation.byTarget[item.key].length}</Pill>)}
              </div>}

              {validation.errors.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-rose-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-50 text-rose-700">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Field</th>
                        <th className="px-3 py-2">Problem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {validation.errors.map((e, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-slate-500">{e.row || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{e.field || "—"}</td>
                          <td className="px-3 py-2 text-rose-700">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={validation.validRecords.length === 0 || status === "importing"}
                >
                  {status === "importing"
                    ? "Importing…"
                    : `Import ${validation.validRecords.length} row${validation.validRecords.length === 1 ? "" : "s"} to database`}
                </Button>
                <Button variant="outline" onClick={reset}>
                  Choose a different file
                </Button>
              </div>
            </div>
          )}

          {status === "done" && (
            <div className="flex flex-col gap-2">
              <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                Imported {importedCount} record{importedCount === 1 ? "" : "s"}{isMixedImport ? " across the selected data sections" : ` into “${target.collection}”`}. {importProgress?.createdAccounts ? `Created ${importProgress.createdAccounts} new Student account${importProgress.createdAccounts === 1 ? "" : "s"} with the initial password 123456.` : ""} They'll now
                appear on the relevant dashboards automatically as the database syncs; open dashboard pages update without a manual refresh.
                {importFailures.length > 0 && ` ${importFailures.length} record${importFailures.length === 1 ? "" : "s"} could not be linked or imported; see details below.`}
              </div>
              {importFailures.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-amber-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-50 text-amber-800">
                      <tr>
                        <th className="px-3 py-2">Email / student ID</th>
                        <th className="px-3 py-2">Data type</th>
                        <th className="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {importFailures.map((f, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-slate-500">{f.email || f.studentId || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{f.target || "Student roster"}</td>
                          <td className="px-3 py-2 text-amber-800">{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <DataDeleteSection />

      <Card title="How this works" className="bg-slate-50/60">
        <ul className="flex flex-col gap-2 text-sm text-slate-500">
          <li className="flex gap-2">
            <UploadIcon />
            <span>Your file is parsed and checked against the expected columns before anything is saved — invalid rows are listed with the exact problem, and are never imported.</span>
          </li>
          <li className="flex gap-2">
            <UploadIcon />
            <span>Only valid rows are written, directly to the live Firestore database — not to this browser's memory — so every dashboard, chart and stat updates from real data immediately.</span>
          </li>
          <li className="flex gap-2">
            <UploadIcon />
            <span>Academic roster imports with an email create a Student login automatically using the initial password 123456. Rows without an email still appear in the academic Student Register but do not create a login.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}

function displayValue(value) {
  if (value == null || value === "") return "-";
  if (typeof value?.toDate === "function") return value.toDate().toLocaleString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function DataDeleteSection() {
  const { profile, user } = useAuth();
  const [targetKey, setTargetKey] = useState(IMPORT_TARGETS[0].key);
  const target = IMPORT_TARGETS.find((item) => item.key === targetKey);
  const recordsQuery = useCollection(target.collection);
  const records = recordsQuery.data;
  const loading = recordsQuery.loading;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");
  const [page, setPage] = useState(1);
  const [deleteProgress, setDeleteProgress] = useState(null);
  const pageSize = 50;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((record) => Object.entries(record).some(([key, value]) =>
      key !== "id" && displayValue(value).toLowerCase().includes(q)));
  }, [records, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function requestDelete(spec) {
    setDeletePhrase("");
    setError("");
    setMessage("");
    setConfirm(spec);
  }

  function changeTarget(nextTargetKey) {
    setTargetKey(nextTargetKey);
    setSearch("");
    setSelected([]);
    setConfirm(null);
    setDeletePhrase("");
    setError("");
    setMessage("");
    setPage(1);
  }

  function toggle(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleVisible() {
    const ids = pageRecords.map((record) => record.id);
    const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected((current) => allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  }

  async function performDelete() {
    if (!confirm) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { ids, bulk } = confirm;
    let completedDeletes = 0;
    setDeleteProgress(bulk ? { done: 0, total: ids.length } : null);
    setDeletePhrase("");
    try {
      if (bulk) await bulkDeleteDocuments(target.collection, ids, (done, total) => {
        completedDeletes = done;
        setDeleteProgress({ done, total });
      });
      else await deleteDocument(target.collection, ids[0]);
      setSelected((current) => current.filter((id) => !ids.includes(id)));
      setMessage(`Deleted ${ids.length} record${ids.length === 1 ? "" : "s"} from ${target.label}.`);
      logAudit({
        actor: profile?.name || user?.email || "Admin",
        action: bulk ? "Bulk-deleted records" : "Deleted record",
        target: `${target.collection}: ${ids.length} record${ids.length === 1 ? "" : "s"}`,
      }).catch(() => {});
      setConfirm(null);
    } catch (err) {
      console.error("Failed to delete records:", err);
      setError(`${completedDeletes ? `Deleted ${completedDeletes} of ${ids.length} records before the remaining batch failed. ` : ""}Some records could not be deleted. The remaining records are still listed so you can retry.`);
      setConfirm(null);
    } finally {
      setBusy(false);
      setDeleteProgress(null);
    }
  }

  const visibleAllSelected = pageRecords.length > 0 && pageRecords.every((record) => selected.includes(record.id));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Delete data" subtitle="Delete one record, selected records, or every record in the chosen data type. Deletion is permanent.">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data type">
              <select className="input" value={targetKey} onChange={(event) => changeTarget(event.target.value)}>
                {IMPORT_TARGETS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Search records">
              <input className="input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by any field" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>{loading ? "Loading records..." : `${filtered.length} matching | ${records.length} total · page ${currentPage} of ${pageCount}`}{selected.length ? " | " + selected.length + " selected" : ""}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleVisible} disabled={loading || pageRecords.length === 0}>{visibleAllSelected ? "Clear page" : "Select page"}</Button>
              <Button variant="danger" onClick={() => requestDelete({ ids: selected, bulk: true })} disabled={loading || selected.length === 0}>Delete selected ({selected.length})</Button>
              <Button variant="danger" onClick={() => requestDelete({ ids: records.map((record) => record.id), bulk: true, all: true })} disabled={loading || records.length === 0}>Delete all {target.label} ({records.length})</Button>
            </div>
          </div>
          {(error || recordsQuery.error) && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || "Could not load these records. Check admin access and try again."}</div>}
          {message && <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</div>}
          {busy && deleteProgress && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Deleting records: {deleteProgress.done.toLocaleString()} of {deleteProgress.total.toLocaleString()} completed. You can leave this page open while it finishes.</div>}
          {!loading && records.length === 0 && <EmptyState title="No records found" description={`There are no records in ${target.collection}.`} />}
          {!loading && records.length > 0 && filtered.length === 0 && <EmptyState title="No matching records" description="Try a different search term." />}
          {filtered.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
                  <th className="px-3 py-3"><input aria-label="Select records on this page" type="checkbox" checked={visibleAllSelected} onChange={toggleVisible} /></th>
                  <th className="px-3 py-3">Record</th><th className="px-3 py-3">Document ID</th><th className="px-3 py-3 text-right">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRecords.map((record) => {
                    const summary = Object.entries(record).filter(([key, value]) => key !== "id" && value != null && value !== "").slice(0, 3);
                    return <tr key={record.id}>
                      <td className="px-3 py-3"><input aria-label={`Select record ${record.id}`} type="checkbox" checked={selected.includes(record.id)} onChange={() => toggle(record.id)} /></td>
                      <td className="max-w-[32rem] px-3 py-3"><div className="flex flex-wrap gap-x-3 gap-y-1">{summary.map(([key, value]) => <span key={key} className="text-slate-600"><b className="font-medium text-slate-800">{key}:</b> {displayValue(value)}</span>)}</div></td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-400">{record.id}</td>
                      <td className="px-3 py-3 text-right"><Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => requestDelete({ ids: [record.id], bulk: false })}>Delete</Button></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
          {pageCount > 1 && <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>Previous</Button>
            <span className="text-sm text-slate-500">Page {currentPage} / {pageCount}</span>
            <Button variant="outline" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage >= pageCount}>Next</Button>
          </div>}
        </div>
      </Card>
      {confirm && <ConfirmDialog
        title={confirm.all ? `Delete all ${confirm.ids.length} ${target.label} records?` : confirm.bulk ? `Delete ${confirm.ids.length} records?` : "Delete this record?"}
        description={busy && deleteProgress
          ? `Deleting ${deleteProgress.done.toLocaleString()} of ${deleteProgress.total.toLocaleString()} records from ${target.collection}. Keep this page open until it finishes.`
          : `This will permanently delete ${confirm.ids.length === 1 ? "this record" : `these ${confirm.ids.length} records`} from ${target.collection}. This cannot be undone.`}
        confirmLabel={confirm.all ? "Delete all records" : confirm.bulk ? "Delete records" : "Delete record"}
        confirmText={confirm.all ? `DELETE ALL ${target.collection.toUpperCase()}` : ["fees", "expenses", "attendance", "gatePasses", "leaveRequests"].includes(target.collection) ? `DELETE ${target.collection.toUpperCase()}` : ""}
        confirmValue={deletePhrase}
        onConfirmValueChange={setDeletePhrase}
        busy={busy}
        onConfirm={performDelete}
        onCancel={() => { setDeletePhrase(""); setConfirm(null); }}
      />}
    </div>
  );
}
