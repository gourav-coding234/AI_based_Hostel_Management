import { useState } from "react";
import { Card, Pill, Button } from "../../../components/dashboard/student/ui";
import { PackageIcon, AlertIcon } from "../../../components/dashboard/warden/icons";
import { hostelInventory, inventoryRequests as initialRequests } from "../../../data/wardenMock";

export default function WardenInventory() {
  const [requests, setRequests] = useState(initialRequests);

  function updateStatus(id, status) {
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="flex flex-col gap-6">
      <Card title="Hostel-wide inventory levels">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {hostelInventory.map((it) => (
            <div key={it.item} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <PackageIcon />
                </span>
                {it.lowStock && (
                  <span className="flex items-center gap-1 text-rose-600" title="Low stock">
                    <AlertIcon />
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">{it.item}</p>
              <p className="text-xs text-slate-500">{it.inUse} in use · {it.spare} spare</p>
              <p className="mt-1 text-xs text-slate-400">{it.total} total</p>
              {it.lowStock && <Pill tone="Overdue">Low stock</Pill>}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Furniture requests from students" action={<Pill tone="Pending">{pendingCount} pending</Pill>}>
        <ul className="flex flex-col divide-y divide-slate-100">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{r.item} × {r.quantity}</p>
                <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
                <p className="mt-1 text-xs text-slate-300">{r.student} · {r.room} · {r.id} · {r.date}</p>
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
      </Card>
    </div>
  );
}
