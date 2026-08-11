import { useMemo, useState } from "react";
import { Card, Pill, Button, EmptyState } from "../../../components/dashboard/student/ui";
import { WrenchIcon } from "../../../components/dashboard/warden/icons";
import { allComplaints, complaintCategories, staffList } from "../../../data/wardenMock";

const statusFilters = ["All", "Open", "In Progress", "Resolved"];

export default function WardenComplaints() {
  const [complaints, setComplaints] = useState(allComplaints);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    return complaints.filter(
      (c) =>
        (categoryFilter === "All" || c.category === categoryFilter) &&
        (statusFilter === "All" || c.status === statusFilter)
    );
  }, [complaints, categoryFilter, statusFilter]);

  function assignStaff(id, staff) {
    setComplaints((list) =>
      list.map((c) => (c.id === id ? { ...c, assignedTo: staff, status: c.status === "Open" ? "In Progress" : c.status } : c))
    );
  }

  function setStatus(id, status) {
    setComplaints((list) => list.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  const open = complaints.filter((c) => c.status === "Open").length;
  const inProgress = complaints.filter((c) => c.status === "In Progress").length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;

  return (
    <div className="flex flex-col gap-6">
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
              {complaintCategories.map((c) => (
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
        {filtered.length === 0 ? (
          <EmptyState icon={<WrenchIcon />} title="No complaints match this filter" />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {filtered.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{c.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{c.category}</span>
                    <Pill tone={c.priority}>{c.priority}</Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
                  <p className="mt-1 text-xs text-slate-300">{c.student} · {c.room} · {c.id} · {c.date}</p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <Pill tone={c.status}>{c.status}</Pill>
                  {c.status !== "Resolved" && (
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 focus:border-teal-400 focus:outline-none"
                        value={c.assignedTo}
                        onChange={(e) => assignStaff(c.id, e.target.value)}
                      >
                        <option value="">Assign staff…</option>
                        {staffList.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <Button className="px-3 py-1 text-xs" onClick={() => setStatus(c.id, "Resolved")}>
                        Mark resolved
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
