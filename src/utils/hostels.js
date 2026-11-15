export const HOSTELS = ["Boys Hostel", "Girls Hostel"];

export function normalizeHostel(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text || text === "unassigned") return "";
  if (text === "f" || text === "g" || text.includes("girl") || text.includes("female")) return "Girls Hostel";
  if (text === "m" || text === "b" || text.includes("boy") || text.includes("male")) return "Boys Hostel";
  return "";
}

export function hostelForBlock(value, blocks = [], preferredHostel = "") {
  const name = String(value || "").trim();
  if (!name) return "";
  const matches = blocks.filter((block) => String(block.name || "").trim().toLowerCase() === name.toLowerCase());
  const preferred = normalizeHostel(preferredHostel);
  const configured = (preferred && matches.find((block) => normalizeHostel(block.type) === preferred)) || (matches.length === 1 ? matches[0] : null);
  const configuredType = normalizeHostel(configured?.type);
  if (configuredType) return configuredType;
  // Block letters can repeat between hostels. Never guess an assignment from
  // the letter alone; use the block's configured type or the student's hostel.
  return "";
}

export function hostelForStudent(student, blocks = []) {
  return normalizeHostel(student?.hostel) ||
    normalizeHostel(student?.hostelType) ||
    normalizeHostel(student?.gender) ||
    normalizeHostel(student?.hostelResidence) ||
    hostelForBlock(student?.wing || student?.hostelResidence || student?.block, blocks);
}

export function wardenHostel(profile, blocks = []) {
  return normalizeHostel(profile?.hostel) || normalizeHostel(profile?.hostelResidence) ||
    normalizeHostel(profile?.hostelType) || normalizeHostel(profile?.assignedHostel) ||
    hostelForBlock(profile?.block, blocks);
}

export function studentMatchesHostel(student, hostel, blocks = []) {
  return !hostel || hostelForStudent(student, blocks) === hostel;
}
