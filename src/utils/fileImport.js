// Parses CSV or Excel (.xlsx/.xls) files into plain row objects, ready for
// per-row schema validation before anything gets written to Firestore.
// No demo/sample rows are ever injected here — an invalid or empty file
// simply produces an empty/erroring result for the UI to report.

// `xlsx` is ~330 kB — a third of the admin bundle — and is only needed when
// someone actually uploads a spreadsheet. Importing it dynamically inside
// parseDataFile keeps it out of the initial dashboard download; CSV uploads
// never fetch it at all.

/** Minimal RFC4180-ish CSV line splitter (handles quoted commas). */
function parseCsvText(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function rowsToObjects(rows) {
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1).map((r) =>
    Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").toString().trim()]))
  );
  return { headers, records };
}

/**
 * Reads a File (csv/xlsx/xls) and returns { headers, records }.
 * `records` is an array of plain objects keyed by the file's header row —
 * still raw/untrusted strings at this point, nothing is written anywhere.
 */
export async function parseDataFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const text = await file.text();
    return rowsToObjects(parseCsvText(text));
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
    const stringRows = rows.map((r) => r.map((c) => (c === undefined || c === null ? "" : String(c))));
    return rowsToObjects(stringRows);
  }

  throw new Error("Unsupported file type. Please upload a .csv, .xlsx, or .xls file.");
}

/**
 * Validates parsed records against a column schema.
 * schema: [{ key, label, required, type: "string"|"number"|"date"|"email"|"enum", enumValues }]
 * dedupeKeys: optional array of field keys — rows sharing the same
 * combination of values for these fields (after the first) are reported as
 * duplicates and left out of validRecords, so re-importing the same file
 * (or a file with copy-pasted rows) doesn't silently create duplicate
 * Firestore documents. This only catches duplicates *within the uploaded
 * file* — it does not check against records already in the database.
 * Returns { validRecords, errors: [{ row, field, message }] }
 */
export function validateRecords(records, schema, dedupeKeys = []) {
  const errors = [];
  const validRecords = [];
  const seenKeys = new Set();

  if (records.length === 0) {
    errors.push({ row: 0, field: "", message: "The file has no data rows." });
    return { validRecords, errors };
  }

  const headerKeys = new Set(Object.keys(records[0] || {}));
  const missingColumns = schema.filter((f) => f.required && !headerKeys.has(f.key));
  if (missingColumns.length > 0) {
    errors.push({
      row: 0,
      field: "",
      message: `Missing required column(s): ${missingColumns.map((f) => f.label).join(", ")}`,
    });
    return { validRecords, errors };
  }

  records.forEach((record, idx) => {
    const rowNum = idx + 2; // +1 for header row, +1 for 1-indexing
    let rowValid = true;
    const cleaned = {};

    for (const field of schema) {
      const raw = (record[field.key] ?? "").toString().trim();

      if (field.required && raw === "") {
        errors.push({ row: rowNum, field: field.label, message: `${field.label} is required.` });
        rowValid = false;
        continue;
      }
      if (raw === "") {
        cleaned[field.key] = "";
        continue;
      }

      if (field.type === "number") {
        const n = Number(raw);
        if (Number.isNaN(n)) {
          errors.push({ row: rowNum, field: field.label, message: `${field.label} must be a number (got "${raw}").` });
          rowValid = false;
          continue;
        }
        cleaned[field.key] = n;
      } else if (field.type === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
          errors.push({ row: rowNum, field: field.label, message: `${field.label} must be a valid email (got "${raw}").` });
          rowValid = false;
          continue;
        }
        cleaned[field.key] = raw;
      } else if (field.type === "date") {
        if (Number.isNaN(Date.parse(raw))) {
          errors.push({ row: rowNum, field: field.label, message: `${field.label} must be a valid date (got "${raw}").` });
          rowValid = false;
          continue;
        }
        cleaned[field.key] = raw;
      } else if (field.type === "enum") {
        if (!field.enumValues.includes(raw)) {
          errors.push({
            row: rowNum,
            field: field.label,
            message: `${field.label} must be one of: ${field.enumValues.join(", ")} (got "${raw}").`,
          });
          rowValid = false;
          continue;
        }
        cleaned[field.key] = raw;
      } else {
        cleaned[field.key] = raw;
      }
    }

    if (rowValid && dedupeKeys.length > 0) {
      const keyString = dedupeKeys.map((k) => cleaned[k] ?? "").join("||");
      // Blank keys (e.g. an optional dueDate left empty) aren't meaningful
      // duplicates of each other — only flag when every key field has a value.
      const allKeysPresent = dedupeKeys.every((k) => cleaned[k] !== undefined && cleaned[k] !== "");
      if (allKeysPresent && seenKeys.has(keyString)) {
        errors.push({
          row: rowNum,
          field: dedupeKeys.join(" + "),
          message: `Duplicate row — same ${dedupeKeys.join("/")} as an earlier row in this file. Skipped.`,
        });
        rowValid = false;
      } else if (allKeysPresent) {
        seenKeys.add(keyString);
      }
    }

    if (rowValid) validRecords.push(cleaned);
  });

  return { validRecords, errors };
}
