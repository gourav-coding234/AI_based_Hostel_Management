/** A due date typed with a bad year (e.g. "0044-04-04") must never be shown as real. */
export function isSaneDate(value, { minYear = 2000, maxYear = 2100 } = {}) {
  if (!value) return false;
  const time = typeof value?.toMillis === "function" ? value.toMillis() : Date.parse(value);
  if (!Number.isFinite(time)) return false;
  const year = new Date(time).getUTCFullYear();
  return year >= minYear && year <= maxYear;
}

/** Friendly "04 Apr 2026" for valid dates; empty string for missing/garbage ones. */
export function formatDueDate(value) {
  if (!isSaneDate(value)) return "";
  const date = new Date(typeof value?.toMillis === "function" ? value.toMillis() : Date.parse(value));
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
