import { useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Button, Field, Pill } from "../../../components/dashboard/student/ui";
import { UploadIcon } from "../../../components/dashboard/admin/icons";
import { parseDataFile, validateRecords } from "../../../utils/fileImport";
import { bulkAddDocuments, bulkUpsertStudentsByEmail } from "../../../firebase/firestore";
import { IMPORT_TARGETS } from "../../../utils/importSchemas";

export default function DataImport() {
  const { user } = useAuth();
  const [targetKey, setTargetKey] = useState(IMPORT_TARGETS[0].key);
  const target = IMPORT_TARGETS.find((t) => t.key === targetKey);

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | parsing | validated | importing | done | error
  const [parseError, setParseError] = useState("");
  const [validation, setValidation] = useState(null); // { validRecords, errors }
  const [importedCount, setImportedCount] = useState(0);
  const [importFailures, setImportFailures] = useState([]);
  const inputRef = useRef(null);

  function reset() {
    setFile(null);
    setStatus("idle");
    setParseError("");
    setValidation(null);
    setImportedCount(0);
    setImportFailures([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setStatus("parsing");
    setParseError("");
    setValidation(null);

    try {
      const { records } = await parseDataFile(f);
      const result = validateRecords(records, target.columns, target.dedupeKeys || []);
      setValidation(result);
      setStatus("validated");
    } catch (err) {
      console.error("File parse failed:", err);
      setParseError(err.message || "Couldn't read that file.");
      setStatus("error");
    }
  }

  async function handleImport() {
    if (!validation || validation.validRecords.length === 0) return;
    setStatus("importing");
    setImportFailures([]);
    try {
      if (target.key === "students") {
        // Special case: this collection's document ID must be the
        // student's real Firebase Auth UID, resolved here from the row's
        // email — a plain auto-ID bulk insert would create records no
        // student's dashboard ever reads. See bulkUpsertStudentsByEmail.
        const { written, failed } = await bulkUpsertStudentsByEmail(validation.validRecords, user?.uid);
        setImportedCount(written);
        setImportFailures(failed);
      } else if (target.key === "visitors") {
        // Backfill a real sortable timestamp alongside the human-readable
        // inTime string — Firestore's orderBy silently drops documents
        // missing the ordered field, so without this every imported
        // visitor would vanish from the (inTimeSort-ordered) visitor pages.
        const withSortableTime = validation.validRecords.map((r) => {
          const parsed = r.inTime ? Date.parse(r.inTime) : NaN;
          return { ...r, inTimeSort: Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString() };
        });
        const written = await bulkAddDocuments(target.collection, withSortableTime, user?.uid);
        setImportedCount(written);
      } else {
        const written = await bulkAddDocuments(target.collection, validation.validRecords, user?.uid);
        setImportedCount(written);
      }
      setStatus("done");
    } catch (err) {
      console.error("Import failed:", err);
      setParseError("Import failed while writing to the database. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card
        title="Bulk data import"
        subtitle="Upload a CSV or Excel file to add real records to the database. Every row is validated before anything is written."
      >
        <div className="flex flex-col gap-4">
          <Field label="Data type">
            <select
              className="input"
              value={targetKey}
              onChange={(e) => {
                setTargetKey(e.target.value);
                reset();
              }}
            >
              {IMPORT_TARGETS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
            <p className="font-medium text-ink">Expected columns for “{target.label}”</p>
            {target.description && <p className="mt-1 text-xs text-slate-500">{target.description}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {target.columns.map((c) => (
                <span
                  key={c.key}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    c.required ? "border-teal-300 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {c.key}
                  {c.required ? " *" : ""}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">* required column. First row of the file must be the header row.</p>
          </div>

          <Field label="File (.csv, .xlsx, .xls)">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-teal-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-400"
            />
          </Field>

          {status === "parsing" && <p className="text-sm text-slate-400">Reading file…</p>}

          {status === "error" && parseError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{parseError}</div>
          )}

          {validation && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Pill tone={validation.validRecords.length > 0 ? "Resolved" : "Open"}>
                  {validation.validRecords.length} valid row{validation.validRecords.length === 1 ? "" : "s"}
                </Pill>
                {validation.errors.length > 0 && (
                  <Pill tone="Open">{validation.errors.length} error{validation.errors.length === 1 ? "" : "s"}</Pill>
                )}
                <span className="text-xs text-slate-400">from {file?.name}</span>
              </div>

              {validation.errors.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-rose-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-50 text-rose-700">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Field</th>
                        <th className="px-3 py-2">Problem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {validation.errors.map((e, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-slate-500">{e.row || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{e.field || "—"}</td>
                          <td className="px-3 py-2 text-rose-700">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={validation.validRecords.length === 0 || status === "importing"}
                >
                  {status === "importing"
                    ? "Importing…"
                    : `Import ${validation.validRecords.length} row${validation.validRecords.length === 1 ? "" : "s"} to database`}
                </Button>
                <Button variant="outline" onClick={reset}>
                  Choose a different file
                </Button>
              </div>
            </div>
          )}

          {status === "done" && (
            <div className="flex flex-col gap-2">
              <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                Imported {importedCount} record{importedCount === 1 ? "" : "s"} into “{target.collection}”. They'll now
                appear on the relevant dashboards immediately — refresh any open page to see them.
                {importFailures.length > 0 && ` ${importFailures.length} row${importFailures.length === 1 ? "" : "s"} could not be matched to an existing account and were not imported.`}
              </div>
              {importFailures.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-amber-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-50 text-amber-800">
                      <tr>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {importFailures.map((f, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-slate-500">{f.email || "—"}</td>
                          <td className="px-3 py-2 text-amber-800">{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card title="How this works" className="bg-slate-50/60">
        <ul className="flex flex-col gap-2 text-sm text-slate-500">
          <li className="flex gap-2">
            <UploadIcon />
            <span>Your file is parsed and checked against the expected columns before anything is saved — invalid rows are listed with the exact problem, and are never imported.</span>
          </li>
          <li className="flex gap-2">
            <UploadIcon />
            <span>Only valid rows are written, directly to the live Firestore database — not to this browser's memory — so every dashboard, chart and stat updates from real data immediately.</span>
          </li>
          <li className="flex gap-2">
            <UploadIcon />
            <span>Student login accounts (with email/password) are created individually or via bulk-CSV under “Manage Users”, not here — this page is for the operational records tied to those accounts.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
