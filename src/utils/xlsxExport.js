// Builds a genuine .xlsx workbook (via SheetJS) from plain row data and
// triggers a browser download — the export counterpart of fileImport.js's
// XLSX read path.
//
// `xlsx` is loaded dynamically so pages that never export don't pay for it
// in their initial bundle; the same lazy-import pattern parseDataFile()
// already uses for uploads.

/**
 * columns: [{ label, value(row) }] — same shape as utils/csv.js's
 * toCsvText, so a page that already has CSV export columns defined can
 * reuse the exact same column list for an Excel export.
 */
export async function downloadXlsxFile(rows, columns, filename, sheetName = "Sheet1") {
  const XLSX = await import("xlsx");

  const header = columns.map((c) => c.label);
  const body = rows.map((row) => columns.map((c) => c.value(row)));
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // A real binary .xlsx (ZIP/OOXML) array buffer — not CSV text saved
  // under an .xlsx name.
  const wbArray = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Same mobile-Safari-safe download dance as utils/csv.js's
  // downloadTextFile: link attached to the DOM before .click(), object
  // URL revoked on a delay rather than synchronously.
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

export async function downloadCsvAsXlsx(csvText, filename, sheetName = "Records") {
  const XLSX = await import("xlsx");
  const parsed = XLSX.read(csvText, { type: "string", raw: true });
  const source = parsed.Sheets[parsed.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(source, { header: 1, defval: "" });
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const widths = rows.reduce((maxima, row) => {
    row.forEach((value, index) => { maxima[index] = Math.min(48, Math.max(maxima[index] || 10, String(value ?? "").length + 2)); });
    return maxima;
  }, []);
  worksheet["!cols"] = widths.map((wch) => ({ wch }));
  if (worksheet["!ref"]) worksheet["!autofilter"] = { ref: worksheet["!ref"] };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/\.csv$/i, ".xlsx");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}