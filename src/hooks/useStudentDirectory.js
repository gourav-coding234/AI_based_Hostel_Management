import { useMemo } from "react";
import { useCollections } from "./useCollection";

// A student's wing can be recorded under `wing` (Room Allotment's own
// writes) or `hostelResidence` (bulk import / account creation) — this
// mirrors the exact fallback already used on Room Allotment / Warden
// Overview, so every page agrees on the same wing for the same student.
function studentWing(s) {
  return s.wing || s.hostelResidence || "";
}

/**
 * The single source of truth for "the hostel student directory": every
 * Student account (`users/{uid}`, role: Student) left-joined onto its
 * `students/{uid}` allocation record (wing/room/bed) — the same doc Room
 * Allotment reads and writes. A student who hasn't been allotted a bed yet
 * still appears, with room/bed blank, rather than only ever showing
 * residents who already have one.
 *
 * Reused everywhere the app needs "the current roster with room/bed" —
 * the Warden Student Directory page and the Warden Attendance
 * take-attendance workflow both call this instead of keeping their own
 * copy, so there is exactly one join and both pages always agree.
 */
export function useStudentDirectory() {
  const { data, loading, error } = useCollections({
    students: { name: "students" },
    users: { name: "users", options: { where: [["role", "==", "Student"]] } },
    studentRegister: { name: "studentRegister" },
  }, { live: false, maxDocs: 2000, cacheMs: 10_000 });

  const studentsById = useMemo(() => Object.fromEntries(data.students.map((s) => [s.id, s])), [data.students]);
  const registerByRegNo = useMemo(() => Object.fromEntries(data.studentRegister.map((row) => {
    const registrationNo = String(row.regNo || row.registrationNo || row.id || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
    return [registrationNo, row];
  }).filter(([key]) => key)), [data.studentRegister]);

  const directory = useMemo(() => {
    const rows = data.users.map((u) => {
      const s = studentsById[u.id] || {};
      const regNo = s.registrationNo || s.regNo || u.registrationNo || u.regNo || "";
      const registerRecord = registerByRegNo[String(regNo).replace(/[^a-z0-9]/gi, "").toUpperCase()] || {};
      return {
        id: u.id,
        name: s.name || u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        wing: studentWing(s) || u.hostelResidence || "",
        hostelResidence: s.hostelResidence || u.hostelResidence || "",
        room: s.room || "",
        bed: s.bed || "",
        status: u.status || "Active",
        regNo,
        gender: s.gender || u.gender || registerRecord.gender || "",
        branch: s.branch || "",
        year: s.year || "",
      };
    });
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [data.users, studentsById, registerByRegNo]);

  return { directory, loading, error };
}
