export const HOSTELS = ["Boys Hostel", "Girls Hostel"];

export function normalizeHostel(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text || text === "unassigned") return "";
  if (text.includes("girl") || text.includes("female")) return "Girls Hostel";
  if (text.includes("boy") || text.includes("male")) return "Boys Hostel";
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
  const normalized = name.toLowerCase().replace(/^(block|wing)\s*/, "").trim();
  // A and B exist in both hostels, so their letter alone cannot identify a hostel.
  // Under the current layout, C is a boys-hostel block.
  if (/^(c)(\b|\s)/.test(normalized) || normalized === "c") return "Boys Hostel";
  return "";
}

export function hostelForStudent(student, blocks = []) {
  return normalizeHostel(student?.hostel) ||
    normalizeHostel(student?.hostelType) ||
    normalizeHostel(student?.gender) ||
    hostelForBlock(student?.wing || student?.hostelResidence || student?.block, blocks);
}

export function wardenHostel(profile, blocks = []) {
  return normalizeHostel(profile?.hostel) || hostelForBlock(profile?.block, blocks);
}

export function studentMatchesHostel(student, hostel, blocks = []) {
  return !hostel || hostelForStudent(student, blocks) === hostel;
}
