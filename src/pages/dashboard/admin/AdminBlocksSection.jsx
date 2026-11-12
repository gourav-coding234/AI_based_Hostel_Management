import { useMemo, useState } from "react";
import { Card, Button, Field, inputCls, ProgressBar, Pill } from "../../../components/dashboard/student/ui";
import ConfirmDialog from "../../../components/dashboard/ConfirmDialog";
import { useCollection } from "../../../hooks/useCollection";
import { addDocument, deleteDocument, updateDocument } from "../../../firebase/firestore";

const EMPTY = { name: "", type: "Boys", warden: "", totalRooms: "", totalBeds: "" };
const normalized = (name) => String(name || "").trim().toLocaleLowerCase();

export default function AdminBlocksSection() {
  const { data: blocks, loading, error } = useCollection("blocks", { orderByField: "name", orderByDirection: "asc" });
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState("");
  const [confirmBlock, setConfirmBlock] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const totals = useMemo(() => blocks.reduce((sum, block) => ({
    rooms: sum.rooms + Number(block.totalRooms || 0),
    beds: sum.beds + Number(block.totalBeds || 0),
    occupied: sum.occupied + Number(block.occupiedBeds || 0),
  }), { rooms: 0, beds: 0, occupied: 0 }), [blocks]);

  function beginEdit(block) {
    setEditingId(block.id);
    setDraft({ name: block.name || "", type: block.type || "Boys", warden: block.warden || "", totalRooms: String(block.totalRooms ?? ""), totalBeds: String(block.totalBeds ?? "") });
    setFormError("");
    setMessage("");
  }

  async function save(event) {
    event.preventDefault();
    setFormError("");
    setMessage("");
    const name = draft.name.trim();
    if (!name || !Number.isFinite(Number(draft.totalBeds)) || Number(draft.totalBeds) < 0 || (draft.totalRooms !== "" && (!Number.isFinite(Number(draft.totalRooms)) || Number(draft.totalRooms) < 0))) {
      setFormError("Enter a block name and valid non-negative room and bed totals.");
      return;
    }
    if (blocks.some((block) => normalized(block.name) === normalized(name) && block.id !== editingId)) {
      setFormError("A block with this name already exists. Block names must be unique.");
      return;
    }
    const data = {
      name,
      type: draft.type === "Girls" ? "Girls" : "Boys",
      warden: draft.warden.trim() || "Unassigned",
      totalRooms: Number(draft.totalRooms || 0),
      totalBeds: Number(draft.totalBeds),
      ...(editingId ? {} : { occupiedBeds: 0 }),
    };
    setBusy(true);
    try {
      if (editingId) await updateDocument("blocks", editingId, data);
      else await addDocument("blocks", data);
      setMessage(editingId ? "Block updated." : "Block added.");
      setDraft(EMPTY);
      setEditingId("");
    } catch (cause) {
      console.error("Could not save hostel block:", cause);
      setFormError(cause?.code === "permission-denied" ? "Firebase denied this change. Check the Admin blocks rules." : "Could not save this block. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function removeBlock() {
    if (!confirmBlock) return;
    setBusy(true);
    setFormError("");
    try {
      await deleteDocument("blocks", confirmBlock.id);
      setMessage(`${confirmBlock.name} deleted.`);
      if (editingId === confirmBlock.id) { setEditingId(""); setDraft(EMPTY); }
    } catch (cause) {
      console.error("Could not delete hostel block:", cause);
      setFormError(cause?.code === "permission-denied" ? "Firebase denied this change. Check the Admin blocks rules." : "Could not delete this block. Please try again.");
    } finally {
      setBusy(false);
      setConfirmBlock(null);
    }
  }

  return (
    <Card title="Hostel blocks" subtitle="Add and manage hostel wings and their capacity. Existing block data stays available to the other dashboards.">
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{blocks.length} blocks</div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{totals.rooms} rooms · {totals.beds} total beds</div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{totals.occupied} occupied · {Math.max(0, totals.beds - totals.occupied)} available</div>
      </div>

      <form onSubmit={save} className="mb-6 grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Block name"><input className={inputCls} value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} placeholder="e.g. East Wing" required /></Field>
        <Field label="Hostel type"><select className={inputCls} value={draft.type} onChange={(e) => setDraft((current) => ({ ...current, type: e.target.value }))}><option value="Boys">Boys</option><option value="Girls">Girls</option></select></Field>
        <Field label="Assigned warden"><input className={inputCls} value={draft.warden} onChange={(e) => setDraft((current) => ({ ...current, warden: e.target.value }))} placeholder="Optional" /></Field>
        <Field label="Total rooms"><input className={inputCls} type="number" min="0" value={draft.totalRooms} onChange={(e) => setDraft((current) => ({ ...current, totalRooms: e.target.value }))} /></Field>
        <Field label="Total beds"><input className={inputCls} type="number" min="0" value={draft.totalBeds} onChange={(e) => setDraft((current) => ({ ...current, totalBeds: e.target.value }))} required /></Field>
        <div className="flex items-end gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Add block"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(""); setDraft(EMPTY); }}>Cancel</Button>}</div>
        {formError && <p role="alert" className="text-sm text-rose-700 sm:col-span-2 lg:col-span-3">{formError}</p>}
        {message && <p role="status" className="text-sm text-teal-700 sm:col-span-2 lg:col-span-3">{message}</p>}
      </form>

      {error && <p role="alert" className="mb-3 text-sm text-rose-700">Could not load blocks: {error}</p>}
      {loading ? <p className="py-5 text-sm text-slate-500">Loading blocks…</p> : blocks.length === 0 ? <p className="py-5 text-sm text-slate-500">No hostel blocks yet. Add one above or import a blocks sheet below.</p> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {blocks.map((block) => {
            const totalBeds = Number(block.totalBeds || 0);
            const occupiedBeds = Number(block.occupiedBeds || 0);
            const percent = totalBeds ? Math.round(occupiedBeds / totalBeds * 100) : 0;
            return <div key={block.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-ink">{block.name}</p><p className="text-xs text-slate-500">{block.type || "Type not set"} hostel · {block.totalRooms || 0} rooms</p></div><Pill tone={percent > 95 ? "Urgent" : "General"}>{percent}% full</Pill></div>
              <p className="mt-3 text-sm text-slate-600">Warden: {block.warden || "Unassigned"}</p>
              <ProgressBar value={occupiedBeds} max={totalBeds} tone={percent > 95 ? "rose" : "teal"} />
              <p className="mt-1 text-xs text-slate-500">{occupiedBeds}/{totalBeds} beds occupied</p>
              <div className="mt-3 flex gap-2"><Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => beginEdit(block)}>Edit</Button><Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setConfirmBlock(block)}>Delete</Button></div>
            </div>;
          })}
        </div>
      )}
      {confirmBlock && <ConfirmDialog title={`Delete ${confirmBlock.name}?`} description="This permanently removes this block record. Room assignments that refer to it will remain in their student records." confirmLabel="Delete block" busy={busy} onConfirm={removeBlock} onCancel={() => setConfirmBlock(null)} />}
    </Card>
  );
}
