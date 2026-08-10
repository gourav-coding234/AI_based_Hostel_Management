import { useMemo, useState } from "react";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { BedIcon } from "../../../components/dashboard/student/icons";
import { myAllocation, wingRooms, roomWaitingList } from "../../../data/studentMock";

export default function RoomBed() {
  const [waitlist, setWaitlist] = useState(roomWaitingList);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { vacantCount, occupiedCount, totalBeds } = useMemo(() => {
    let vacant = 0;
    let occupied = 0;
    wingRooms.forEach((r) => r.beds.forEach((b) => (b.status === "vacant" ? vacant++ : occupied++)));
    return { vacantCount: vacant, occupiedCount: occupied, totalBeds: vacant + occupied };
  }, []);

  function submitRequest(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setWaitlist((list) => [
      { name: "You", requestedOn: "Today", reason, priority: "Normal" },
      ...list,
    ]);
    setReason("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Your allocation">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <BedIcon />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                {myAllocation.room} · {myAllocation.bed}
              </p>
              <p className="text-sm text-slate-500">{myAllocation.wing}, {myAllocation.floor}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone={myAllocation.status}>{myAllocation.status}</Pill>
            <span className="text-xs text-slate-400">Since {myAllocation.allottedOn}</span>
          </div>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Roommates</p>
          <div className="flex flex-wrap gap-2">
            {myAllocation.roommates.map((r) => (
              <span key={r.name} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {r.name} · {r.bed}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="font-display text-2xl font-semibold text-ink">{totalBeds}</p>
          <p className="text-sm text-slate-500">Total beds in B Wing</p>
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

      <Card title="Wing vacancy — room by room" className="overflow-x-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wingRooms.map((room) => (
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
                      b.isSelf
                        ? "bg-teal-500/10 text-teal-700"
                        : b.status === "vacant"
                        ? "bg-teal-500/5 text-teal-600"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span>Bed {b.bed}</span>
                    <span className="font-medium">
                      {b.status === "vacant" ? "Vacant" : b.isSelf ? "You" : b.student}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Room change / new allotment waiting list">
          <ul className="flex flex-col divide-y divide-slate-100">
            {waitlist.map((w, i) => (
              <li key={`${w.name}-${i}`} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{w.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{w.reason}</p>
                  <p className="mt-0.5 text-xs text-slate-300">Requested {w.requestedOn}</p>
                </div>
                <Pill tone={w.priority}>{w.priority}</Pill>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Request a room or bed change">
          <form onSubmit={submitRequest} className="flex flex-col gap-4">
            <Field label="Reason for request">
              <textarea
                className={`${inputCls} min-h-[96px] resize-none`}
                placeholder="E.g. requesting a bed closer to the wing washroom, or a room change due to a roommate conflict…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit">
                Submit request
              </Button>
              {submitted && <span className="text-xs font-medium text-teal-600">Added to the waiting list.</span>}
            </div>
            <p className="text-xs text-slate-400">
              Your warden reviews room-change requests and allots vacant beds in order of priority.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
