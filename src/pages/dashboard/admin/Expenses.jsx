import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Button, Field, StatCard } from "../../../components/dashboard/student/ui";
import ConfirmDialog from "../../../components/dashboard/ConfirmDialog";
import DataTable from "../../../components/ui/DataTable";
import { WalletIcon, DownloadIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";
import { addDocument, deleteDocument, logAudit, updateDocument } from "../../../firebase/firestore";
import { downloadXlsxFile } from "../../../utils/xlsxExport";

const EMPTY = { category: "Maintenance", description: "", amount: "", date: new Date().toISOString().slice(0, 10), paymentMethod: "Cash" };
const EXPENSE_CATEGORIES = ["Maintenance", "Utilities", "Food and Mess", "Supplies", "Repairs", "Other"];

function inr(value) { return `INR ${(Number(value) || 0).toLocaleString("en-IN")}`; }

export default function Expenses() {
  const { profile, user } = useAuth();
  const { data, loading, error } = useCollections({ fees: { name: "fees" }, expenses: { name: "expenses", options: { orderByField: "date", orderByDirection: "desc" } } });
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const totalCollected = data.fees.reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0);
  const totalExpenses = data.expenses.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
  const balance = totalCollected - totalExpenses;

  const rows = useMemo(() => data.expenses.map((record) => ({ ...record, amount: Number(record.amount) || 0 })), [data.expenses]);

  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function saveExpense(event) {
    event.preventDefault();
    setFormMessage("");
    const amount = Number(form.amount);
    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0 || !form.date) {
      setFormMessage("Enter a description, a positive amount, and an expense date.");
      return;
    }
    setSaving(true);
    try {
      const payload = { category: form.category, description: form.description.trim(), amount, date: form.date, paymentMethod: form.paymentMethod };
      if (editingId) await updateDocument("expenses", editingId, payload);
      else await addDocument("expenses", payload, user?.uid);
      logAudit({ actor: profile?.name || user?.email || "Admin", action: editingId ? "Updated expense" : "Recorded expense", target: `${payload.category}: ${inr(amount)}` }).catch(() => {});
      setForm(EMPTY);
      setEditingId("");
      setFormMessage(editingId ? "Expense updated." : "Expense recorded.");
    } catch (err) {
      console.error("Failed to save expense:", err);
      setFormMessage("Couldn't save this expense. Please try again.");
    } finally { setSaving(false); }
  }

  function startEdit(record) {
    setEditingId(record.id);
    setForm({ category: record.category || "Other", description: record.description || "", amount: String(record.amount ?? ""), date: record.date || "", paymentMethod: record.paymentMethod || "Cash" });
    setFormMessage("");
  }

  async function removeExpense() {
    const expense = rows.find((record) => record.id === confirmId);
    if (!expense) return;
    setDeleting(true);
    try {
      await deleteDocument("expenses", confirmId);
      logAudit({ actor: profile?.name || user?.email || "Admin", action: "Deleted expense", target: `${expense.category}: ${inr(expense.amount)}` }).catch(() => {});
      setConfirmId("");
    } catch (err) {
      console.error("Failed to delete expense:", err);
      setFormMessage("Couldn't delete this expense. Please try again.");
      setConfirmId("");
    } finally { setDeleting(false); }
  }

  async function exportExpenses() {
    await downloadXlsxFile(rows, [
      { label: "Expense ID", value: (row) => row.id },
      { label: "Category", value: (row) => row.category },
      { label: "Description", value: (row) => row.description },
      { label: "Amount", value: (row) => row.amount },
      { label: "Expense Date", value: (row) => row.date },
      { label: "Payment Method", value: (row) => row.paymentMethod },
      { label: "Recorded By", value: (row) => row.createdByName || row.createdBy || "" },
    ], "hostel-expenses.xlsx", "Expenses");
  }

  const columns = [
    { key: "date", label: "Date", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount", sortable: true, render: (record) => <span className="font-semibold text-ink">{inr(record.amount)}</span> },
    { key: "paymentMethod", label: "Payment method" },
    { key: "action", label: "Actions", render: (record) => <div className="flex gap-2"><Button variant="outline" className="px-2.5 py-1 text-xs" onClick={() => startEdit(record)}>Edit</Button><Button variant="danger" className="px-2.5 py-1 text-xs" onClick={() => { setDeletePhrase(""); setConfirmId(record.id); }}>Delete</Button></div> },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<WalletIcon />} label="Recorded collections" value={loading ? "..." : inr(totalCollected)} sub="Fee payments currently recorded" tone="teal" />
        <StatCard icon={<WalletIcon />} label="Recorded expenses" value={loading ? "..." : inr(totalExpenses)} sub={`${rows.length} expense entries`} tone="amber" />
        <StatCard icon={<WalletIcon />} label="Calculated available balance" value={loading ? "..." : inr(balance)} sub="Recorded collections minus recorded expenses; not a live bank balance" tone={balance < 0 ? "rose" : "navy"} />
      </div>
      <Card title={editingId ? "Edit expense" : "Record an expense"} subtitle="Only administrators can access this ledger. The available balance is a calculation from recorded data, not a live bank balance.">
        <form onSubmit={saveExpense} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Category"><select className="input" name="category" value={form.category} onChange={updateField}>{EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field label="Description"><input className="input" name="description" value={form.description} onChange={updateField} required /></Field>
          <Field label="Amount"><input className="input" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateField} required /></Field>
          <Field label="Expense date"><input className="input" name="date" type="date" value={form.date} onChange={updateField} required /></Field>
          <Field label="Payment method"><select className="input" name="paymentMethod" value={form.paymentMethod} onChange={updateField}>{["Cash", "Bank transfer", "UPI", "Card", "Other"].map((method) => <option key={method}>{method}</option>)}</select></Field>
          <div className="flex items-end gap-2"><Button type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Record expense"}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(""); setForm(EMPTY); }}>Cancel</Button>}</div>
        </form>
        {formMessage && <p role="status" className="mt-3 text-sm text-slate-600">{formMessage}</p>}
      </Card>
      <Card title="Expense register" subtitle={`${rows.length} recorded expense${rows.length === 1 ? "" : "s"}`} action={<Button variant="outline" onClick={exportExpenses} disabled={rows.length === 0}><DownloadIcon /> Download Excel</Button>}>
        <DataTable columns={columns} rows={rows} loading={loading} error={error} searchKeys={["category", "description", "paymentMethod", "date"]} searchPlaceholder="Search expenses..." emptyTitle="No expenses recorded" emptyDescription="Add an expense above to begin tracking hostel spending." />
      </Card>
      {confirmId && <ConfirmDialog title="Delete this expense?" description="This removes the expense entry and recalculates the displayed balance. This action is recorded in the audit log." confirmLabel="Delete expense" confirmText="DELETE EXPENSE" confirmValue={deletePhrase} onConfirmValueChange={setDeletePhrase} busy={deleting} onConfirm={removeExpense} onCancel={() => { setDeletePhrase(""); setConfirmId(""); }} />}
    </div>
  );
}