import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import ConfirmDialog from "../../../components/dashboard/ConfirmDialog";
import { MegaphoneIcon } from "../../../components/dashboard/admin/icons";
import { useCollection } from "../../../hooks/useCollection";
import { addDocument, updateDocument, deleteDocument } from "../../../firebase/firestore";

const NOTICE_TARGETS = ["All Hostels", "A Wing", "B Wing", "C Wing"];
const NOTICE_PRIORITIES = ["General", "Urgent", "Event"];

const emptyDraft = {
  title: "",
  body: "",
  target: NOTICE_TARGETS[0],
  priority: NOTICE_PRIORITIES[0],
  // Only notices explicitly marked public are readable without signing in
  // (see the `notices` rule in firestore.rules) and shown on the landing
  // page. Defaults to off so nothing is published externally by accident.
  isPublic: false,
};

export default function Notices() {
  const { user, profile } = useAuth();
  const noticesQuery = useCollection("notices", { orderByField: "date" });
  const notices = noticesQuery.data;
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function startCreate() {
    setEditingId("new");
    setDraft(emptyDraft);
  }

  function startEdit(n) {
    setEditingId(n.id);
    setDraft({
      title: n.title,
      body: n.body,
      target: n.target,
      priority: n.priority,
      isPublic: Boolean(n.isPublic),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function saveDraft(e) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) return;
    setSaving(true);
    try {
      if (editingId === "new") {
        await addDocument(
          "notices",
          { ...draft, date: new Date().toISOString().slice(0, 10), postedBy: profile?.name || user?.email },
          user?.uid
        );
        await addDocument("auditLogs", { actor: profile?.name || user?.email || "Admin", action: "Published notice", target: draft.title }).catch(() => {});
      } else {
        await updateDocument("notices", editingId, draft);
      }
      cancelEdit();
    } catch (err) {
      console.error("Failed to save notice:", err);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setDeleteBusy(true);
    try {
      await deleteDocument("notices", deletingId);
      if (editingId === deletingId) cancelEdit();
    } catch (err) {
      console.error("Failed to delete notice:", err);
    } finally {
      setDeleteBusy(false);
      setDeletingId(null);
    }
  }

  const isEditingForm = editingId !== null;
  const noticeBeingDeleted = notices.find((n) => n.id === deletingId);

  const columns = [
    {
      key: "title",
      label: "Notice",
      sortable: true,
      render: (n) => (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{n.title}</span>
            <Pill tone={n.priority}>{n.priority}</Pill>
          </div>
          <p className="text-xs text-slate-500">{n.body}</p>
        </>
      ),
    },
    { key: "target", label: "Target", sortable: true },
    {
      key: "isPublic",
      label: "Website",
      sortable: true,
      render: (n) =>
        n.isPublic ? (
          <span className="text-xs font-medium text-teal-600">Public</span>
        ) : (
          <span className="text-xs text-slate-400">Internal</span>
        ),
    },
    { key: "date", label: "Date", sortable: true },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <MegaphoneIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Institute-wide notices</p>
              <p className="text-sm text-slate-500">Broadcast to every block at once, or target a specific one.</p>
            </div>
          </div>
          {!isEditingForm && <Button onClick={startCreate}>New notice</Button>}
        </div>
      </Card>

      {isEditingForm && (
        <Card title={editingId === "new" ? "Publish a new notice" : "Edit notice"}>
          <form onSubmit={saveDraft} className="flex flex-col gap-4">
            <Field label="Title">
              <input
                className={inputCls}
                placeholder="E.g. Annual hostel inspection — 18 Aug"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </Field>
            <Field label="Message">
              <textarea
                className={`${inputCls} min-h-[100px] resize-none`}
                placeholder="Full notice text shown to students and wardens"
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Target">
                <select className={inputCls} value={draft.target} onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))}>
                  {NOTICE_TARGETS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select className={inputCls} value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}>
                  {NOTICE_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5">
              <input
                type="checkbox"
                checked={draft.isPublic}
                onChange={(e) => setDraft((d) => ({ ...d, isPublic: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-teal-600"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Show on the public website</span>
                <span className="block text-xs text-slate-500">
                  Also lists this notice on the landing-page notice board, visible to anyone without
                  signing in. Leave off for internal-only notices.
                </span>
              </span>
            </label>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : editingId === "new" ? "Publish notice" : "Save changes"}</Button>
              <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Published notices">
        <DataTable
          columns={columns}
          rows={notices}
          loading={noticesQuery.loading}
          searchKeys={["title", "target", "body"]}
          searchPlaceholder="Search notices…"
          emptyTitle="No notices published yet"
          emptyDescription="Notices you publish will appear here for students, parents and wardens."
          emptyIcon={<MegaphoneIcon />}
          pageSize={10}
          rowActions={(n) => [
            { label: "Edit", onClick: () => startEdit(n) },
            { label: "Delete", onClick: () => setDeletingId(n.id), danger: true },
          ]}
        />
      </Card>

      {deletingId && (
        <ConfirmDialog
          title="Delete this notice?"
          description={noticeBeingDeleted ? `"${noticeBeingDeleted.title}" will be removed for everyone immediately.` : undefined}
          confirmLabel="Delete"
          tone="danger"
          busy={deleteBusy}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
