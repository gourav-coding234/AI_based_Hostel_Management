import { useMemo, useState } from "react";
import { Card, Pill, Button } from "../../../components/dashboard/student/ui";
import { CheckSquareIcon } from "../../../components/dashboard/student/icons";
import { attendanceWing, attendanceHistory } from "../../../data/studentMock";

export default function Attendance() {
  const [wing, setWing] = useState(attendanceWing);

  const { presentCount, totalCount } = useMemo(() => {
    let present = 0;
    let total = 0;
    wing.forEach((room) =>
      room.students.forEach((s) => {
        total++;
        if (s.present) present++;
      })
    );
    return { presentCount: present, totalCount: total };
  }, [wing]);

  function toggleStudent(roomName, studentName) {
    setWing((rooms) =>
      rooms.map((r) =>
        r.room !== roomName
          ? r
          : { ...r, students: r.students.map((s) => (s.name === studentName ? { ...s, present: !s.present } : s)) }
      )
    );
  }

  function markRoom(roomName, present) {
    setWing((rooms) =>
      rooms.map((r) =>
        r.room !== roomName ? r : { ...r, students: r.students.map((s) => ({ ...s, present })) }
      )
    );
  }

  function markWing(present) {
    setWing((rooms) => rooms.map((r) => ({ ...r, students: r.students.map((s) => ({ ...s, present })) })));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <CheckSquareIcon />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">Post-dinner roll call — B Wing</p>
              <p className="text-sm text-slate-500">{presentCount} of {totalCount} present today</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => markWing(true)}>Mark wing present</Button>
            <Button variant="danger" onClick={() => markWing(false)}>Mark wing absent</Button>
          </div>
        </div>
      </Card>

      <Card title="Room by room">
        <div className="flex flex-col gap-4">
          {wing.map((room) => {
            const roomPresent = room.students.filter((s) => s.present).length;
            return (
              <div key={room.room} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-semibold text-ink">{room.room}</p>
                    <span className="text-xs text-slate-400">
                      {roomPresent}/{room.students.length} present
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="px-3 py-1 text-xs" onClick={() => markRoom(room.room, true)}>
                      Mark room present
                    </Button>
                    <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => markRoom(room.room, false)}>
                      Mark room absent
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {room.students.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => toggleStudent(room.room, s.name)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        s.present
                          ? "border-teal-200 bg-teal-500/5 text-teal-700"
                          : "border-rose-200 bg-rose-500/5 text-rose-600"
                      }`}
                    >
                      <span className="font-medium">{s.name}{s.isSelf ? " (You)" : ""}</span>
                      <Pill tone={s.present ? "Present" : "Absent"}>{s.present ? "Present" : "Absent"}</Pill>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="This week's attendance">
        <div className="flex items-end gap-3 sm:gap-5">
          {attendanceHistory.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end rounded-lg bg-slate-100">
                <div
                  className="w-full rounded-lg bg-teal-500"
                  style={{ height: `${d.pct}%` }}
                  title={`${d.pct}%`}
                />
              </div>
              <span className="text-xs font-medium text-slate-500">{d.date}</span>
              <span className="text-xs text-slate-400">{d.pct}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
