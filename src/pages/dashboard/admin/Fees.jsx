import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, ProgressBar, StatCard, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import DataTable from "../../../components/ui/DataTable";
import { WalletIcon, AlertIcon, CheckIcon, CalendarClockIcon, DownloadIcon } from "../../../components/dashboard/admin/icons";
import { useCollection } from "../../../hooks/useCollection";
import { addDocument, updateDocument, logAudit } from "../../../firebase/firestore";
import { downloadTextFile } from "../../../utils/csv";
import { computeFeeStatus } from "../../../utils/fees";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

const statusFilters = ["All Statuses", "Pending", "Partial", "Paid", "Overdue"];

function toCsv(headers, rows) {
  const lines = [headers.map((h) => h.label).join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(h.value(row) ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

export default function Fees() {
  const { profile, user } = useAuth();
  const feesQuery = useCollection("fees");
  const studentsQuery = useCollection("students");
  const students = studentsQuery.data;

  // Recalculate status (and the remaining balance) from total/paid/dueDate
  // on every render, rather than trusting whatever was last written to the
  // record — a due date can pass without anyone touching the record.
  const fees = useMemo(
    () =>
      feesQuery.data.map((f) => ({
        ...f,
        status: computeFeeStatus(f),
        remaining: Math.max((Number(f.total) || 0) - (Number(f.paid) || 0), 0),
      })),
    [feesQuery.data]
  );

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ studentId: "", total: "", dueDate: "" });
  const [createError, setCreateError] = useState("");
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [recordingId, setRecordingId] = useState("");
  const [blockFilter, setBlockFilter] = useState("All Blocks");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const blockFilters = useMemo(() => {
    const set = new Set(fees.map((f) => f.block).filter(Boolean));
    return ["All Blocks", ...Array.from(set)];
  }, [fees]);

  const totalDue = fees.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const totalCollected = fees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const totalOutstanding = Math.max(totalDue - totalCollected, 0);
  const collectionPct = totalDue ? Math.round((totalCollected / totalDue) * 100) : 0;

  const paidCount = fees.filter((f) => f.status === "Paid").length;
  const partialCount = fees.filter((f) => f.status === "Partial").length;
  const pendingCount = fees.filter((f) => f.status === "Pending").length;
  const overdueCount = fees.filter((f) => f.status === "Overdue").length;

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

  // A defaulter is anyone with an outstanding balance — cleared fees never
  // show up here, whatever their status.
  const defaulters = useMemo(
    () => fees.filter((f) => f.remaining > 0).sort((a, b) => b.remaining - a.remaining),
    [fees]
  );

  const filtered = useMemo(() => {
    return fees.filter((f) => {
      const blockOk = blockFilter === "All Blocks" || f.block === blockFilter;
      const statusOk = statusFilter === "All Statuses" || f.status === statusFilter;
      return blockOk && statusOk;
    });
  }, [fees, blockFilter, statusFilter]);

  const feeCsvHeaders = [
    { label: "Student", value: (f) => f.studentName },
    { label: "Block", value: (f) => f.block },
    { label: "Room", value: (f) => f.room },
    { label: "Total", value: (f) => f.total },
    { label: "Paid", value: (f) => f.paid },
    { label: "Pending/Outstanding", value: (f) => f.remaining },
    { label: "Due Date", value: (f) => f.dueDate },
    { label: "Status", value: (f) => f.status },
  ];

  function downloadFees() {
    downloadTextFile(toCsv(feeCsvHeaders, filtered), "fee-records.csv");
  }

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
    { key: "remaining", label: "Amount due", sortable: true, render: (d) => <span className="font-semibold text-rose-600">{inr(d.remaining)}</span> },
    { key: "dueDate", label: "Due date", sortable: true, render: (d) => d.dueDate || "—" },
    { key: "status", label: "Status", render: (d) => <Pill tone={d.status}>{d.status}</Pill> },
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
    { key: "remaining", label: "Remaining", sortable: true, render: (d) => inr(d.remaining) },
    { key: "dueDate", label: "Due date", sortable: true, render: (d) => d.dueDate || "—" },
    { key: "status", label: "Status", render: (d) => <Pill tone={d.status}>{d.status}</Pill> },
    {
      key: "action",
      label: "Record payment",
      render: (d) => {
        if (d.remaining <= 0) return <span className="text-xs text-slate-300">Fully paid</span>;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              min="0"
              max={d.remaining}
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
        status: computeFeeStatus({ total, paid: 0, dueDate: createForm.dueDate }),
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
    if (!amount || amount <= 0 || amount > record.remaining) return;
    setRecordingId(record.id);
    try {
      const newPaid = (Number(record.paid) || 0) + amount;
      await updateDocument("fees", record.id, {
        paid: newPaid,
        status: computeFeeStatus({ total: record.total, paid: newPaid, dueDate: record.dueDate }),
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<WalletIcon />} label="Total fee amount" value={totalDue ? inr(totalDue) : "—"} sub={`Across ${fees.length} record${fees.length === 1 ? "" : "s"}`} tone="navy" />
        <StatCard icon={<WalletIcon />} label="Total collected" value={totalDue ? inr(totalCollected) : "—"} sub={totalDue ? `${collectionPct}% of total due` : "No fee records yet"} tone="amber" />
        <StatCard icon={<AlertIcon />} label="Total outstanding" value={totalDue ? inr(totalOutstanding) : "—"} sub="Pending + partial + overdue" tone="rose" />
        <StatCard icon={<WalletIcon />} label="Collection rate" value={totalDue ? `${collectionPct}%` : "—"} sub="Institute-wide" tone="teal" />
        <StatCard icon={<CheckIcon />} label="Fully cleared" value={paidCount} sub="Students paid in full" tone="teal" />
        <StatCard icon={<WalletIcon />} label="Partial payments" value={partialCount} sub="Some amount still owed" tone="amber" />
        <StatCard icon={<CalendarClockIcon />} label="Pending" value={pendingCount} sub="Not yet due, nothing paid" tone="navy" />
        <StatCard icon={<AlertIcon />} label="Overdue" value={overdueCount} sub="Past due date, balance owed" tone="rose" />
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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select className={`${inputCls} sm:w-48`} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
              {blockFilters.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button variant="outline" onClick={downloadFees} disabled={filtered.length === 0}>
            <DownloadIcon /> Download CSV
          </Button>
        </div>

        <DataTable
          columns={allRecordsColumns}
          rows={filtered}
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
