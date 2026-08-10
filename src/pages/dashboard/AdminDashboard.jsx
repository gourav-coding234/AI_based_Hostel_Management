import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { createUserAccount, friendlyCreateAccountError } from "../../firebase/adminUsers";
import { getCollection } from "../../firebase/firestore";
import { parseUsersCsv, CSV_TEMPLATE } from "../../utils/csv";
import { ROLE_LIST } from "../../roles";

const icon = (d) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NAV_ITEMS = [
  { label: "Manage Users", to: "/dashboard/admin", end: true, icon: icon("M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 17c0-2.8 2.7-5 6-5s6 2.2 6 5") },
];

const EMPTY_FORM = { name: "", email: "", password: "", role: "Student", hostelResidence: "", linkedStudentId: "" };

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [csvText, setCsvText] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResults, setBulkResults] = useState(null); // { created: [], failed: [] }

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const list = await getCollection("users", { orderByField: "name", orderByDirection: "asc" });
      setUsers(list);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateSingle(e) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setCreating(true);
    try {
      await createUserAccount(form);
      setFormSuccess(`Account created for ${form.name} (${form.role}).`);
      setForm(EMPTY_FORM);
      loadUsers();
    } catch (err) {
      setFormError(friendlyCreateAccountError(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleBulkCreate(e) {
    e.preventDefault();
    setBulkResults(null);
    const { rows, errors: parseErrors } = parseUsersCsv(csvText);

    if (rows.length === 0) {
      setBulkResults({ created: [], failed: parseErrors.map((e) => ({ error: e })) });
      return;
    }

    setBulkRunning(true);
    const created = [];
    const failed = [...parseErrors.map((e) => ({ error: e }))];

    // Sequential on purpose — keeps the secondary auth instance from racing
    // itself and makes per-row error attribution straightforward.
    for (const row of rows) {
      try {
        const account = await createUserAccount(row);
        created.push(account);
      } catch (err) {
        failed.push({ email: row.email, error: friendlyCreateAccountError(err) });
      }
    }

    setBulkResults({ created, failed });
    setBulkRunning(false);
    loadUsers();
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-users-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <DashboardLayout title="Manage Users" navItems={NAV_ITEMS}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Single account creation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-base font-semibold text-ink">Add one account</h3>
          <p className="mt-1 text-sm text-slate-500">Creates a login and profile for a single user.</p>

          <form onSubmit={handleCreateSingle} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {ROLE_LIST.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <input
              type="text"
              required
              minLength={6}
              placeholder="Temporary password (min 6 characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Block / hostel (optional)"
                value={form.hostelResidence}
                onChange={(e) => setForm({ ...form, hostelResidence: e.target.value })}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              {form.role === "Parent" && (
                <input
                  type="text"
                  placeholder="Linked student ID"
                  value={form.linkedStudentId}
                  onChange={(e) => setForm({ ...form, linkedStudentId: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              )}
            </div>

            {formError && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{formError}</p>}
            {formSuccess && <p className="rounded-xl bg-teal-500/10 px-4 py-2.5 text-sm text-teal-700">{formSuccess}</p>}

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>

        {/* Bulk creation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-base font-semibold text-ink">Bulk add accounts</h3>
            <button type="button" onClick={downloadTemplate} className="text-xs font-semibold text-teal-700 hover:underline">
              Download CSV template
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Columns: <code className="text-xs">name, email, password, role, hostelResidence, linkedStudentId</code>
          </p>

          <form onSubmit={handleBulkCreate} className="mt-4 space-y-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-navy-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <textarea
              rows={6}
              placeholder="Or paste CSV rows here…"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />

            <button
              type="submit"
              disabled={bulkRunning || !csvText.trim()}
              className="w-full rounded-xl bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkRunning ? "Creating accounts…" : "Create accounts from CSV"}
            </button>
          </form>

          {bulkResults && (
            <div className="mt-4 space-y-2 text-sm">
              {bulkResults.created.length > 0 && (
                <p className="rounded-xl bg-teal-500/10 px-4 py-2.5 text-teal-700">
                  Created {bulkResults.created.length} account{bulkResults.created.length === 1 ? "" : "s"}.
                </p>
              )}
              {bulkResults.failed.length > 0 && (
                <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-rose-700">
                  <p className="font-medium">{bulkResults.failed.length} failed:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {bulkResults.failed.map((f, i) => (
                      <li key={i}>{f.email ? `${f.email} — ${f.error}` : f.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Existing users */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink">All accounts</h3>
          <span className="text-xs text-slate-400">{users.length} total</span>
        </div>

        {loadingUsers ? (
          <p className="mt-4 text-sm text-slate-400">Loading…</p>
        ) : users.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No accounts yet. Create the first one above.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Role</th>
                  <th className="pb-2 font-medium">Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 pr-4 font-medium text-ink">{u.name || "—"}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{u.email}</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500">{u.hostelResidence || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
