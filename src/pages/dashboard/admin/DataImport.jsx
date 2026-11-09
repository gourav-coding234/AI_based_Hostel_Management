import { useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import ConfirmDialog from "../../../components/dashboard/ConfirmDialog";
import { Card, Button, Field, Pill, EmptyState } from "../../../components/dashboard/student/ui";
import { UploadIcon } from "../../../components/dashboard/admin/icons";
import { parseDataFile, validateRecords } from "../../../utils/fileImport";
import { bulkAddDocuments, bulkUpsertStudentsByEmail, bulkDeleteDocuments, deleteDocument, logAudit } from "../../../firebase/firestore";
import { IMPORT_TARGETS } from "../../../utils/importSchemas";
import { useCollection } from "../../../hooks/useCollection";

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

      <DataDeleteSection />

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

function displayValue(value) {
  if (value == null || value === "") return "-";
  if (typeof value?.toDate === "function") return value.toDate().toLocaleString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function DataDeleteSection() {
  const { profile, user } = useAuth();
  const [targetKey, setTargetKey] = useState(IMPORT_TARGETS[0].key);
  const target = IMPORT_TARGETS.find((item) => item.key === targetKey);
  const recordsQuery = useCollection(target.collection);
  const records = recordsQuery.data;
  const loading = recordsQuery.loading;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((record) => Object.entries(record).some(([key, value]) =>
      key !== "id" && displayValue(value).toLowerCase().includes(q)));
  }, [records, search]);

  function requestDelete(spec) {
    setDeletePhrase("");
    setConfirm(spec);
  }

  function toggle(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleVisible() {
    const ids = filtered.map((record) => record.id);
    const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected((current) => allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  }

  async function performDelete() {
    if (!confirm) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { ids, bulk } = confirm;
    setDeletePhrase("");
    try {
      if (bulk) await bulkDeleteDocuments(target.collection, ids);
      else await deleteDocument(target.collection, ids[0]);
      setSelected((current) => current.filter((id) => !ids.includes(id)));
      setMessage(`Deleted ${ids.length} record${ids.length === 1 ? "" : "s"} from ${target.label}.`);
      logAudit({
        actor: profile?.name || user?.email || "Admin",
        action: bulk ? "Bulk-deleted records" : "Deleted record",
        target: `${target.collection}: ${ids.length} record${ids.length === 1 ? "" : "s"}`,
      }).catch(() => {});
      setConfirm(null);
    } catch (err) {
      console.error("Failed to delete records:", err);
      setError("Some records could not be deleted. Refresh the list and try again.");
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  const visibleAllSelected = filtered.length > 0 && filtered.every((record) => selected.includes(record.id));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Delete data" subtitle="Remove individual records or select multiple records from an imported data collection. Deletion is permanent.">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data type">
              <select className="input" value={targetKey} onChange={(event) => { setTargetKey(event.target.value); setSearch(""); setMessage(""); }}>
                {IMPORT_TARGETS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Search records">
              <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by any field" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>{loading ? "Loading records..." : filtered.length + " shown | " + records.length + " total"}{selected.length ? " | " + selected.length + " selected" : ""}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleVisible} disabled={loading || filtered.length === 0}>{visibleAllSelected ? "Clear visible" : "Select visible"}</Button>
              <Button variant="danger" onClick={() => requestDelete({ ids: selected, bulk: true })} disabled={loading || selected.length === 0}>Delete selected ({selected.length})</Button>
            </div>
          </div>
          {(error || recordsQuery.error) && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || "Could not load these records. Check admin access and try again."}</div>}
          {message && <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</div>}
          {!loading && records.length === 0 && <EmptyState title="No records found" description={`There are no records in ${target.collection}.`} />}
          {!loading && records.length > 0 && filtered.length === 0 && <EmptyState title="No matching records" description="Try a different search term." />}
          {filtered.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
                  <th className="px-3 py-3"><input aria-label="Select visible records" type="checkbox" checked={visibleAllSelected} onChange={toggleVisible} /></th>
                  <th className="px-3 py-3">Record</th><th className="px-3 py-3">Document ID</th><th className="px-3 py-3 text-right">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((record) => {
                    const summary = Object.entries(record).filter(([key, value]) => key !== "id" && value != null && value !== "").slice(0, 3);
                    return <tr key={record.id}>
                      <td className="px-3 py-3"><input aria-label={`Select record ${record.id}`} type="checkbox" checked={selected.includes(record.id)} onChange={() => toggle(record.id)} /></td>
                      <td className="max-w-[32rem] px-3 py-3"><div className="flex flex-wrap gap-x-3 gap-y-1">{summary.map(([key, value]) => <span key={key} className="text-slate-600"><b className="font-medium text-slate-800">{key}:</b> {displayValue(value)}</span>)}</div></td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-400">{record.id}</td>
                      <td className="px-3 py-3 text-right"><Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => requestDelete({ ids: [record.id], bulk: false })}>Delete</Button></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
      {confirm && <ConfirmDialog
        title={confirm.bulk ? `Delete ${confirm.ids.length} records?` : "Delete this record?"}
        description={`This will permanently delete ${confirm.ids.length === 1 ? "this record" : `these ${confirm.ids.length} records`} from ${target.collection}. This cannot be undone.`}
        confirmLabel={confirm.bulk ? "Delete records" : "Delete record"}
        confirmText={["fees", "expenses", "attendance", "gatePasses", "leaveRequests"].includes(target.collection) ? `DELETE ${target.collection.toUpperCase()}` : ""}
        confirmValue={deletePhrase}
        onConfirmValueChange={setDeletePhrase}
        busy={busy}
        onConfirm={performDelete}
        onCancel={() => { setDeletePhrase(""); setConfirm(null); }}
      />}
    </div>
  );
}