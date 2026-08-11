import { useState } from "react";
import { Card, Button, Field, inputCls, ProgressBar, Pill } from "../../../components/dashboard/student/ui";
import { BuildingIcon, PlusIcon, EditIcon } from "../../../components/dashboard/admin/icons";
import { blocks as blocksSeed } from "../../../data/adminMock";

const emptyDraft = { name: "", type: "Boys", warden: "", totalRooms: "", totalBeds: "" };

export default function Blocks() {
  const [blocks, setBlocks] = useState(blocksSeed);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  function addBlock(e) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.totalRooms || !draft.totalBeds) return;
    setBlocks((list) => [
      ...list,
      {
        id: `BLK-${list.length + 1}`,
        name: draft.name,
        type: draft.type,
        warden: draft.warden || "Unassigned",
        totalRooms: Number(draft.totalRooms),
        totalBeds: Number(draft.totalBeds),
        occupiedBeds: 0,
      },
    ]);
    setDraft(emptyDraft);
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-6">
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
              <Button type="submit">Save block</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setDraft(emptyDraft); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

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
              <button type="button" className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline">
                <EditIcon /> Edit details
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
