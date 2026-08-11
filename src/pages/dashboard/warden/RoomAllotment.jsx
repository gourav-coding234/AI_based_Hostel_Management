import { useMemo, useState } from "react";
import { Card, Pill, Button } from "../../../components/dashboard/student/ui";
import { BedIcon, CheckIcon, XIcon } from "../../../components/dashboard/warden/icons";
import { wings, roomRequests as initialRequests } from "../../../data/wardenMock";

export default function RoomAllotment() {
  const [wingData, setWingData] = useState(wings);
  const [requests, setRequests] = useState(initialRequests);
  const [activeWing, setActiveWing] = useState(wings[0].name);

  const { vacantCount, occupiedCount, totalBeds } = useMemo(() => {
    let vacant = 0;
    let occupied = 0;
    wingData.forEach((w) => w.rooms.forEach((r) => r.beds.forEach((b) => (b.status === "vacant" ? vacant++ : occupied++))));
    return { vacantCount: vacant, occupiedCount: occupied, totalBeds: vacant + occupied };
  }, [wingData]);

  function allotFirstVacantBed(request) {
    let allotted = false;
    setWingData((data) =>
      data.map((w) => ({
        ...w,
        rooms: w.rooms.map((r) => {
          if (allotted) return r;
          const bedIdx = r.beds.findIndex((b) => b.status === "vacant");
          if (bedIdx === -1) return r;
          allotted = true;
          const beds = [...r.beds];
          beds[bedIdx] = { ...beds[bedIdx], status: "occupied", student: request.name };
          return { ...r, beds };
        }),
      }))
    );
    if (allotted) {
      setRequests((list) => list.filter((r) => r.id !== request.id));
    }
  }

  function dismissRequest(id) {
    setRequests((list) => list.filter((r) => r.id !== id));
  }

  const currentWing = wingData.find((w) => w.name === activeWing);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="font-display text-2xl font-semibold text-ink">{totalBeds}</p>
          <p className="text-sm text-slate-500">Total beds across the hostel</p>
        </Card>
        <Card>
          <p className="font-display text-2xl font-semibold text-teal-600">{vacantCount}</p>
          <p className="text-sm text-slate-500">Vacant beds right now</p>
        </Card>
        <Card>
          <p className="font-display text-2xl font-semibold text-ink">{occupiedCount}</p>
          <p className="text-sm text-slate-500">Beds occupied</p>
        </Card>
      </div>

      <Card title="Pending allotment & room-change requests">
        {requests.length === 0 ? (
          <p className="text-sm text-slate-400">No pending requests. All caught up.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{r.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{r.type}</span>
                    <Pill tone={r.priority}>{r.priority}</Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Current: {r.currentRoom} · Requested {r.requestedOn}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => allotFirstVacantBed(r)} disabled={vacantCount === 0}>
                    <CheckIcon /> Allot next vacant bed
                  </Button>
                  <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => dismissRequest(r.id)}>
                    <XIcon /> Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Wing vacancy — room by room">
        <div className="mb-4 flex flex-wrap gap-2">
          {wingData.map((w) => (
            <button
              key={w.name}
              type="button"
              onClick={() => setActiveWing(w.name)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeWing === w.name ? "bg-navy-950 text-white" : "border border-slate-200 text-slate-500"
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentWing?.rooms.map((room) => (
            <div key={room.room} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-ink">{room.room}</p>
                <span className="text-xs text-slate-400">{room.capacity} beds</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {room.beds.map((b) => (
                  <div
                    key={b.bed}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                      b.status === "vacant" ? "bg-teal-500/5 text-teal-600" : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <BedIcon />
                      Bed {b.bed}
                    </span>
                    <span className="font-medium">{b.status === "vacant" ? "Vacant" : b.student}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
