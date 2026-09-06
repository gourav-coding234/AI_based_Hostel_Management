import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { PackageIcon } from "../../../components/dashboard/student/icons";
import { useCollection } from "../../../hooks/useCollection";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { addDocument } from "../../../firebase/firestore";

const INVENTORY_ITEM_TYPES = ["Chair", "Table", "Bed", "Mattress", "Cupboard", "Fan", "Tube light", "Other"];

export default function Inventory() {
  const { user, profile } = useAuth();
  const studentId = user?.uid || "";

  const roomInventory = useCollection("inventory", {
    where: profile?.room ? [["location", "==", profile.room]] : [],
    skip: !profile?.room,
  });
  const requestsQuery = useStudentCollection("inventoryRequests", studentId, { orderByField: "date" });

  const [item, setItem] = useState(INVENTORY_ITEM_TYPES[0]);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitRequest(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await addDocument(
        "inventoryRequests",
        {
          studentId,
          studentName: profile?.name || user?.email,
          item,
          quantity: Number(quantity) || 1,
          reason,
          status: "Pending",
          date: new Date().toISOString().slice(0, 10),
        },
        studentId
      );
      setReason("");
      setQuantity(1);
    } catch (err) {
      console.error("Failed to submit inventory request:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Inventory in your room">
        {roomInventory.loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : roomInventory.isEmpty ? (
          <EmptyState icon={<PackageIcon />} title="No inventory recorded for your room" description="The admin office hasn't logged your room's inventory yet." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roomInventory.data.map((it) => (
              <div key={it.id} className="rounded-xl border border-slate-200 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <PackageIcon />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">{it.item}</p>
                <p className="text-xs text-slate-500">Qty {it.quantity}</p>
                <p className="mt-1 text-xs text-slate-400">Condition: {it.condition || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Request extra furniture">
          <form onSubmit={submitRequest} className="flex flex-col gap-4">
            <Field label="Item">
              <select className={inputCls} value={item} onChange={(e) => setItem(e.target.value)}>
                {INVENTORY_ITEM_TYPES.map((t) => (
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
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </Card>

        <Card title="Your requests">
          {requestsQuery.loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
          ) : requestsQuery.items.length === 0 ? (
            <EmptyState title="No requests yet" description="Requests you submit will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {requestsQuery.items.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{r.item} × {r.quantity}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
                    <p className="mt-1 text-xs text-slate-300">{r.date}</p>
                  </div>
                  <Pill tone={r.status}>{r.status}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
