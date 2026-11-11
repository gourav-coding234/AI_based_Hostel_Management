import { useMemo } from "react";
import { useCollections } from "./useCollection";

function studentWing(student) {
  return student.wing || student.hostelResidence || "";
}

function normalizeRegistration(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Shared hostel directory built from all three student data sources:
 * portal accounts, room/allocation profiles, and the imported academic
 * register. This keeps register-only students visible to Admin/Warden while
 * clearly marking that they don't yet have a portal account. Attendance
 * consumers can use hasPortalAccount to avoid writing records under a fake ID.
 */
export function useStudentDirectory() {
  const { data, loading, error } = useCollections({
    students: { name: "students" },
    users: { name: "users", options: { where: [["role", "==", "Student"]] } },
    studentRegister: { name: "studentRegister" },
  }, { live: false, maxDocs: 2000, cacheMs: 10_000 });

  const directory = useMemo(() => {
    const registerByRegNo = new Map();
    const registerByEmail = new Map();
    const registerByUid = new Map();
    data.studentRegister.forEach((row) => {
      const regNo = row.regNo || row.registrationNo || row.id || "";
      const normalizedRegNo = normalizeRegistration(regNo);
      const email = normalizeEmail(row.email);
      const uid = row.studentId || row.userId || row.uid || "";
      if (normalizedRegNo) registerByRegNo.set(normalizedRegNo, row);
      if (email) registerByEmail.set(email, row);
      if (uid) registerByUid.set(uid, row);
    });

    const studentsById = new Map(data.students.map((student) => [student.id, student]));
    const matchedRegisterIds = new Set();
    const rows = data.users.map((account) => {
      const allocation = studentsById.get(account.id) || {};
      const regNo = allocation.registrationNo || allocation.regNo || account.registrationNo || account.regNo || "";
      const registerRecord = (regNo && registerByRegNo.get(normalizeRegistration(regNo)))
        || registerByUid.get(account.id)
        || registerByEmail.get(normalizeEmail(account.email))
        || {};
      if (registerRecord.id) matchedRegisterIds.add(registerRecord.id);
      const finalRegNo = regNo || registerRecord.regNo || registerRecord.registrationNo || registerRecord.id || "";
      return {
        id: account.id,
        userId: account.id,
        hasPortalAccount: true,
        name: allocation.name || account.name || registerRecord.name || "Unnamed student",
        email: account.email || registerRecord.email || "",
        phone: allocation.phone || account.phone || registerRecord.phone || "",
        wing: studentWing(allocation) || account.hostelResidence || registerRecord.wing || registerRecord.hostelResidence || "",
        hostelResidence: allocation.hostelResidence || account.hostelResidence || registerRecord.hostelResidence || registerRecord.wing || "",
        room: allocation.room || registerRecord.room || "",
        bed: allocation.bed || registerRecord.bed || "",
        status: account.status || "Active",
        regNo: finalRegNo,
        gender: allocation.gender || account.gender || registerRecord.gender || "",
        branch: allocation.branch || account.branch || registerRecord.branch || "",
        year: allocation.year || account.year || registerRecord.year || "",
      };
    });

    // Keep room/allocation profiles visible if their account was removed or
    // is temporarily missing. These rows are display-only until a real
    // Student account is restored.
    const knownUserIds = new Set(rows.map((row) => row.id));
    data.students.forEach((allocation) => {
      if (knownUserIds.has(allocation.id)) return;
      const regNo = allocation.registrationNo || allocation.regNo || "";
      const registerRecord = (regNo && registerByRegNo.get(normalizeRegistration(regNo)))
        || registerByUid.get(allocation.id)
        || registerByEmail.get(normalizeEmail(allocation.email))
        || {};
      if (registerRecord.id) matchedRegisterIds.add(registerRecord.id);
      rows.push({
        id: allocation.id,
        userId: "",
        hasPortalAccount: false,
        name: allocation.name || registerRecord.name || "Unnamed student",
        email: allocation.email || registerRecord.email || "",
        phone: allocation.phone || registerRecord.phone || "",
        wing: studentWing(allocation) || registerRecord.wing || registerRecord.hostelResidence || "",
        hostelResidence: allocation.hostelResidence || registerRecord.hostelResidence || registerRecord.wing || "",
        room: allocation.room || registerRecord.room || "",
        bed: allocation.bed || registerRecord.bed || "",
        status: "Account needed",
        regNo: regNo || registerRecord.regNo || registerRecord.registrationNo || registerRecord.id || "",
        gender: allocation.gender || registerRecord.gender || "",
        branch: allocation.branch || registerRecord.branch || "",
        year: allocation.year || registerRecord.year || "",
      });
    });

    data.studentRegister.forEach((record) => {
      if ((record.id && matchedRegisterIds.has(record.id)) || (record.studentId && knownUserIds.has(record.studentId)) || (record.userId && knownUserIds.has(record.userId)) || (record.uid && knownUserIds.has(record.uid))) return;
      const regNo = record.regNo || record.registrationNo || record.id || "";
      rows.push({
        id: `register:${record.id || normalizeRegistration(regNo)}`,
        userId: "",
        hasPortalAccount: false,
        name: record.name || record.studentName || "Unnamed student",
        email: record.email || "",
        phone: record.phone || "",
        wing: record.wing || record.hostelResidence || "",
        hostelResidence: record.hostelResidence || record.wing || "",
        room: record.room || "",
        bed: record.bed || "",
        status: "Account needed",
        regNo,
        gender: record.gender || "",
        branch: record.branch || "",
        year: record.year || "",
      });
    });

    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [data.users, data.students, data.studentRegister]);

  return { directory, loading, error };
}
