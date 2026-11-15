function text(value) {
  return String(value ?? "").trim();
}

function usable(value) {
  return Boolean(value) && !["unassigned", "not assigned", "not specified", "none", "n/a"].includes(text(value).toLowerCase());
}

export function isHostelResident(record = {}) {
  return [record.hostelResidence, record.wing, record.block, record.room]
    .some(usable);
}

function residentKey(record = {}) {
  const regNo = text(record.registrationNo || record.regNo || record.registrationNumber).toLowerCase();
  const email = text(record.email).toLowerCase();
  const id = text(record.accountUid || record.userId || record.uid || record.id);
  return regNo ? `reg:${regNo}` : email ? `email:${email}` : id ? `id:${id}` : "";
}

/** Merge the student register and resident profiles without requiring a bed
 * assignment. Academic-register rows are the authoritative student count; a
 * hostel assignment is a separate piece of information and may be added later. */
export function mergeRegisteredStudents(...sources) {
  const merged = new Map();
  for (const record of sources.flat()) {
    const key = residentKey(record);
    if (!key) continue;
    merged.set(key, { ...(merged.get(key) || {}), ...record });
  }
  return [...merged.values()];
}

/** Merge resident allocations with assigned academic-register rows by identity. */
export function mergeHostelResidents(...sources) {
  const merged = new Map();
  for (const record of sources.flat()) {
    if (!isHostelResident(record)) continue;
    const key = residentKey(record);
    if (!key) continue;
    merged.set(key, { ...(merged.get(key) || {}), ...record });
  }
  return [...merged.values()];
}

export function residentBlockName(record = {}) {
  return text(record.block || record.wing || record.hostelResidence);
}
