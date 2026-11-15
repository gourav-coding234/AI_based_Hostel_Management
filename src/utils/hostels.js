export const HOSTELS = ["Boys Hostel", "Girls Hostel"];

export function normalizeHostel(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text || text === "unassigned") return "";
  if (text === "f" || text === "g" || text.includes("girl") || text.includes("female")) return "Girls Hostel";
  if (text === "m" || text === "b" || text.includes("boy") || text.includes("male")) return "Boys Hostel";
  return "";
}

export function hostelForBlock(_value, _blocks = [], preferredHostel = "") {
  // Compatibility shim for old records: legacy location labels never identify
  // a hostel. Only an explicit canonical hostel value is safe to use.
  return normalizeHostel(preferredHostel);
}

export function hostelForStudent(student, _blocks = []) {
  return normalizeHostel(student?.hostel) ||
    normalizeHostel(student?.hostelType) ||
    normalizeHostel(student?.gender) ||
    normalizeHostel(student?.hostelResidence);
}

export function wardenHostel(profile, _blocks = []) {
  return normalizeHostel(profile?.hostel) || normalizeHostel(profile?.hostelResidence) ||
    normalizeHostel(profile?.hostelType) || normalizeHostel(profile?.assignedHostel);
}

export function studentMatchesHostel(student, hostel, blocks = []) {
  return !hostel || hostelForStudent(student, blocks) === hostel;
}
