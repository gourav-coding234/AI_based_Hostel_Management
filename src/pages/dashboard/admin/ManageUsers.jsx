import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { createUserAccount, friendlyCreateAccountError } from "../../../firebase/adminUsers";
import { getCollection, deleteUserProfile, updateDocument, logAudit } from "../../../firebase/firestore";
import { parseUsersCsv, CSV_TEMPLATE, downloadTextFile } from "../../../utils/csv";
import { ROLE_LIST } from "../../../roles";
import { Card, Button, Field, inputCls, Pill, EmptyState } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { DownloadIcon, SearchIcon, TrashIcon, UsersIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
}

const EMPTY_FORM = { name: "", email: "", password: "", role: "Student", hostelResidence: "", linkedStudentId: "" };

const roleAccent = {
  Admin: "bg-navy-950/5 text-navy-900",
  Warden: "bg-teal-500/10 text-teal-700",
  Student: "bg-amber-400/15 text-amber-700",
  Parent: "bg-slate-100 text-slate-600",
  Security: "bg-rose-500/10 text-rose-600",
};

function initials(name, email) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function ManageUsers() {
  const { profile, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [csvText, setCsvText] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResults, setBulkResults] = useState(null); // { created: [], failed: [] }

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Blocks & students only — the "users" collection is already loaded above
  // via loadUsers(), so warden rows are derived from that same list instead
  // of opening a second listener on the same data.
  const { data: refData } = useCollections({
    blocks: { name: "blocks" },
    students: { name: "students" },
  });
  const blocks = refData.blocks;
  const [reassignError, setReassignError] = useState("");

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
      logAudit({
        actor: profile?.name || currentUser?.email || "Admin",
        action: "Created account",
        target: `${form.name} (${form.role})`,
      }).catch(() => {});
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
    if (created.length > 0) {
      logAudit({
        actor: profile?.name || currentUser?.email || "Admin",
        action: "Bulk-created accounts",
        target: `${created.length} account${created.length === 1 ? "" : "s"} via CSV`,
      }).catch(() => {});
    }
  }

  function downloadTemplate() {
    downloadTextFile(CSV_TEMPLATE, "bulk-users-template.csv");
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function handleDelete(uid) {
    setDeleteError("");
    setDeletingId(uid);
    const target = users.find((u) => u.id === uid);
    try {
      await deleteUserProfile(uid);
      setUsers((list) => list.filter((u) => u.id !== uid));
      logAudit({
        actor: profile?.name || currentUser?.email || "Admin",
        action: "Removed account",
        target: target ? `${target.name} (${target.role})` : uid,
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to remove account:", err);
      setDeleteError("Couldn't remove this account. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const roleOk = roleFilter === "All" || u.role === roleFilter;
      const searchOk =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.hostelResidence?.toLowerCase().includes(q);
      return roleOk && searchOk;
    });
  }, [users, search, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  // Real, existing Student accounts only — this is what backs the "Linked
  // student" dropdown, so a Parent account can never point at an ID that
  // doesn't correspond to an actual student.
  const studentUsers = useMemo(() => users.filter((u) => u.role === "Student"), [users]);

  // Warden management — the same "users" list, just the Warden rows,
  // enriched with block assignment + workload for reassignment.
  const wardens = useMemo(() => users.filter((u) => u.role === "Warden"), [users]);
  const blockOptions = useMemo(() => ["Unassigned", ...blocks.map((b) => b.name)], [blocks]);

  const studentCountByBlock = useMemo(() => {
    const counts = {};
    refData.students.forEach((s) => {
      const key = s.hostelResidence || s.block;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [refData.students]);

  async function reassignWarden(id, block) {
    setReassignError("");
    const warden = users.find((u) => u.id === id);
    const previousBlockName = warden?.block;
    try {
      await updateDocument("users", id, { block });
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, block } : u)));

      // The block documents' own `warden` field (a plain string shown on
      // the Blocks page and Admin Overview's "Blocks at a glance" card) is
      // a separate field from this warden's `users/{id}.block` — without
      // syncing it here, those pages would keep showing the old warden's
      // name after a reassignment. Clear it off the block being left (but
      // only if this warden was actually the one recorded there) and set
      // it on the block being taken on.
      const wardenName = warden?.name?.trim() || warden?.email || "Unassigned";
      const previousBlockDoc =
        previousBlockName && previousBlockName !== "Unassigned"
          ? blocks.find((b) => b.name === previousBlockName)
          : null;
      const nextBlockDoc = block && block !== "Unassigned" ? blocks.find((b) => b.name === block) : null;

      if (previousBlockDoc && previousBlockDoc.id !== nextBlockDoc?.id && previousBlockDoc.warden === wardenName) {
        await updateDocument("blocks", previousBlockDoc.id, { warden: "Unassigned" });
      }
      if (nextBlockDoc) {
        await updateDocument("blocks", nextBlockDoc.id, { warden: wardenName });
      }
    } catch (err) {
      console.error("Failed to reassign warden:", err);
      setReassignError("Couldn't reassign this warden. Please try again.");
    }
  }

  const wardenColumns = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "email",
      label: "Contact",
      render: (w) => (
        <>
          <p>{w.email}</p>
          <p className="text-xs text-slate-400">{w.phone || "—"}</p>
        </>
      ),
    },
    {
      key: "block",
      label: "Assigned block",
      render: (w) => (
        <select
          value={w.block || "Unassigned"}
          onChange={(e) => reassignWarden(w.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
        >
          {blockOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      ),
    },
    { key: "students", label: "Student workload", render: (w) => studentCountByBlock[w.block] || 0 },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (w) => {
        const joined = tsToDate(w.createdAt);
        return joined ? joined.toLocaleDateString("en-IN") : "—";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (w) => <Pill tone={w.status === "Inactive" ? "Pending" : "Approved"}>{w.status || "Active"}</Pill>,
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
              <UsersIcon />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold">Manage users &amp; wardens</h2>
              <p className="mt-0.5 text-sm text-slate-300">
                {users.length} account{users.length === 1 ? "" : "s"} across {Object.keys(roleCounts).length || 0} role{Object.keys(roleCounts).length === 1 ? "" : "s"} · {wardens.length} warden{wardens.length === 1 ? "" : "s"} assigned across {blocks.length} block{blocks.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLE_LIST.map((r) => (
              <span key={r} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                {r} <span className="text-teal-300">{roleCounts[r] || 0}</span>
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Single account creation */}
        <Card title="Add one account">
          <p className="-mt-2 mb-2 text-sm text-slate-500">Creates a login and profile for a single user.</p>

          <form onSubmit={handleCreateSingle} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Role">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputCls}
                >
                  {ROLE_LIST.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Email">
              <input
                type="email"
                required
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Temporary password">
              <input
                type="text"
                required
                minLength={6}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputCls}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Block / hostel (optional)">
                <input
                  type="text"
                  placeholder="E.g. B Wing"
                  value={form.hostelResidence}
                  onChange={(e) => setForm({ ...form, hostelResidence: e.target.value })}
                  className={inputCls}
                />
              </Field>
              {form.role === "Parent" && (
                <Field label="Linked student">
                  <select
                    value={form.linkedStudentId}
                    onChange={(e) => setForm({ ...form, linkedStudentId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select a student…</option>
                    {studentUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.email} {s.hostelResidence ? `— ${s.hostelResidence}` : ""}
                      </option>
                    ))}
                  </select>
                  {studentUsers.length === 0 && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      No student accounts yet — create the student's account first, then this parent.
                    </p>
                  )}
                </Field>
              )}
            </div>

            {formError && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{formError}</p>}
            {formSuccess && <p className="rounded-xl bg-teal-500/10 px-4 py-2.5 text-sm text-teal-700">{formSuccess}</p>}

            <Button type="submit" disabled={creating} className="w-full">
              {creating ? "Creating…" : "Create account"}
            </Button>
          </form>
        </Card>

        {/* Bulk creation */}
        <Card
          title="Bulk add accounts"
          action={
            <button type="button" onClick={downloadTemplate} className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline">
              <DownloadIcon /> CSV template
            </button>
          }
        >
          <p className="-mt-2 mb-2 text-sm text-slate-500">
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
              className={`${inputCls} font-mono text-xs`}
            />

            <Button type="submit" disabled={bulkRunning || !csvText.trim()} className="w-full">
              {bulkRunning ? "Creating accounts…" : "Create accounts from CSV"}
            </Button>
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
        </Card>
      </div>

      {/* Existing users */}
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">All users</h3>
            <p className="text-xs text-slate-400">{filteredUsers.length} of {users.length} shown</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search name, email, block…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} w-full py-2 pl-9 sm:w-56`}
              />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`${inputCls} py-2 sm:w-36`}>
              <option value="All">All roles</option>
              {ROLE_LIST.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {deleteError && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{deleteError}</p>}

        {loadingUsers ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon />}
            title="No accounts yet"
            description="Create the first one using the form above."
          />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<SearchIcon />}
            title="No matches"
            description="Try a different search term or role filter."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const isConfirming = confirmDeleteId === u.id;
              const isDeleting = deletingId === u.id;
              return (
                <li key={u.id} className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${roleAccent[u.role] ?? "bg-slate-100 text-slate-500"}`}>
                      {initials(u.name, u.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{u.name || "—"}</p>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Pill tone="General">{u.role}</Pill>
                    <span className="hidden text-xs text-slate-400 sm:inline">{u.hostelResidence || "—"}</span>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">Remove account?</span>
                        <Button
                          variant="danger"
                          className="px-3 py-1.5 text-xs"
                          disabled={isDeleting}
                          onClick={() => handleDelete(u.id)}
                        >
                          {isDeleting ? "Removing…" : "Confirm"}
                        </Button>
                        <Button
                          variant="outline"
                          className="px-3 py-1.5 text-xs"
                          disabled={isDeleting}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => setConfirmDeleteId(u.id)}
                      >
                        <TrashIcon /> Remove
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Warden management — same underlying accounts, filtered to Warden
          role, with block reassignment and workload for oversight. */}
      <Card title="Warden management" subtitle="Assign wardens to blocks and see their current workload.">
        {reassignError && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{reassignError}</p>}
        <DataTable
          columns={wardenColumns}
          rows={wardens}
          loading={loadingUsers}
          searchKeys={["name", "email", "block"]}
          searchPlaceholder="Search wardens…"
          emptyTitle="No wardens added yet"
          emptyDescription="Create a Warden account above to see it here."
          emptyIcon={<UsersIcon />}
          pageSize={12}
        />
      </Card>

      <Card title="Block coverage">
        {blocks.length === 0 ? (
          <EmptyState title="No blocks yet" description="Add blocks on the Blocks page or via Data Import." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {blocks.map((b) => (
              <div key={b.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-ink">{b.name}</p>
                <p className="text-xs text-slate-400">{b.type} hostel</p>
                <p className="mt-3 text-sm text-slate-600">Warden: <span className="font-medium text-ink">{b.warden || "Unassigned"}</span></p>
                <p className="text-xs text-slate-400">{b.occupiedBeds || 0}/{b.totalBeds || 0} beds occupied</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
