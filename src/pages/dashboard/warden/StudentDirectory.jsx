import { useMemo, useRef, useState } from "react";
import { downloadCsvAsXlsx } from "../../../utils/xlsxExport";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { UsersIcon, DownloadIcon, UploadIcon } from "../../../components/dashboard/warden/icons";
import { useStudentDirectory } from "../../../hooks/useStudentDirectory";
import { bulkUpsertHostelAssignments, logAudit } from "../../../firebase/firestore";
import { toCsvText } from "../../../utils/csv";
import { parseAndValidateHostelCsv } from "../../../utils/wardenDirectoryImport";
import { wardenHostel } from "../../../utils/hostels";

const COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "regNo", label: "Registration No", render: (r) => <span className="font-mono text-xs">{r.regNo || "—"}</span> },
  { key: "email", label: "Email", render: (r) => r.email || "—" },
  { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
  { key: "wing", label: "Wing/Block", sortable: true, render: (r) => r.wing || "—" },
  { key: "room", label: "Room", sortable: true, render: (r) => r.room || "—" },
  { key: "bed", label: "Bed", render: (r) => r.bed || "—" },
  { key: "branch", label: "Branch", render: (r) => r.branch || "—" },
  { key: "year", label: "Year", render: (r) => r.year || "—" },
  {
    key: "status",
    label: "Status",
    render: (r) => <Pill tone={r.status === "Inactive" || r.status === "Account needed" ? "Pending" : "Approved"}>{r.status || "Active"}</Pill>,
  },
];

const CSV_EXPORT_COLUMNS = [
  { label: "Registration Number", value: (r) => r.regNo || "" },
  { label: "Name", value: (r) => r.name },
  { label: "Email", value: (r) => r.email },
  { label: "Phone", value: (r) => r.phone },
  { label: "Wing/Block", value: (r) => r.wing },
  { label: "Room", value: (r) => r.room },
  { label: "Bed", value: (r) => r.bed },
  { label: "Gender", value: (r) => r.gender },
  { label: "Branch/Course", value: (r) => r.branch },
  { label: "Year", value: (r) => r.year },
  { label: "Status", value: (r) => r.status },
];

export default function StudentDirectory() {
  const { profile } = useAuth();
  const assignedHostel = wardenHostel(profile);

  // Shared source with attendance, including academic-register rows that
  // don't have a portal account yet. Those are visibly marked as needing an
  // account rather than silently omitted.
  const { directory, loading, error } = useStudentDirectory();

  // Hostel assignment includes every block in that hostel (A and B for boys;
  // C for girls). Block remains each student's room location.
  const wingScoped = useMemo(
    () => (assignedHostel ? directory.filter((s) => s.hostelType === assignedHostel) : directory),
    [directory, assignedHostel]
  );

  const [wingFilter, setWingFilter] = useState("All");
  const wings = useMemo(
    () => ["All", ...Array.from(new Set(wingScoped.map((s) => s.wing).filter(Boolean)))],
    [wingScoped]
  );
  const [branchFilter, setBranchFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const branches = useMemo(() => ["All", ...new Set(wingScoped.map((s) => s.branch).filter(Boolean))], [wingScoped]);
  const blocks = useMemo(() => ["All", ...new Set(wingScoped.map((s) => s.hostelResidence).filter(Boolean))], [wingScoped]);
  const years = useMemo(() => ["All", ...new Set(wingScoped.map((s) => s.year).filter(Boolean))], [wingScoped]);

  const scoped = useMemo(
    () => wingScoped.filter((s) => (wingFilter === "All" || s.wing === wingFilter) && (branchFilter === "All" || s.branch === branchFilter) && (blockFilter === "All" || s.hostelResidence === blockFilter) && (yearFilter === "All" || s.year === yearFilter)),
    [wingScoped, wingFilter, branchFilter, blockFilter, yearFilter]
  );

  function handleDownload() {
    const csv = toCsvText(scoped, CSV_EXPORT_COLUMNS);
    downloadCsvAsXlsx(csv, "student-directory.xlsx");
  }

  // ---- Upload CSV: update hostel assignment (wing/room/bed) only ----
  const fileInputRef = useRef(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle | parsing | validated | importing | done | error
  const [uploadError, setUploadError] = useState("");
  const [validation, setValidation] = useState(null); // { validRecords, errors }
  const [importedCount, setImportedCount] = useState(0);
  const [importFailures, setImportFailures] = useState([]);

  function resetUpload() {
    setUploadFile(null);
    setUploadStatus("idle");
    setUploadError("");
    setValidation(null);
    setImportedCount(0);
    setImportFailures([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadFile(f);
    setUploadStatus("parsing");
    setUploadError("");
    setValidation(null);
    setImportedCount(0);
    setImportFailures([]);

    try {
      const result = await parseAndValidateHostelCsv(f, { directory, assignedHostel });
      setValidation(result);
      setUploadStatus("validated");
    } catch (err) {
      console.error("Failed to parse hostel CSV:", err);
      setUploadError(err.message || "Couldn't read that file.");
      setUploadStatus("error");
    }
  }

  async function handleImport() {
    if (!validation || validation.validRecords.length === 0) return;
    setUploadStatus("importing");
    try {
      const { written, failed } = await bulkUpsertHostelAssignments(validation.validRecords, profile?.id);
      setImportedCount(written);
      setImportFailures(failed);
      setUploadStatus("done");
      if (written > 0) {
        logAudit({
          actor: profile?.name || "Warden",
          action: "Updated hostel directory via CSV",
          target: `${written} student${written === 1 ? "" : "s"}${assignedHostel ? ` (${assignedHostel})` : ""}`,
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Hostel directory import failed:", err);
      setUploadError("Import failed while writing to the database. Please try again.");
      setUploadStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
              <UsersIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Student directory</p>
              <p className="text-sm text-slate-500">
                {scoped.length} student{scoped.length === 1 ? "" : "s"}
                {assignedHostel ? ` in ${assignedHostel}` : " across both hostels"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Filter by branch" className={`${inputCls} sm:w-44`} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>{branches.map((v) => <option key={v} value={v}>{v === "All" ? "All branches" : v}</option>)}</select>
            <select aria-label="Filter by hostel block" className={`${inputCls} sm:w-44`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>{blocks.map((v) => <option key={v} value={v}>{v === "All" ? "All blocks" : v}</option>)}</select>
            <select aria-label="Filter by year" className={`${inputCls} sm:w-36`} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>{years.map((v) => <option key={v} value={v}>{v === "All" ? "All years" : v}</option>)}</select>
            <select className={`${inputCls} sm:w-44`} value={wingFilter} onChange={(e) => setWingFilter(e.target.value)}>
              {wings.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={handleDownload}>
              <DownloadIcon /> Download Excel
            </Button>
            <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>
              <UploadIcon /> Upload CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={COLUMNS}
          rows={scoped}
          loading={loading}
          error={error}
          searchKeys={["name", "regNo", "email", "room", "branch", "year"]}
          searchPlaceholder="Search by name, registration number, or room…"
          emptyTitle="No students yet"
          emptyDescription="Student accounts and room allocations will show up here."
          emptyIcon={<UsersIcon />}
          pageSize={12}
        />
      </Card>

      {uploadFile && (
        <Card
          title="Update hostel directory from CSV"
          subtitle={`Expected columns: uid (or email), wing, room, bed. Only these hostel fields are updated — no accounts, roles, or credentials are created or changed.${
            assignedHostel ? ` Restricted to your assigned hostel: ${assignedHostel}.` : ""
          }`}
        >
          <div className="flex flex-col gap-4">
            {uploadStatus === "parsing" && <p className="text-sm text-slate-400">Reading file…</p>}

            {uploadStatus === "error" && uploadError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{uploadError}</div>
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
                  <span className="text-xs text-slate-400">from {uploadFile.name}</span>
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

                {uploadStatus !== "done" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleImport}
                      disabled={validation.validRecords.length === 0 || uploadStatus === "importing"}
                    >
                      {uploadStatus === "importing"
                        ? "Updating…"
                        : `Update ${validation.validRecords.length} student${validation.validRecords.length === 1 ? "" : "s"}`}
                    </Button>
                    <Button variant="outline" onClick={resetUpload}>
                      Choose a different file
                    </Button>
                  </div>
                )}
              </div>
            )}

            {uploadStatus === "done" && (
              <div className="flex flex-col gap-2">
                <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                  Updated {importedCount} student{importedCount === 1 ? "" : "s"}' hostel assignment
                  {importedCount === 1 ? "" : "s"} in the directory.
                  {importFailures.length > 0 && ` ${importFailures.length} row${importFailures.length === 1 ? "" : "s"} could not be matched to an existing Student account and were not applied.`}
                </div>
                {importFailures.length > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-amber-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-amber-50 text-amber-800">
                        <tr>
                          <th className="px-3 py-2">Student</th>
                          <th className="px-3 py-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {importFailures.map((f, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-slate-500">{f.identifier || "—"}</td>
                            <td className="px-3 py-2 text-amber-800">{f.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div>
                  <Button variant="outline" onClick={resetUpload}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
