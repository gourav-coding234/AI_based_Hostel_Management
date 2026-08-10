import { useState } from "react";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { PackageIcon } from "../../../components/dashboard/student/icons";
import { roomInventory, initialInventoryRequests, inventoryItemTypes } from "../../../data/studentMock";

let nextId = 60;

export default function Inventory() {
  const [requests, setRequests] = useState(initialInventoryRequests);
  const [item, setItem] = useState(inventoryItemTypes[0]);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  function submitRequest(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setRequests((list) => [
      {
        id: `INV-${nextId++}`,
        item,
        quantity: Number(quantity) || 1,
        reason,
        status: "Pending",
        date: "Today",
      },
      ...list,
    ]);
    setReason("");
    setQuantity(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Inventory in your room">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roomInventory.map((it) => (
            <div key={it.item} className="rounded-xl border border-slate-200 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                <PackageIcon />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">{it.item}</p>
              <p className="text-xs text-slate-500">Qty {it.quantity}</p>
              <p className="mt-1 text-xs text-slate-400">Condition: {it.condition}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Request extra furniture">
          <form onSubmit={submitRequest} className="flex flex-col gap-4">
            <Field label="Item">
              <select className={inputCls} value={item} onChange={(e) => setItem(e.target.value)}>
                {inventoryItemTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label="Reason">
              <textarea
                className={`${inputCls} min-h-[90px] resize-none`}
                placeholder="Why do you need this — e.g. broken chair leg, extra bed for an approved guest…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <Button type="submit" className="self-start">
              Submit request
            </Button>
          </form>
        </Card>

        <Card title="Your requests">
          <ul className="flex flex-col divide-y divide-slate-100">
            {requests.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{r.item} × {r.quantity}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
                  <p className="mt-1 text-xs text-slate-300">{r.id} · {r.date}</p>
                </div>
                <Pill tone={r.status}>{r.status}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
