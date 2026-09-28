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
  });

  const studentsById = useMemo(() => Object.fromEntries(data.students.map((s) => [s.id, s])), [data.students]);

  const directory = useMemo(() => {
    const rows = data.users.map((u) => {
      const s = studentsById[u.id] || {};
      return {
        id: u.id,
        name: s.name || u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        wing: studentWing(s) || u.hostelResidence || "",
        room: s.room || "",
        bed: s.bed || "",
        status: u.status || "Active",
      };
    });
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [data.users, studentsById]);

  return { directory, loading, error };
}
