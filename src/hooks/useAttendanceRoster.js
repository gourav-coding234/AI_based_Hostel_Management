import { useEffect, useMemo, useState } from "react";

export const ATTENDANCE_GENDER_GROUPS = [
  { id: "Male", label: "Boys Hostel" },
  { id: "Female", label: "Girls Hostel" },
  { id: "Unspecified", label: "Unspecified" },
];

export function normalizeGender(value) {
  const gender = String(value || "").trim().toLowerCase();
  if (["male", "m", "boy", "boys"].includes(gender)) return "Male";
  if (["female", "f", "girl", "girls"].includes(gender)) return "Female";
  return "Unspecified";
}

/** Shared sex grouping and side-scoped attendance roster for both staff panels. */
export function useAttendanceRoster(directory, existingForDate, assignedHostel = "") {
  const [selectedGender, setSelectedGender] = useState(assignedHostel === "Girls Hostel" ? "Female" : "Male");
  useEffect(() => {
    setSelectedGender(assignedHostel === "Girls Hostel" ? "Female" : "Male");
  }, [assignedHostel]);
  const attendanceDirectory = directory;
  const groups = useMemo(() => {
    const result = Object.fromEntries(ATTENDANCE_GENDER_GROUPS.map(({ id }) => [id, { total: 0, present: 0, absent: 0, leave: 0 }]));
    attendanceDirectory.forEach((student) => {
      if (assignedHostel && student.hostelType !== assignedHostel) return;
      const group = result[normalizeGender(student.gender)];
      group.total += 1;
      const status = existingForDate.get(student.id)?.status;
      if (status === "Present") group.present += 1;
      else if (status === "Absent") group.absent += 1;
      else if (status === "Leave") group.leave += 1;
    });
    return result;
  }, [attendanceDirectory, existingForDate, assignedHostel]);
  const roster = useMemo(() => attendanceDirectory
    .filter((student) => (!assignedHostel || student.hostelType === assignedHostel) && normalizeGender(student.gender) === selectedGender)
    .map((student) => ({ ...student, existing: existingForDate.get(student.id) || null })),
  [attendanceDirectory, existingForDate, assignedHostel, selectedGender]);
  const total = Object.values(groups).reduce((count, group) => count + group.total, 0);
  const assignedDirectory = assignedHostel ? attendanceDirectory.filter((student) => student.hostelType === assignedHostel) : attendanceDirectory;
  const withAccountCount = assignedDirectory.filter((student) => student.hasAccount !== false).length;
  return { groups, roster, selectedGender, setSelectedGender, total, unlinkedCount: assignedDirectory.length - withAccountCount, withAccountCount };
}
