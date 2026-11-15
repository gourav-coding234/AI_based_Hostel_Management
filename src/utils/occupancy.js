import { HOSTELS, hostelForStudent } from "./hostels";
import { mergeHostelResidents } from "./hostelResidents";

/** Build one shared room-level occupancy view from imported student room
 * assignments. Imported room fields remain authoritative. */
export function buildOccupancyReport(students = [], register = [], _legacyCapacity = [], hostelFilter = "") {
  const residents = mergeHostelResidents(students, register);
  const normalizedFilter = String(hostelFilter || "");
  const rows = new Map();
  residents.forEach((student) => {
    const hostel = hostelForStudent(student);
    const room = String(student.room || student.roomNumber || student.roomNo || "").trim();
    if (!hostel || !room || (normalizedFilter && normalizedFilter !== hostel)) return;
    const key = `${hostel}|${room.toLowerCase()}`;
    if (!rows.has(key)) rows.set(key, { hostel, room, students: [], occupiedBeds: 0, vacantBeds: null });
    const row = rows.get(key);
    row.students.push(student);
    // Imported rosters often have room assignments without bed labels. Each
    // distinct resident still occupies one bed; missing bed labels must not
    // make an occupied room appear empty.
    row.occupiedBeds = row.students.length;
  });
  const result = [...rows.values()].map((row) => {
    const perRoom = Number(row.students[0]?.bedsPerRoom || row.students[0]?.roomCapacity) || 0;
    if (perRoom) row.vacantBeds = Math.max(perRoom - row.occupiedBeds, 0);
    row.studentNames = row.students.map((student) => student.name || "Unnamed student").join(", ");
    row.registrationNumbers = row.students.map((student) => student.registrationNo || student.regNo || "").filter(Boolean).join(", ");
    return row;
  });
  return result.sort((a, b) => a.hostel.localeCompare(b.hostel) || a.room.localeCompare(b.room, undefined, { numeric: true }));
}

/** Hostel-level totals use assigned room records for occupancy and configured
 * block capacities for vacancy. Unknown capacity remains explicit as null. */
export function buildHostelOccupancySummary(students = [], register = [], _legacyCapacity = []) {
  const residents = mergeHostelResidents(students, register);
  return HOSTELS.map((hostel) => {
    const hostelResidents = residents.filter((student) => hostelForStudent(student) === hostel);
    const occupied = hostelResidents.filter((student) =>
      String(student.room || student.roomNumber || student.roomNo || "").trim()
    ).length;
    const capacity = hostelResidents.reduce((sum, student) => sum + (Number(student.bedsPerRoom || student.roomCapacity) || 0), 0);
    return { hostel, occupied, capacity, vacant: capacity > 0 ? Math.max(capacity - occupied, 0) : null, residents: hostelResidents.length };
  });
}
