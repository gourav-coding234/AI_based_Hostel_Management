import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import ConfirmDialog from "../../../components/dashboard/ConfirmDialog";
import { MegaphoneIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { addDocument, updateDocument, deleteDocument } from "../../../firebase/firestore";

const NOTICE_TARGETS = ["All Wings", "A Wing", "B Wing", "C Wing"];
const NOTICE_PRIORITIES = ["General", "Urgent", "Event"];

const emptyDraft = { title: "", body: "", target: NOTICE_TARGETS[0], priority: NOTICE_PRIORITIES[0] };

export default function WardenNotices() {
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
    setDraft({ title: n.title, body: n.body, target: n.target, priority: n.priority });
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
              <p className="font-display text-base font-semibold text-ink">Notice board</p>
              <p className="text-sm text-slate-500">Published notices appear on every student's dashboard.</p>
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
                placeholder="E.g. Hostel gates close at 9:30 PM sharp"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </Field>
            <Field label="Message">
              <textarea
                className={`${inputCls} min-h-[100px] resize-none`}
                placeholder="Full notice text shown to students"
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
          emptyDescription="Notices you publish will appear on every student's dashboard."
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
