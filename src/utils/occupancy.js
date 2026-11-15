import { HOSTELS, hostelForStudent, normalizeHostel } from "./hostels";
import { mergeHostelResidents } from "./hostelResidents";

/** Build one shared room-level occupancy view from imported student room
 * assignments and block capacity. Imported room fields remain authoritative. */
export function buildOccupancyReport(students = [], register = [], blocks = [], hostelFilter = "") {
  const residents = mergeHostelResidents(students, register);
  const normalizedFilter = String(hostelFilter || "");
  const rows = new Map();
  residents.forEach((student) => {
    const hostel = hostelForStudent(student, blocks);
    const blockName = [student.block, student.wing, student.blockName, student.hostelBlock, student.hostelResidence]
      .map((value) => String(value || "").trim()).find((value) => value && !normalizeHostel(value)) || "";
    const room = String(student.room || student.roomNumber || student.roomNo || "").trim();
    if (!hostel || !blockName || !room || (normalizedFilter && normalizedFilter !== hostel)) return;
    const key = `${hostel}|${blockName.toLowerCase()}|${room.toLowerCase()}`;
    if (!rows.has(key)) rows.set(key, { hostel, block: blockName, room, students: [], occupiedBeds: 0, vacantBeds: null });
    const row = rows.get(key);
    row.students.push(student);
    // Imported rosters often have room assignments without bed labels. Each
    // distinct resident still occupies one bed; missing bed labels must not
    // make an occupied room appear empty.
    row.occupiedBeds = row.students.length;
  });
  const blockMap = new Map(blocks.map((block) => [`${normalizeHostel(block.type || block.hostel || block.hostelType)}|${String(block.name || block.block || "").trim().toLowerCase()}`, block]));
  const result = [...rows.values()].map((row) => {
    const config = blockMap.get(`${row.hostel}|${row.block.toLowerCase()}`) ||
      blocks.find((block) => String(block.name || block.block || "").trim().toLowerCase() === row.block.toLowerCase() && normalizeHostel(block.type || block.hostel || block.hostelType) === row.hostel);
    const rooms = Number(config?.totalRooms || config?.roomCount) || 0;
    const totalBeds = Number(config?.totalBeds || config?.bedCapacity || config?.capacity) || 0;
    const perRoom = Number(config?.bedsPerRoom || config?.roomCapacity) || (rooms && totalBeds ? Math.ceil(totalBeds / rooms) : 0);
    if (perRoom) row.vacantBeds = Math.max(perRoom - row.occupiedBeds, 0);
    row.studentNames = row.students.map((student) => student.name || "Unnamed student").join(", ");
    row.registrationNumbers = row.students.map((student) => student.registrationNo || student.regNo || "").filter(Boolean).join(", ");
    return row;
  });
  return result.sort((a, b) => a.hostel.localeCompare(b.hostel) || a.block.localeCompare(b.block) || a.room.localeCompare(b.room, undefined, { numeric: true }));
}

/** Hostel-level totals use assigned room records for occupancy and configured
 * block capacities for vacancy. Unknown capacity remains explicit as null. */
export function buildHostelOccupancySummary(students = [], register = [], blocks = []) {
  const residents = mergeHostelResidents(students, register);
  return HOSTELS.map((hostel) => {
    const hostelResidents = residents.filter((student) => hostelForStudent(student, blocks) === hostel);
    const occupied = hostelResidents.filter((student) =>
      String(student.room || student.roomNumber || student.roomNo || "").trim()
    ).length;
    const hostelBlocks = blocks.filter((block) => normalizeHostel(block.type || block.hostel || block.hostelType) === hostel);
    const capacity = hostelBlocks.reduce((sum, block) => sum + (Number(block.totalBeds || block.bedCapacity || block.capacity) || 0), 0);
    return { hostel, occupied, capacity, vacant: capacity > 0 ? Math.max(capacity - occupied, 0) : null, residents: hostelResidents.length };
  });
}
