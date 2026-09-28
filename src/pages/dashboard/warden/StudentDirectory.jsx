import { useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { UsersIcon, DownloadIcon, UploadIcon } from "../../../components/dashboard/warden/icons";
import { useCollections } from "../../../hooks/useCollection";
import { useStudentDirectory } from "../../../hooks/useStudentDirectory";
import { bulkUpsertHostelAssignments, logAudit } from "../../../firebase/firestore";
import { toCsvText, downloadTextFile } from "../../../utils/csv";
import { parseAndValidateHostelCsv } from "../../../utils/wardenDirectoryImport";

const COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "id", label: "Student ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
  { key: "email", label: "Email", render: (r) => r.email || "—" },
  { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
  { key: "wing", label: "Wing/Block", sortable: true, render: (r) => r.wing || "—" },
  { key: "room", label: "Room", sortable: true, render: (r) => r.room || "—" },
  { key: "bed", label: "Bed", render: (r) => r.bed || "—" },
  { key: "regNo", label: "Reg. No", render: (r) => r.regNo || "—" },
  { key: "branch", label: "Branch", render: (r) => r.branch || "—" },
  { key: "year", label: "Year", render: (r) => r.year || "—" },
  {
    key: "status",
    label: "Status",
    render: (r) => <Pill tone={r.status === "Inactive" ? "Pending" : "Approved"}>{r.status || "Active"}</Pill>,
  },
];

const CSV_EXPORT_COLUMNS = [
  { label: "Student ID", value: (r) => r.id },
  { label: "Name", value: (r) => r.name },
  { label: "Email", value: (r) => r.email },
  { label: "Phone", value: (r) => r.phone },
  { label: "Wing/Block", value: (r) => r.wing },
  { label: "Room", value: (r) => r.room },
  { label: "Bed", value: (r) => r.bed },
  { label: "Registration Number", value: (r) => r.regNo },
  { label: "Branch/Course", value: (r) => r.branch },
  { label: "Year", value: (r) => r.year },
  { label: "Status", value: (r) => r.status },
];

export default function StudentDirectory() {
  const { profile } = useAuth();
  const assignedWing = profile?.block && profile.block !== "Unassigned" ? profile.block : "";

  // The base roster (name/email/phone/wing/room/bed) is the shared
  // Student Directory join — also used by the Attendance take-attendance
  // workflow, so both pages always agree on the same students and the
  // same room/bed. This page additionally enriches it with the academic
  // register below.
  const { directory: baseDirectory, loading, error } = useStudentDirectory();

  const { data } = useCollections({
    register: { name: "studentRegister" },
  });

  const registerByEmail = useMemo(() => {
    const map = {};
    data.register.forEach((r) => {
      if (r.email) map[r.email.trim().toLowerCase()] = r;
    });
    return map;
  }, [data.register]);

  const directory = useMemo(() => {
    return baseDirectory.map((s) => {
      const reg = s.email ? registerByEmail[s.email.trim().toLowerCase()] : null;
      return {
        ...s,
        regNo: reg?.regNo || "",
        branch: reg?.branch || "",
        year: reg?.year || "",
      };
    });
  }, [baseDirectory, registerByEmail]);

  // A warden assigned to a specific block (users/{uid}.block, the same
  // field Admin → Manage Users sets and Warden Overview scopes by) only
  // manages that wing's roster — mirrors Overview's exact `myWing` pattern.
  const wingScoped = useMemo(
    () => (assignedWing ? directory.filter((s) => s.wing === assignedWing) : directory),
    [directory, assignedWing]
  );

  const [wingFilter, setWingFilter] = useState("All");
  const wings = useMemo(
    () => ["All", ...Array.from(new Set(wingScoped.map((s) => s.wing).filter(Boolean)))],
    [wingScoped]
  );

  const scoped = useMemo(
    () => (wingFilter === "All" ? wingScoped : wingScoped.filter((s) => s.wing === wingFilter)),
    [wingScoped, wingFilter]
  );

  function handleDownload() {
    const csv = toCsvText(scoped, CSV_EXPORT_COLUMNS);
    downloadTextFile(csv, "student-directory.csv");
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
      const result = await parseAndValidateHostelCsv(f, { directory, assignedWing });
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
          target: `${written} student${written === 1 ? "" : "s"}${assignedWing ? ` (${assignedWing})` : ""}`,
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
                {scoped.length} resident{scoped.length === 1 ? "" : "s"}
                {assignedWing ? ` in ${assignedWing}` : " across the hostel"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${inputCls} sm:w-44`} value={wingFilter} onChange={(e) => setWingFilter(e.target.value)}>
              {wings.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={handleDownload}>
              <DownloadIcon /> Download CSV
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
          searchKeys={["name", "id", "email", "room", "regNo"]}
          searchPlaceholder="Search by name, room, or ID…"
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
            assignedWing ? ` Restricted to your assigned wing: ${assignedWing}.` : ""
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
