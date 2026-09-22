/**
 * Minimal CSV parser for the bulk user-upload form.
 * Expects a header row: name,email,password,role,hostelResidence,linkedStudentId
 * (hostelResidence and linkedStudentId are optional columns).
 * Handles simple comma-separated values; does not support quoted commas.
 */
export function parseUsersCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return { rows: [], errors: ["File is empty."] };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["name", "email", "password", "role"];
  const missing = required.filter((col) => !header.includes(col));
  if (missing.length > 0) {
    return { rows: [], errors: [`Missing required column(s): ${missing.join(", ")}`] };
  }

  const rows = [];
  const errors = [];

  lines.slice(1).forEach((line, i) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    header.forEach((col, idx) => {
      row[col] = values[idx] ?? "";
    });

    if (!row.name || !row.email || !row.password || !row.role) {
      errors.push(`Row ${i + 2}: missing a required value, skipped.`);
      return;
    }
    rows.push(row);
  });

  return { rows, errors };
}

export const CSV_TEMPLATE =
  "name,email,password,role,hostelResidence,linkedStudentId\n" +
  "Anita Sahoo,anita.sahoo@example.com,ChangeMe123,Student,Block C,\n" +
  "Ravi Kumar,ravi.kumar@example.com,ChangeMe123,Parent,,s27\n";

/**
 * Triggers a browser "Save As" for text content (used for CSV exports and
 * the bulk-upload template).
 *
 * Two things that look redundant here are mobile-Safari workarounds:
 *  - The link must be attached to the DOM before `.click()` — some WebKit
 *    versions ignore the click on a detached anchor.
 *  - The object URL must not be revoked synchronously. `.click()` returns
 *    before the browser has necessarily started the download, so revoking
 *    on the same tick can leave the download reading a dead URL. A short
 *    delay lets it start first.
 */
export function downloadTextFile(content, filename, mimeType = "text/csv") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
