import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, ProgressBar, Field, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { WalletIcon, DownloadIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { getCollection, recordFeePayment, sendFeeReminder, logAudit } from "../../../firebase/firestore";
import { computeFeeStatus } from "../../../utils/fees";
import { toCsvText, downloadTextFile } from "../../../utils/csv";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

const filters = ["All", "Paid", "Partial", "Pending", "Overdue"];

export default function WardenFees() {
  const { user, profile, loading: authLoading } = useAuth();
  const myWing = profile?.block;
  const staffName = profile?.name || user?.email || "Warden";
  // A block-assigned warden only ever asks Firestore for their own block's
  // fee records (unrelated hostels' records are never loaded), and waits
  // for the profile so it never briefly fetches everything first.
  const feesQuery = useCollection("fees", {
    where: myWing ? [["block", "==", myWing]] : [],
    skip: authLoading,
  });

  // Second layer: same block scoping the Warden overview uses. Status is
  // always recomputed (never trusted from the stored field) and the
  // pending amount is always total - paid.
  const studentFees = useMemo(() => {
    const scoped = myWing ? feesQuery.data.filter((f) => f.block === myWing) : feesQuery.data;
    return scoped.map((f) => {
      const total = Math.max(Number(f.total) || 0, 0);
      const paid = Math.max(Number(f.paid) || 0, 0);
      return { ...f, total, paid, pending: Math.max(total - paid, 0), status: computeFeeStatus(f) };
    });
  }, [feesQuery.data, myWing]);

  const [filter, setFilter] = useState("All");

  const filtered = useMemo(
    () => (filter === "All" ? studentFees : studentFees.filter((s) => s.status === filter)),
    [studentFees, filter]
  );

  // --- Payment update -------------------------------------------------
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payError, setPayError] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const payingFee = studentFees.find((f) => f.id === payingId);

  function startPayment(f) {
    setPayingId(f.id);
    setPayAmount("");
    setPayError("");
  }

  function cancelPayment() {
    setPayingId(null);
    setPayAmount("");
    setPayError("");
  }

  async function savePayment(e) {
    e.preventDefault();
    if (paySaving || !payingFee) return;
    const amount = Number(payAmount);
    if (!(amount > 0) || amount > payingFee.pending) {
      setPayError(`Enter an amount between ₹1 and ${inr(payingFee.pending)}.`);
      return;
    }
    setPaySaving(true);
    setPayError("");
    try {
      // Updates the existing fees/{id} document in a transaction — paid,
      // status and updatedAt are recomputed from its current values;
      // no new fee record is ever created.
      await recordFeePayment(payingFee.id, amount, staffName);
      logAudit({
        actor: staffName,
        action: "Recorded fee payment",
        target: `${payingFee.studentName || "Student"} — ${inr(amount)}`,
      }).catch(() => {});
      cancelPayment();
    } catch (err) {
      console.error("Failed to record payment:", err);
      setPayError(
        err?.message === "INVALID_AMOUNT"
          ? "That amount is more than what's currently owed — the record may have just changed."
          : "Couldn't save this payment. Please try again."
      );
    } finally {
      setPaySaving(false);
    }
  }

  // --- Parent reminder ------------------------------------------------
  const [remindingIds, setRemindingIds] = useState(() => new Set());
  const [reminderNotes, setReminderNotes] = useState({});
  const today = new Date().toISOString().slice(0, 10);

  async function messageParent(f) {
    if (remindingIds.has(f.id) || f.status === "Paid") return;
    setRemindingIds((prev) => new Set(prev).add(f.id));
    setReminderNotes((n) => ({ ...n, [f.id]: "" }));
    try {
      // Parents are resolved through the existing link: a Parent account
      // is the users doc whose linkedStudentId is this student's id.
      const parents = await getCollection("users", {
        whereClauses: [["role", "==", "Parent"], ["linkedStudentId", "==", f.studentId]],
      });
      if (parents.length === 0) {
        setReminderNotes((n) => ({ ...n, [f.id]: "No parent account linked" }));
        return;
      }
      const result = await sendFeeReminder({
        feeId: f.id,
        parentIds: parents.map((p) => p.id),
        actor: { uid: user?.uid, name: staffName },
      });
      if (result.created > 0) {
        logAudit({
          actor: staffName,
          action: "Sent fee reminder to parent",
          target: `${f.studentName || "Student"} — ${inr(f.pending)}`,
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to message parent:", err);
      setReminderNotes((n) => ({
        ...n,
        [f.id]: err?.message === "NOTHING_DUE" ? "Nothing due" : "Couldn't send — try again",
      }));
    } finally {
      setRemindingIds((prev) => {
        const next = new Set(prev);
        next.delete(f.id);
        return next;
      });
    }
  }

  // --- CSV of the currently filtered list -----------------------------
  const csvColumns = [
    { label: "Student", value: (f) => f.studentName || "" },
    { label: "Student ID", value: (f) => f.studentId || "" },
    { label: "Block", value: (f) => f.block || "" },
    { label: "Room", value: (f) => f.room || "" },
    { label: "Semester", value: (f) => f.semester || "" },
    { label: "Total", value: (f) => f.total },
    { label: "Paid", value: (f) => f.paid },
    { label: "Pending", value: (f) => f.pending },
    { label: "Due Date", value: (f) => f.dueDate || "" },
    { label: "Status", value: (f) => f.status },
  ];

  function handleDownload() {
    if (filtered.length === 0) return;
    downloadTextFile(toCsvText(filtered, csvColumns), "fees.csv");
  }

  const totalDue = studentFees.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const totalCollected = studentFees.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const collectionPct = totalDue ? Math.round((totalCollected / totalDue) * 100) : 0;
  const overdueCount = studentFees.filter((s) => s.status === "Overdue").length;
  const partialCount = studentFees.filter((s) => s.status === "Partial").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
            <WalletIcon />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-slate-500">Fee collection{myWing ? ` in ${myWing}` : " across your wings"}</p>
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

      {payingFee && (
        <Card title={`Record payment — ${payingFee.studentName || "Student"}`}>
          <form onSubmit={savePayment} className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              {inr(payingFee.paid)} paid of {inr(payingFee.total)} · {inr(payingFee.pending)} pending
            </p>
            <Field label="Amount received (₹)">
              <input
                type="number"
                min="1"
                max={payingFee.pending}
                className={`${inputCls} sm:w-56`}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </Field>
            {payError && <p className="text-sm text-rose-600">{payError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={paySaving}>{paySaving ? "Saving…" : "Save payment"}</Button>
              <Button type="button" variant="outline" onClick={cancelPayment}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card
        title="Student fee status"
        action={
          <div className="flex flex-wrap items-center gap-1.5">
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
            <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={handleDownload} disabled={filtered.length === 0}>
              <DownloadIcon /> Download CSV
            </Button>
          </div>
        }
      >
        <DataTable
          columns={[
            { key: "studentName", label: "Student", sortable: true },
            { key: "block", label: "Wing/Block", sortable: true, render: (s) => s.block || "—" },
            { key: "room", label: "Room", render: (s) => s.room || "—" },
            { key: "semester", label: "Semester", render: (s) => s.semester || "—" },
            { key: "total", label: "Total", sortable: true, render: (s) => inr(s.total) },
            { key: "paid", label: "Paid", sortable: true, render: (s) => inr(s.paid) },
            { key: "pending", label: "Pending", sortable: true, render: (s) => inr(s.pending) },
            { key: "dueDate", label: "Due date", sortable: true, render: (s) => s.dueDate || "—" },
            { key: "status", label: "Status", render: (s) => <Pill tone={s.status}>{s.status}</Pill> },
            {
              key: "action",
              label: "Action",
              render: (s) => {
                if (s.status === "Paid") return <span className="text-xs text-slate-300">—</span>;
                const busy = remindingIds.has(s.id);
                const sentToday = s.reminderSent && (s.reminderSentAt || "").slice(0, 10) === today;
                if (sentToday) return <span className="text-xs font-medium text-teal-600">Reminder sent</span>;
                return (
                  <div className="flex flex-col items-start gap-1">
                    <Button variant="outline" className="px-3 py-1 text-xs" onClick={() => messageParent(s)} disabled={busy}>
                      {busy ? "Sending…" : "Message Parent"}
                    </Button>
                    {reminderNotes[s.id] && <span className="text-xs text-amber-600">{reminderNotes[s.id]}</span>}
                  </div>
                );
              },
            },
          ]}
          rows={filtered}
          loading={feesQuery.loading}
          searchKeys={["studentName", "studentId", "room", "block"]}
          searchPlaceholder="Search students…"
          emptyTitle="No fee records yet"
          emptyDescription="Fee records imported by the admin office will show up here."
          emptyIcon={<WalletIcon />}
          pageSize={10}
          rowActions={(f) => (f.status === "Paid" ? [] : [{ label: "Record payment", onClick: () => startPayment(f) }])}
        />
      </Card>
    </div>
  );
}
