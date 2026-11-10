/** Safely normalize Firestore Timestamp, Date, ISO, or Excel date values to
 * YYYY-MM-DD so calendar pages never call string methods on a Timestamp. */
export function dateKey(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
  }
  const date = typeof value.toDate === "function" ? value.toDate() : value instanceof Date ? value : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}
