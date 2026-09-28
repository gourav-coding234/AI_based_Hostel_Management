import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/DataState";
import { PackageIcon } from "../../../components/dashboard/warden/icons";
import { useCollections } from "../../../hooks/useCollection";
import {
  addInventoryItem,
  updateInventoryItem,
  decideInventoryRequest,
  fulfillInventoryRequest,
  normalizeInventory,
  logAudit,
} from "../../../firebase/firestore";

const CATEGORIES = ["Furniture", "Electrical", "Bedding", "Kitchen", "Plumbing", "Other"];
const STATUSES = ["In Stock", "Low Stock", "Out of Stock", "Under Repair"];
const emptyForm = { item: "", category: "", quantity: "", damaged: "0", location: "", roomBlock: "", status: "", amount: "" };

const ERROR_TEXT = {
  DUPLICATE_ITEM: "This item already exists for that location/room — update the existing record instead.",
  INVALID_QUANTITY: "Enter a valid whole number (damaged can't exceed what's available).",
  NEGATIVE_STOCK: "That would make available stock negative.",
  ITEM_REQUIRED: "Item name is required.",
  ITEM_NOT_FOUND: "That inventory record no longer exists.",
  INSUFFICIENT_STOCK: "Not enough available stock to fulfil this request.",
  ALREADY_DECIDED: "This request was already decided.",
  NOT_APPROVED: "Only approved requests can be fulfilled.",
};

function fmtTs(ts) {
  if (!ts) return "—";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const sameKey = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

export default function WardenInventory() {
  const { user, profile } = useAuth();
  const actor = { uid: user?.uid || "", name: profile?.name || user?.email || "Warden" };

  const { data, loading } = useCollections({
    inventory: { name: "inventory" },
    requests: { name: "inventoryRequests", options: { orderByField: "date" } },
  });
  const { requests } = data;

  // Every record with its normalized quantity/available/damaged, so legacy
  // imported rows (item/location/quantity only) display and update cleanly.
  const inventory = useMemo(() => data.inventory.map((it) => ({ ...it, ...normalizeInventory(it) })), [data.inventory]);

  const grouped = useMemo(() => {
    const map = new Map();
    inventory.forEach((it) => {
      if (!map.has(it.item)) map.set(it.item, { item: it.item, quantity: 0, available: 0, damaged: 0, locations: 0 });
      const entry = map.get(it.item);
      entry.quantity += it.quantity;
      entry.available += it.available;
      entry.damaged += it.damaged;
      entry.locations += 1;
    });
    return Array.from(map.values());
  }, [inventory]);

  // --- Stock management panel (add / update quantity / mark damaged / edit details)
  const [panel, setPanel] = useState(null); // { mode, id? }
  const [form, setForm] = useState(emptyForm);
  const [panelError, setPanelError] = useState("");
  const [panelSaving, setPanelSaving] = useState(false);
  const panelItem = panel?.id ? inventory.find((i) => i.id === panel.id) : null;

  function openPanel(mode, it) {
    setPanel({ mode, id: it?.id });
    setPanelError("");
    setForm(
      it
        ? {
            ...emptyForm,
            item: it.item || "",
            category: it.category || "",
            quantity: String(it.quantity),
            location: it.location || "",
            roomBlock: it.roomBlock || "",
            status: it.status || "",
          }
        : emptyForm
    );
  }

  function closePanel() {
    setPanel(null);
    setPanelError("");
  }

  async function savePanel(e) {
    e.preventDefault();
    if (panelSaving || !panel) return;
    setPanelError("");
    setPanelSaving(true);
    try {
      if (panel.mode === "add") {
        // Same item + location + room/block is one record — refuse a second
        // (the deterministic doc id also blocks a race between two wardens).
        if (inventory.some((i) => sameKey(i.item, form.item) && sameKey(i.location, form.location) && sameKey(i.roomBlock, form.roomBlock))) {
          throw new Error("DUPLICATE_ITEM");
        }
        await addInventoryItem(form, actor);
        logAudit({ actor: actor.name, action: "Added inventory item", target: `${form.item.trim()} × ${form.quantity}` }).catch(() => {});
      } else if (panel.mode === "quantity") {
        await updateInventoryItem(panel.id, { type: "quantity", quantity: form.quantity }, actor);
        logAudit({ actor: actor.name, action: "Updated inventory quantity", target: `${panelItem?.item} → ${form.quantity}` }).catch(() => {});
      } else if (panel.mode === "damaged") {
        await updateInventoryItem(panel.id, { type: "damaged", count: form.amount }, actor);
        logAudit({ actor: actor.name, action: "Marked inventory damaged", target: `${panelItem?.item} × ${form.amount}` }).catch(() => {});
      } else if (panel.mode === "details") {
        if (inventory.some((i) => i.id !== panel.id && sameKey(i.item, panelItem?.item) && sameKey(i.location, form.location) && sameKey(i.roomBlock, form.roomBlock))) {
          throw new Error("DUPLICATE_ITEM");
        }
        await updateInventoryItem(panel.id, { type: "details", category: form.category, location: form.location, roomBlock: form.roomBlock, status: form.status }, actor);
        logAudit({ actor: actor.name, action: "Updated inventory details", target: panelItem?.item || "" }).catch(() => {});
      }
      closePanel();
    } catch (err) {
      console.error("Failed to save inventory:", err);
      setPanelError(ERROR_TEXT[err?.message] || "Couldn't save this change. Please try again.");
    } finally {
      setPanelSaving(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const panelTitle = {
    add: "Add inventory item",
    quantity: `Update quantity — ${panelItem?.item || ""}`,
    damaged: `Mark damaged — ${panelItem?.item || ""}`,
    details: `Edit details — ${panelItem?.item || ""}`,
  }[panel?.mode];

  const inventoryColumns = [
    {
      key: "item",
      label: "Item",
      sortable: true,
      render: (it) => (
        <>
          <p className="font-medium text-ink">{it.item}</p>
          <p className="text-xs text-slate-400">{it.category || "—"}</p>
        </>
      ),
    },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "available", label: "Available", sortable: true },
    { key: "damaged", label: "Damaged", sortable: true },
    {
      key: "location",
      label: "Location",
      sortable: true,
      render: (it) => (
        <>
          <p>{it.location || "—"}</p>
          {it.roomBlock && <p className="text-xs text-slate-400">{it.roomBlock}</p>}
        </>
      ),
    },
    { key: "status", label: "Status", render: (it) => <Pill tone={it.status === "In Stock" ? "Good" : it.status === "Low Stock" ? "Medium" : it.status === "Out of Stock" ? "Urgent" : it.status}>{it.status || "—"}</Pill> },
    {
      key: "updatedAt",
      label: "Last updated",
      render: (it) => (
        <>
          <p>{fmtTs(it.updatedAt)}</p>
          <p className="text-xs text-slate-400">{it.updatedBy || "—"}</p>
        </>
      ),
    },
  ];

  // --- Student requests ------------------------------------------------
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [requestErrors, setRequestErrors] = useState({});
  const [sourceChoice, setSourceChoice] = useState({});

  function candidatesFor(r) {
    return inventory.filter((i) => sameKey(i.item, r.item));
  }

  function chosenSource(r) {
    const cands = candidatesFor(r);
    const qty = Math.max(Math.floor(Number(r.quantity)) || 1, 1);
    return sourceChoice[r.id] || (cands.find((c) => c.available >= qty) || cands[0])?.id || "";
  }

  async function runRequestAction(r, fn, auditAction) {
    if (busyIds.has(r.id)) return;
    setBusyIds((prev) => new Set(prev).add(r.id));
    setRequestErrors((prev) => ({ ...prev, [r.id]: "" }));
    try {
      await fn();
      logAudit({ actor: actor.name, action: auditAction, target: `${r.item} × ${r.quantity} — ${r.studentName || "Student"}` }).catch(() => {});
    } catch (err) {
      console.error("Failed to update inventory request:", err);
      setRequestErrors((prev) => ({ ...prev, [r.id]: ERROR_TEXT[err?.message] || "Couldn't update this request. Please try again." }));
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(r.id);
        return next;
      });
    }
  }

  const decide = (r, status) => runRequestAction(r, () => decideInventoryRequest(r.id, status, actor), `${status} inventory request`);
  // Stock is only issued when a matching inventory record exists; the
  // transaction refuses if that would take available stock below zero.
  const fulfil = (r) => runRequestAction(r, () => fulfillInventoryRequest(r.id, chosenSource(r) || null, actor), "Fulfilled inventory request");

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Hostel-wide inventory levels">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : grouped.length === 0 ? (
          <EmptyState icon={<PackageIcon />} title="No inventory recorded yet" description="Add items below, or import them from the admin office." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {grouped.map((it) => (
              <div key={it.item} className="rounded-xl border border-slate-200 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <PackageIcon />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">{it.item}</p>
                <p className="text-xs text-slate-500">{it.quantity} total · {it.available} available</p>
                <p className="mt-1 text-xs text-slate-400">
                  across {it.locations} room{it.locations === 1 ? "" : "s"}{it.damaged > 0 ? ` · ${it.damaged} damaged` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {panel && (
        <Card title={panelTitle}>
          <form onSubmit={savePanel} className="flex flex-col gap-4">
            {panel.mode === "add" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Item name">
                  <input className={inputCls} value={form.item} onChange={set("item")} placeholder="E.g. Study table" />
                </Field>
                <Field label="Category">
                  <input className={inputCls} list="inventory-categories" value={form.category} onChange={set("category")} />
                </Field>
                <Field label="Quantity">
                  <input type="number" min="0" className={inputCls} value={form.quantity} onChange={set("quantity")} />
                </Field>
                <Field label="Damaged quantity">
                  <input type="number" min="0" className={inputCls} value={form.damaged} onChange={set("damaged")} />
                </Field>
              </div>
            )}
            {panel.mode === "quantity" && (
              <Field label={`New total quantity (currently ${panelItem?.quantity ?? 0}, ${panelItem?.available ?? 0} available)`}>
                <input type="number" min="0" className={`${inputCls} sm:w-56`} value={form.quantity} onChange={set("quantity")} />
              </Field>
            )}
            {panel.mode === "damaged" && (
              <Field label={`Units to mark damaged (${panelItem?.available ?? 0} available)`}>
                <input type="number" min="1" max={panelItem?.available ?? 0} className={`${inputCls} sm:w-56`} value={form.amount} onChange={set("amount")} />
              </Field>
            )}
            {(panel.mode === "add" || panel.mode === "details") && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {panel.mode === "details" && (
                  <Field label="Category">
                    <input className={inputCls} list="inventory-categories" value={form.category} onChange={set("category")} />
                  </Field>
                )}
                <Field label="Location">
                  <input className={inputCls} value={form.location} onChange={set("location")} placeholder="E.g. Store room" />
                </Field>
                <Field label="Room / Block (optional)">
                  <input className={inputCls} value={form.roomBlock} onChange={set("roomBlock")} placeholder="E.g. B-202 / B Wing" />
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={form.status} onChange={set("status")}>
                    <option value="">{panel.mode === "add" ? "Auto (from stock)" : "Keep current"}</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            )}
            <datalist id="inventory-categories">
              {CATEGORIES.map((c) => <option key={c} value={c} />)}
            </datalist>
            {panelError && <p className="text-sm text-rose-600">{panelError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={panelSaving}>{panelSaving ? "Saving…" : "Save"}</Button>
              <Button type="button" variant="outline" onClick={closePanel}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card
        title="Manage inventory"
        action={!panel && <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => openPanel("add")}>+ Add item</Button>}
      >
        <DataTable
          columns={inventoryColumns}
          rows={inventory}
          loading={loading}
          searchKeys={["item", "category", "location", "roomBlock", "status"]}
          searchPlaceholder="Search inventory…"
          emptyTitle="No inventory recorded yet"
          emptyDescription="Use “+ Add item” to record hostel stock."
          emptyIcon={<PackageIcon />}
          pageSize={10}
          rowActions={(it) => [
            { label: "Update quantity", onClick: () => openPanel("quantity", it) },
            { label: "Mark damaged", onClick: () => openPanel("damaged", it) },
            { label: "Edit location / status", onClick: () => openPanel("details", it) },
          ]}
        />
      </Card>

      <Card title="Furniture requests from students" action={<Pill tone="Pending">{pendingCount} pending</Pill>}>
        {requests.length === 0 ? (
          <EmptyState title="No requests yet" description="Requests students submit will show up here." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {requests.map((r) => {
              const busy = busyIds.has(r.id);
              const cands = candidatesFor(r);
              return (
                <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{r.item} × {r.quantity}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
                    <p className="mt-1 text-xs text-slate-300">{r.studentName} · {r.date}</p>
                    {requestErrors[r.id] && <p className="mt-1 text-xs text-rose-600">{requestErrors[r.id]}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {r.status === "Pending" ? (
                      <>
                        <Button variant="outline" className="px-3 py-1 text-xs" disabled={busy} onClick={() => decide(r, "Approved")}>
                          Approve
                        </Button>
                        <Button variant="danger" className="px-3 py-1 text-xs" disabled={busy} onClick={() => decide(r, "Rejected")}>
                          Reject
                        </Button>
                      </>
                    ) : (
                      <>
                        <Pill tone={r.status === "Fulfilled" ? "Resolved" : r.status}>{r.status}</Pill>
                        {r.status === "Approved" && (
                          <>
                            {cands.length > 1 && (
                              <select className={`${inputCls} w-44 text-xs`} value={chosenSource(r)} onChange={(e) => setSourceChoice((s) => ({ ...s, [r.id]: e.target.value }))}>
                                {cands.map((c) => (
                                  <option key={c.id} value={c.id}>{c.location || "No location"}{c.roomBlock ? ` · ${c.roomBlock}` : ""} ({c.available})</option>
                                ))}
                              </select>
                            )}
                            <Button className="px-3 py-1 text-xs" disabled={busy} onClick={() => fulfil(r)}>
                              {busy ? "Saving…" : "Mark fulfilled"}
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
