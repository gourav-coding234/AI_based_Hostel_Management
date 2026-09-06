import { useState } from "react";
import { Card, Button, Field, inputCls, ProgressBar, Pill } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { BuildingIcon, PlusIcon } from "../../../components/dashboard/admin/icons";
import { useCollection } from "../../../hooks/useCollection";
import { addDocument } from "../../../firebase/firestore";

const emptyDraft = { name: "", type: "Boys", warden: "", totalRooms: "", totalBeds: "" };

export default function Blocks() {
  const blocksQuery = useCollection("blocks", { orderByField: "name", orderByDirection: "asc" });
  const blocks = blocksQuery.data;
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  async function addBlock(e) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.totalRooms || !draft.totalBeds) return;
    setSaving(true);
    try {
      await addDocument("blocks", {
        name: draft.name,
        type: draft.type,
        warden: draft.warden || "Unassigned",
        totalRooms: Number(draft.totalRooms),
        totalBeds: Number(draft.totalBeds),
        occupiedBeds: 0,
      });
      setDraft(emptyDraft);
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add block:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
              <BuildingIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Blocks & rooms</p>
              <p className="text-sm text-slate-500">Structural setup — add new hostel blocks and see capacity per block.</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <PlusIcon /> Add block
            </Button>
          )}
        </div>
      </Card>

      {showForm && (
        <Card title="Add a new block">
          <form onSubmit={addBlock} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Block name">
              <input className={inputCls} placeholder="E.g. D Wing" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </Field>
            <Field label="Type">
              <select className={inputCls} value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}>
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
              </select>
            </Field>
            <Field label="Assigned warden (optional)">
              <input className={inputCls} placeholder="Warden name" value={draft.warden} onChange={(e) => setDraft((d) => ({ ...d, warden: e.target.value }))} />
            </Field>
            <Field label="Total rooms">
              <input type="number" min="0" className={inputCls} value={draft.totalRooms} onChange={(e) => setDraft((d) => ({ ...d, totalRooms: e.target.value }))} />
            </Field>
            <Field label="Total beds">
              <input type="number" min="0" className={inputCls} value={draft.totalBeds} onChange={(e) => setDraft((d) => ({ ...d, totalBeds: e.target.value }))} />
            </Field>
            <div className="flex items-end gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save block"}</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setDraft(emptyDraft); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {blocksQuery.loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : blocksQuery.isEmpty ? (
        <EmptyState icon={<BuildingIcon />} title="No blocks added yet" description="Add your first hostel block above, or bulk-import them from Data Import." />
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((b) => {
          const pct = b.totalBeds ? Math.round((b.occupiedBeds / b.totalBeds) * 100) : 0;
          return (
            <Card key={b.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-base font-semibold text-ink">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.type} hostel · {b.totalRooms} rooms</p>
                </div>
                <Pill tone={pct > 95 ? "Urgent" : "General"}>{pct}% full</Pill>
              </div>
              <p className="mt-3 text-sm text-slate-600">Warden: <span className="font-medium text-ink">{b.warden}</span></p>
              <div className="mt-3">
                <ProgressBar value={b.occupiedBeds} max={b.totalBeds} tone={pct > 95 ? "rose" : "teal"} />
                <p className="mt-1.5 text-xs text-slate-400">{b.occupiedBeds}/{b.totalBeds} beds occupied</p>
              </div>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}
