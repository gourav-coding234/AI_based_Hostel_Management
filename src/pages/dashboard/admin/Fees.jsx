import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, ProgressBar, StatCard, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import DataTable from "../../../components/ui/DataTable";
import { WalletIcon, AlertIcon } from "../../../components/dashboard/admin/icons";
import { useCollection } from "../../../hooks/useCollection";
import { addDocument, updateDocument, logAudit } from "../../../firebase/firestore";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function feeStatus(total, paid, dueDate) {
  const remaining = (Number(total) || 0) - (Number(paid) || 0);
  if (remaining <= 0) return "Paid";
  if (dueDate && new Date(dueDate) < new Date()) return "Overdue";
  return "Pending";
}

export default function Fees() {
  const { profile, user } = useAuth();
  const feesQuery = useCollection("fees");
  const fees = feesQuery.data;
  const studentsQuery = useCollection("students");
  const students = studentsQuery.data;

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ studentId: "", total: "", dueDate: "" });
  const [createError, setCreateError] = useState("");
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [recordingId, setRecordingId] = useState("");

  const totalDue = fees.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const totalCollected = fees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const collectionPct = totalDue ? Math.round((totalCollected / totalDue) * 100) : 0;

  const byBlock = useMemo(() => {
    const map = new Map();
    fees.forEach((f) => {
      const key = f.block || "Unspecified";
      if (!map.has(key)) map.set(key, { block: key, totalDue: 0, collected: 0 });
      const entry = map.get(key);
      entry.totalDue += Number(f.total) || 0;
      entry.collected += Number(f.paid) || 0;
    });
    return Array.from(map.values());
  }, [fees]);

  const defaulters = useMemo(
    () =>
      fees
        .map((f) => ({ ...f, due: (Number(f.total) || 0) - (Number(f.paid) || 0) }))
        .filter((f) => f.due > 0)
        .sort((a, b) => b.due - a.due),
    [fees]
  );

  const defaulterColumns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (d) => (
        <>
          <p className="font-medium text-ink">{d.studentName}</p>
          <p className="text-xs text-slate-400">{d.block || "—"} · {d.room || "—"}</p>
        </>
      ),
    },
    { key: "due", label: "Amount due", sortable: true, render: (d) => <span className="font-semibold text-rose-600">{inr(d.due)}</span> },
    { key: "dueDate", label: "Due date", sortable: true, render: (d) => d.dueDate || "—" },
    { key: "status", label: "Status", render: () => <Pill tone="Overdue">Overdue</Pill> },
  ];

  const allRecordsColumns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (d) => (
        <>
          <p className="font-medium text-ink">{d.studentName}</p>
          <p className="text-xs text-slate-400">{d.block || "—"} · {d.room || "—"}</p>
        </>
      ),
    },
    { key: "total", label: "Total", sortable: true, render: (d) => inr(d.total) },
    { key: "paid", label: "Paid", sortable: true, render: (d) => inr(d.paid) },
    { key: "dueDate", label: "Due date", sortable: true, render: (d) => d.dueDate || "—" },
    { key: "status", label: "Status", render: (d) => <Pill tone={feeStatus(d.total, d.paid, d.dueDate)}>{feeStatus(d.total, d.paid, d.dueDate)}</Pill> },
    {
      key: "action",
      label: "Record payment",
      render: (d) => {
        const remaining = Math.max((Number(d.total) || 0) - (Number(d.paid) || 0), 0);
        if (remaining <= 0) return <span className="text-xs text-slate-300">Fully paid</span>;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              min="0"
              max={remaining}
              placeholder="₹ amount"
              className={`${inputCls} w-24 py-1 text-xs`}
              value={paymentDrafts[d.id] ?? ""}
              onChange={(e) => setPaymentDrafts((p) => ({ ...p, [d.id]: e.target.value }))}
            />
            <Button
              variant="outline"
              className="px-2 py-1 text-xs"
              disabled={recordingId === d.id}
              onClick={() => recordPayment(d)}
            >
              {recordingId === d.id ? "…" : "Record"}
            </Button>
          </div>
        );
      },
    },
  ];

  async function createFeeRecord(e) {
    e.preventDefault();
    const student = students.find((s) => s.id === createForm.studentId);
    const total = Number(createForm.total);
    if (!student || !total || total <= 0 || !createForm.dueDate) {
      setCreateError("Pick a student, and give a total amount and due date.");
      return;
    }
    setCreateError("");
    try {
      await addDocument("fees", {
        studentId: student.id,
        studentName: student.name,
        block: student.hostelResidence || "",
        room: student.room || "",
        total,
        paid: 0,
        dueDate: createForm.dueDate,
        status: "Pending",
      });
      setCreateForm({ studentId: "", total: "", dueDate: "" });
      setCreating(false);
      logAudit({
        actor: profile?.name || user?.email || "Admin",
        action: "Created fee record",
        target: `${student.name} — ${inr(total)}`,
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to create fee record:", err);
      setCreateError("Something went wrong creating this record. Please try again.");
    }
  }

  async function recordPayment(record) {
    const amount = Number(paymentDrafts[record.id]);
    const remaining = Math.max((Number(record.total) || 0) - (Number(record.paid) || 0), 0);
    if (!amount || amount <= 0 || amount > remaining) return;
    setRecordingId(record.id);
    try {
      const newPaid = (Number(record.paid) || 0) + amount;
      await updateDocument("fees", record.id, {
        paid: newPaid,
        status: feeStatus(record.total, newPaid, record.dueDate),
        lastPaymentAt: new Date().toISOString(),
      });
      setPaymentDrafts((p) => ({ ...p, [record.id]: "" }));
      logAudit({
        actor: profile?.name || user?.email || "Admin",
        action: "Recorded fee payment",
        target: `${record.studentName || "Student"} — ${inr(amount)}`,
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to record payment:", err);
    } finally {
      setRecordingId("");
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<WalletIcon />} label="Total collected" value={totalDue ? inr(totalCollected) : "—"} sub={totalDue ? `of ${inr(totalDue)} due` : "No fee records yet"} tone="amber" />
        <StatCard icon={<WalletIcon />} label="Collection rate" value={totalDue ? `${collectionPct}%` : "—"} sub={`Across ${fees.length} record${fees.length === 1 ? "" : "s"}`} tone="teal" />
        <StatCard icon={<AlertIcon />} label="Defaulters" value={defaulters.length} sub="Need a follow-up nudge" tone="rose" />
      </div>

      <Card
        title="Create a fee record"
        action={
          <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => setCreating((c) => !c)}>
            {creating ? "Cancel" : "+ New record"}
          </Button>
        }
      >
        {creating && (
          <form onSubmit={createFeeRecord} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
            <Field label="Student">
              <select
                className={`${inputCls} min-w-[180px]`}
                value={createForm.studentId}
                onChange={(e) => setCreateForm((f) => ({ ...f, studentId: e.target.value }))}
              >
                <option value="">Select a student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} {s.hostelResidence ? `(${s.hostelResidence})` : ""}</option>
                ))}
              </select>
            </Field>
            <Field label="Total amount">
              <input
                type="number"
                min="1"
                className={`${inputCls} w-32`}
                placeholder="₹"
                value={createForm.total}
                onChange={(e) => setCreateForm((f) => ({ ...f, total: e.target.value }))}
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                className={`${inputCls} w-40`}
                value={createForm.dueDate}
                onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </Field>
            <Button type="submit">Create record</Button>
            {createError && <p className="w-full text-sm text-rose-600">{createError}</p>}
          </form>
        )}
        {!creating && <p className="text-sm text-slate-400">Add a fee record for a student who doesn't have one yet, or use Data Import for bulk entry.</p>}
      </Card>

      <Card title="Collection by block">
        {feesQuery.loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : byBlock.length === 0 ? (
          <EmptyState icon={<WalletIcon />} title="No fee records yet" description="Import fee records via Data Import, or they'll appear here as they're added." />
        ) : (
          <div className="flex flex-col gap-5">
            {byBlock.map((f) => {
              const pct = f.totalDue ? Math.round((f.collected / f.totalDue) * 100) : 0;
              return (
                <div key={f.block}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{f.block}</span>
                    <span className="text-slate-500">{inr(f.collected)} / {inr(f.totalDue)} · {pct}%</span>
                  </div>
                  <ProgressBar value={f.collected} max={f.totalDue || 1} tone={pct < 80 ? "rose" : "teal"} />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="All fee records">
        <DataTable
          columns={allRecordsColumns}
          rows={fees}
          loading={feesQuery.loading}
          searchKeys={["studentName", "block", "room"]}
          searchPlaceholder="Search fee records…"
          emptyTitle="No fee records yet"
          emptyDescription="Records you create here, or import via Data Import, will show up in this list."
          emptyIcon={<WalletIcon />}
          pageSize={8}
        />
      </Card>

      <Card title="Fee defaulters">
        <DataTable
          columns={defaulterColumns}
          rows={defaulters}
          loading={feesQuery.loading}
          searchKeys={["studentName", "block", "room"]}
          searchPlaceholder="Search defaulters…"
          emptyTitle="No outstanding dues"
          emptyDescription="Students with a pending balance will show up here."
          emptyIcon={<AlertIcon />}
          pageSize={8}
        />
      </Card>
    </div>
  );
}

