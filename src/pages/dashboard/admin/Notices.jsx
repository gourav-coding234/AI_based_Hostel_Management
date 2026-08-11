import { useState } from "react";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { MegaphoneIcon, EditIcon, TrashIcon } from "../../../components/dashboard/admin/icons";
import { instituteNotices, instituteNoticeTargets, instituteNoticePriorities } from "../../../data/adminMock";

let nextId = 15;

const emptyDraft = { title: "", body: "", target: instituteNoticeTargets[0], priority: instituteNoticePriorities[0] };

export default function Notices() {
  const [notices, setNotices] = useState(instituteNotices);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);

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

  function saveDraft(e) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) return;

    if (editingId === "new") {
      setNotices((list) => [
        { id: `INTC-${nextId++}`, date: "Today", ...draft },
        ...list,
      ]);
    } else {
      setNotices((list) => list.map((n) => (n.id === editingId ? { ...n, ...draft } : n)));
    }
    cancelEdit();
  }

  function deleteNotice(id) {
    setNotices((list) => list.filter((n) => n.id !== id));
    if (editingId === id) cancelEdit();
  }

  const isEditingForm = editingId !== null;

  return (
    <div className="flex flex-col gap-6">
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
                  {instituteNoticeTargets.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select className={inputCls} value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}>
                  {instituteNoticePriorities.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingId === "new" ? "Publish notice" : "Save changes"}</Button>
              <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Published notices">
        <ul className="flex flex-col divide-y divide-slate-100">
          {notices.map((n) => (
            <li key={n.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <Pill tone={n.priority}>{n.priority}</Pill>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
                <p className="mt-1 text-xs text-slate-300">{n.target} · {n.date}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => startEdit(n)}>
                  <EditIcon /> Edit
                </Button>
                <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => deleteNotice(n.id)}>
                  <TrashIcon /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
