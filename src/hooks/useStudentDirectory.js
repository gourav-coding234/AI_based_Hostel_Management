import { useMemo } from "react";
import { useCollections } from "./useCollection";
import { hostelForStudent } from "../utils/hostels";
import { isHostelResident } from "../utils/hostelResidents";

function normalizeRegistration(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function clean(value) {
  return value == null ? "" : String(value).trim();
}

/**
 * One shared resident directory for Warden, Security and the room directory.
 * The academic register is queried only for rows explicitly assigned to a
 * hostel assignment or room; institute-wide non-residents are not downloaded here.
 */
export function useStudentDirectory() {
  const { data, loading, error } = useCollections({
    students: { name: "students" },
    users: { name: "users", options: { where: [["role", "==", "Student"]] } },
    register: { name: "studentRegister", options: { limitCount: 2000 } },
  }, { live: false, maxDocs: 2000, cacheMs: 10_000 });

  const directory = useMemo(() => {
    const byReg = new Map();
    const byEmail = new Map();
    const byUid = new Map();
    const rows = new Map();
    const registerRecords = new Map();
    data.register.forEach((record) => {
      const key = record.id || normalizeRegistration(record.regNo || record.registrationNo);
      if (key) registerRecords.set(key, { ...(registerRecords.get(key) || {}), ...record });
    });

    function findMatch(source, uid = "") {
      const regNo = clean(source.regNo || source.registrationNo || source.registrationNumber);
      const email = normalizeEmail(source.email);
      const sourceUid = uid || clean(source.studentId || source.userId || source.uid || source.id);
      return (regNo && byReg.get(normalizeRegistration(regNo))) ||
        (email && byEmail.get(email)) ||
        (sourceUid && byUid.get(sourceUid)) || null;
    }

    function addSource(source, kind, uid = "") {
      const regNo = clean(source.regNo || source.registrationNo || source.registrationNumber);
      const sourceUid = uid || clean(source.studentId || source.userId || source.uid || (kind === "student" ? source.id : ""));
      let row = findMatch(source, sourceUid);
      if (!row && kind === "register" && !clean(source.hostel || source.hostelType || source.hostelResidence || source.wing || source.block || source.room)) return;
      if (!row) {
        const stableReg = normalizeRegistration(regNo);
        const id = sourceUid && kind === "student" ? sourceUid : stableReg ? `reg:${stableReg}` : `register:${source.id}`;
        row = {
          id,
          hasAccount: false,
          accountUid: "",
          hasPortalAccount: false,
          name: "",
          regNo: "",
          studentCode: "",
          gender: "",
          branch: "",
          year: "",
          room: "",
          bed: "",
          phone: "",
          email: "",
          status: "Account needed",
          photoURL: "",
          hostelResidence: "",
        };
      }

      const merged = {
        ...row,
        name: clean(source.name || source.studentName) || row.name || "Unnamed student",
        regNo: regNo || row.regNo,
        studentCode: clean(source.studentCode || source.studentIdCode) || row.studentCode,
        gender: clean(source.gender) || row.gender,
        branch: clean(source.branch) || row.branch,
        year: clean(source.year) || row.year,
        hostelResidence: hostelForStudent(source) || row.hostelResidence,
        room: clean(source.room) || row.room,
        bed: clean(source.bed) || row.bed,
        phone: clean(source.phone) || row.phone,
        email: clean(source.email) || row.email,
        photoURL: clean(source.photoURL) || row.photoURL,
        status: clean(source.status) || row.status,
      };
      if (kind === "account") {
        merged.id = uid;
        merged.accountUid = uid;
        merged.hasAccount = true;
        merged.hasPortalAccount = true;
        merged.userId = uid;
        merged.status = clean(source.status) || "Active";
      } else if (row.hasAccount) {
        merged.id = row.accountUid;
      }

      merged.hostelType = hostelForStudent(merged);

      if (row.id !== merged.id) rows.delete(row.id);
      rows.set(merged.id, merged);
      if (merged.regNo) byReg.set(normalizeRegistration(merged.regNo), merged);
      if (merged.email) byEmail.set(normalizeEmail(merged.email), merged);
      if (merged.accountUid) byUid.set(merged.accountUid, merged);
      if (sourceUid) byUid.set(sourceUid, merged);
    }

    // Add authenticated students first, then fill profile and academic data.
    data.users.forEach((account) => addSource(account, "account", account.id));
    data.students.forEach((student) => addSource(student, "student", student.id));
    registerRecords.forEach((record) => addSource(record, "register"));

    // This shared directory is for hostel operations; an Auth account by
    // itself is not a resident until the roster/allocation assigns a hostel or room.
    const toMillis = (value) => {
      if (value?.toDate) return value.toDate().getTime();
      const parsed = value ? Date.parse(value) : NaN;
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    return [...rows.values()]
      .filter(isHostelResident)
      .sort((a, b) => toMillis(b.createdAt || b.registeredAt || b.registrationDate) - toMillis(a.createdAt || a.registeredAt || a.registrationDate) || a.name.localeCompare(b.name));
  }, [data.users, data.students, data.register]);

  return { directory, loading, error };
}
