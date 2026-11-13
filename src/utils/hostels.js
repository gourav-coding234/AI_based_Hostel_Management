export const HOSTELS = ["Boys Hostel", "Girls Hostel"];

export function normalizeHostel(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text || text === "unassigned") return "";
  if (text.includes("boy") || text.includes("male")) return "Boys Hostel";
  if (text.includes("girl") || text.includes("female")) return "Girls Hostel";
  return "";
}

export function hostelForBlock(value, blocks = []) {
  const name = String(value || "").trim();
  if (!name) return "";
  const configured = blocks.find((block) => String(block.name || "").trim().toLowerCase() === name.toLowerCase());
  const configuredType = normalizeHostel(configured?.type);
  if (configuredType) return configuredType;
  const normalized = name.toLowerCase().replace(/^(block|wing)\s*/, "").trim();
  if (/^(a|b)(\b|\s)/.test(normalized) || normalized === "a" || normalized === "b") return "Boys Hostel";
  if (/^(c)(\b|\s)/.test(normalized) || normalized === "c") return "Girls Hostel";
  return "";
}

export function hostelForStudent(student, blocks = []) {
  return normalizeHostel(student?.hostel) ||
    normalizeHostel(student?.hostelType) ||
    hostelForBlock(student?.wing || student?.hostelResidence || student?.block, blocks) ||
    normalizeHostel(student?.gender);
}

export function wardenHostel(profile, blocks = []) {
  return normalizeHostel(profile?.hostel) || hostelForBlock(profile?.block, blocks);
}

export function studentMatchesHostel(student, hostel, blocks = []) {
  return !hostel || hostelForStudent(student, blocks) === hostel;
}
