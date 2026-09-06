import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { WrenchIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { updateDocument, logAudit } from "../../../firebase/firestore";

const statusFilters = ["All", "Open", "In Progress", "Resolved"];
const COMPLAINT_CATEGORIES = ["Room", "Wing", "Food", "Other"];
const STAFF_LIST = ["Electrician", "Plumber", "Carpenter", "Mess Staff", "Housekeeping"];

export default function WardenComplaints() {
  const { profile, user } = useAuth();
  const complaintsQuery = useCollection("complaints", { orderByField: "date" });
  const complaints = complaintsQuery.data;
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    return complaints.filter(
      (c) =>
        (categoryFilter === "All" || c.category === categoryFilter) &&
        (statusFilter === "All" || c.status === statusFilter)
    );
  }, [complaints, categoryFilter, statusFilter]);

  async function assignStaff(id, staff) {
    const c = complaints.find((x) => x.id === id);
    try {
      await updateDocument("complaints", id, { assignedTo: staff, status: c?.status === "Open" ? "In Progress" : c?.status });
    } catch (err) {
      console.error("Failed to assign staff:", err);
    }
  }

  async function setStatus(id, status) {
    const c = complaints.find((x) => x.id === id);
    try {
      await updateDocument("complaints", id, { status });
      if (status === "Resolved") {
        logAudit({
          actor: profile?.name || user?.email || "Warden",
          action: "Resolved complaint",
          target: c ? `${c.studentName || "Student"} — ${c.category || "complaint"}` : id,
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to update complaint:", err);
    }
  }

  const open = complaints.filter((c) => c.status === "Open").length;
  const inProgress = complaints.filter((c) => c.status === "In Progress").length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;

  const columns = [
    {
      key: "title",
      label: "Complaint",
      sortable: true,
      render: (c) => (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{c.title}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{c.category}</span>
            <Pill tone={c.priority}>{c.priority}</Pill>
          </div>
          <p className="text-xs text-slate-500">{c.description}</p>
        </>
      ),
    },
    { key: "studentName", label: "Student", sortable: true, render: (c) => (<>{c.studentName}<p className="text-xs text-slate-400">{c.room || "—"} · {c.date}</p></>) },
    {
      key: "status",
      label: "Status / action",
      render: (c) => (
        <div className="flex flex-col items-start gap-2">
          <Pill tone={c.status}>{c.status}</Pill>
          {c.status !== "Resolved" && (
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 focus:border-teal-400 focus:outline-none"
                value={c.assignedTo || ""}
                onChange={(e) => assignStaff(c.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Assign staff…</option>
                {STAFF_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button className="px-3 py-1 text-xs" onClick={() => setStatus(c.id, "Resolved")}>
                Mark resolved
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Open</p>
          <p className="mt-2 font-display text-2xl font-semibold text-rose-600">{open}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">In progress</p>
          <p className="mt-2 font-display text-2xl font-semibold text-amber-600">{inProgress}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Resolved</p>
          <p className="mt-2 font-display text-2xl font-semibold text-teal-600">{resolved}</p>
        </Card>
      </div>

      <Card
        title="Complaint queue"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 focus:border-teal-400 focus:outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All categories</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-1.5">
              {statusFilters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === s ? "bg-navy-950 text-white" : "border border-slate-200 text-slate-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <DataTable
          columns={columns}
          rows={filtered}
          loading={complaintsQuery.loading}
          searchKeys={["title", "studentName", "category", "room"]}
          searchPlaceholder="Search complaints…"
          emptyTitle="No complaints filed yet"
          emptyDescription="Complaints filed by students will show up here."
          emptyIcon={<WrenchIcon />}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
