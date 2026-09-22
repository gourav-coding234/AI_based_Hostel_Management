import { useMemo, useState } from "react";
import { Card, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { ClipboardIcon } from "../../../components/dashboard/admin/icons";
import { useCollection } from "../../../hooks/useCollection";

const COLUMNS = [
  { key: "regNo", label: "Reg. No", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "gender", label: "Gender", sortable: true },
  { key: "branch", label: "Branch", sortable: true },
  { key: "year", label: "Year", sortable: true },
  { key: "batch", label: "Batch", render: (r) => r.batch || "—" },
  { key: "email", label: "Email", render: (r) => r.email || "—" },
];

const YEAR_ORDER = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

/**
 * Read-only browser for the `studentRegister` collection — the
 * institute-wide academic roster imported via Data Import. Deliberately
 * separate from hostel residency (`students`): a name shows up here purely
 * because it was imported as an enrolled student, whether or not that
 * person has ever had a hostel bed or a portal login.
 */
export default function StudentRegister() {
  const { data, loading, error } = useCollection("studentRegister", {
    orderByField: "regNo",
    orderByDirection: "asc",
  });

  const [branchFilter, setBranchFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");

  const branches = useMemo(
    () => ["All", ...Array.from(new Set(data.map((s) => s.branch).filter(Boolean))).sort()],
    [data]
  );
  const years = useMemo(
    () => ["All", ...YEAR_ORDER.filter((y) => data.some((s) => s.year === y))],
    [data]
  );

  const scoped = useMemo(() => {
    return data.filter(
      (s) => (branchFilter === "All" || s.branch === branchFilter) && (yearFilter === "All" || s.year === yearFilter)
    );
  }, [data, branchFilter, yearFilter]);

  const maleCount = scoped.filter((s) => s.gender === "Male").length;
  const femaleCount = scoped.filter((s) => s.gender === "Female").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
              <ClipboardIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Student register</p>
              <p className="text-sm text-slate-500">
                {scoped.length} student{scoped.length === 1 ? "" : "s"}
                {branchFilter !== "All" || yearFilter !== "All" ? " matching filters" : " enrolled"}
                {scoped.length > 0 && ` — ${maleCount} male, ${femaleCount} female`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className={`${inputCls} sm:w-52`} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              {branches.map((b) => (
                <option key={b} value={b}>{b === "All" ? "All branches" : b}</option>
              ))}
            </select>
            <select className={`${inputCls} sm:w-36`} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              {years.map((y) => (
                <option key={y} value={y}>{y === "All" ? "All years" : y}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={COLUMNS}
          rows={scoped}
          loading={loading}
          error={error}
          searchKeys={["name", "regNo", "email"]}
          searchPlaceholder="Search by name, registration no, or email…"
          emptyTitle="No students in the register yet"
          emptyDescription="Import the academic roster from Data Import → Student register (academic) to populate this list."
          emptyIcon={<ClipboardIcon />}
          pageSize={20}
        />
      </Card>
    </div>
  );
}
