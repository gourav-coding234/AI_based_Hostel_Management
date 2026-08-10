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
