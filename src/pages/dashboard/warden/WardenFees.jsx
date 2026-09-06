import { useMemo, useState } from "react";
import { Card, Pill, Button, ProgressBar } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { WalletIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { updateDocument } from "../../../firebase/firestore";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

const filters = ["All", "Paid", "Partial", "Overdue"];

export default function WardenFees() {
  const feesQuery = useCollection("fees");
  const studentFees = feesQuery.data;
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(
    () => (filter === "All" ? studentFees : studentFees.filter((s) => s.status === filter)),
    [studentFees, filter]
  );

  const totalDue = studentFees.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const totalCollected = studentFees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const collectionPct = totalDue ? Math.round((totalCollected / totalDue) * 100) : 0;
  const overdueCount = studentFees.filter((s) => s.status === "Overdue").length;
  const partialCount = studentFees.filter((s) => s.status === "Partial").length;

  async function sendReminder(id) {
    try {
      await updateDocument("fees", id, { reminderSent: true, reminderSentAt: new Date().toISOString() });
    } catch (err) {
      console.error("Failed to send reminder:", err);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
            <WalletIcon />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-slate-500">Fee collection across your wings</p>
              <p className="font-display text-lg font-semibold text-ink">{totalDue ? `${collectionPct}%` : "—"}</p>
            </div>
            {totalDue ? (
              <>
                <div className="mt-3">
                  <ProgressBar value={totalCollected} max={totalDue} tone="amber" />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                  <span>{inr(totalCollected)} collected</span>
                  <span>{inr(totalDue - totalCollected)} pending</span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No fee records yet.</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fully paid</p>
          <p className="mt-2 font-display text-2xl font-semibold text-teal-600">
            {studentFees.filter((s) => s.status === "Paid").length}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Partial payments</p>
          <p className="mt-2 font-display text-2xl font-semibold text-amber-600">{partialCount}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overdue / defaulters</p>
          <p className="mt-2 font-display text-2xl font-semibold text-rose-600">{overdueCount}</p>
        </Card>
      </div>

      <Card
        title="Student fee status"
        action={
          <div className="flex gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f ? "bg-navy-950 text-white" : "border border-slate-200 text-slate-500"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      >
        <DataTable
          columns={[
            { key: "studentName", label: "Student", sortable: true },
            { key: "room", label: "Room", render: (s) => s.room || "—" },
            { key: "paid", label: "Paid / Total", sortable: true, render: (s) => `${inr(s.paid)} / ${inr(s.total)}` },
            { key: "dueDate", label: "Due date", sortable: true, render: (s) => s.dueDate || "—" },
            { key: "status", label: "Status", render: (s) => <Pill tone={s.status}>{s.status}</Pill> },
            {
              key: "action",
              label: "Action",
              render: (s) =>
                s.status === "Paid" ? (
                  <span className="text-xs text-slate-300">—</span>
                ) : s.reminderSent ? (
                  <span className="text-xs font-medium text-teal-600">Reminder sent</span>
                ) : (
                  <Button variant="outline" className="px-3 py-1 text-xs" onClick={() => sendReminder(s.id)}>
                    Send reminder
                  </Button>
                ),
            },
          ]}
          rows={filtered}
          loading={feesQuery.loading}
          searchKeys={["studentName", "room"]}
          searchPlaceholder="Search students…"
          emptyTitle="No fee records yet"
          emptyDescription="Fee records imported by the admin office will show up here."
          emptyIcon={<WalletIcon />}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
