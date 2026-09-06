import { useMemo } from "react";
import { Card, Pill, Button } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { PackageIcon } from "../../../components/dashboard/warden/icons";
import { useCollections } from "../../../hooks/useCollection";
import { updateDocument } from "../../../firebase/firestore";

export default function WardenInventory() {
  const { data, loading } = useCollections({
    inventory: { name: "inventory" },
    requests: { name: "inventoryRequests", options: { orderByField: "date" } },
  });
  const { inventory, requests } = data;

  const grouped = useMemo(() => {
    const map = new Map();
    inventory.forEach((it) => {
      if (!map.has(it.item)) map.set(it.item, { item: it.item, quantity: 0, locations: 0 });
      const entry = map.get(it.item);
      entry.quantity += Number(it.quantity) || 0;
      entry.locations += 1;
    });
    return Array.from(map.values());
  }, [inventory]);

  async function updateStatus(id, status) {
    try {
      await updateDocument("inventoryRequests", id, { status });
    } catch (err) {
      console.error("Failed to update inventory request:", err);
    }
  }

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Hostel-wide inventory levels">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : grouped.length === 0 ? (
          <EmptyState icon={<PackageIcon />} title="No inventory recorded yet" description="Inventory imported by the admin office will show up here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {grouped.map((it) => (
              <div key={it.item} className="rounded-xl border border-slate-200 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <PackageIcon />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">{it.item}</p>
                <p className="text-xs text-slate-500">{it.quantity} total</p>
                <p className="mt-1 text-xs text-slate-400">across {it.locations} room{it.locations === 1 ? "" : "s"}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Furniture requests from students" action={<Pill tone="Pending">{pendingCount} pending</Pill>}>
        {requests.length === 0 ? (
          <EmptyState title="No requests yet" description="Requests students submit will show up here." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{r.item} × {r.quantity}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
                  <p className="mt-1 text-xs text-slate-300">{r.studentName} · {r.date}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.status === "Pending" ? (
                    <>
                      <Button variant="outline" className="px-3 py-1 text-xs" onClick={() => updateStatus(r.id, "Approved")}>
                        Approve
                      </Button>
                      <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => updateStatus(r.id, "Rejected")}>
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Pill tone={r.status}>{r.status}</Pill>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
