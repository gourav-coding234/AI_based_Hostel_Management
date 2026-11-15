import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { BedIcon, CheckIcon, XIcon } from "../../../components/dashboard/warden/icons";
import { useCollections } from "../../../hooks/useCollection";
import { updateDocument, deleteDocument, logAudit } from "../../../firebase/firestore";
import { studentMatchesHostel, wardenHostel } from "../../../utils/hostels";

export default function RoomAllotment() {
  const { profile, user } = useAuth();
  const { data, loading } = useCollections({
    students: { name: "students" },
    requests: { name: "roomRequests", options: { orderByField: "createdAt" } },
  });
  const assignedHostel = wardenHostel(profile);
  const students = data.students.filter((student) => studentMatchesHostel(student, assignedHostel));
  const studentByAnyId = Object.fromEntries(data.students.flatMap((student) => [student.id, student.accountUid, student.userId, student.regNo, student.registrationNo, student.email].filter(Boolean).map((id) => [String(id), student])));
  const pendingRequests = data.requests.filter((request) => {
    if (request.status !== "Pending") return false;
    const student = studentByAnyId[String(request.studentId || request.studentUid || request.uid || "")];
    return !assignedHostel || studentMatchesHostel(student, assignedHostel);
  });

  const assignedStudents = students.filter((student) => student.room);
  const rooms = useMemo(() => {
    const map = new Map();
    assignedStudents.forEach((student) => {
        if (!map.has(student.room)) map.set(student.room, []);
        map.get(student.room).push(student);
      });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [assignedStudents]);

  const [allotDraft, setAllotDraft] = useState({});
  const [allotError, setAllotError] = useState({});

  async function allot(requestId, studentId) {
    const draft = allotDraft[requestId];
    if (!draft?.room || !draft?.bed || !studentId) return;
    const requestStudent = studentByAnyId[String(studentId)];
    if (!studentMatchesHostel(requestStudent, assignedHostel)) {
      setAllotError((e) => ({ ...e, [requestId]: "Choose a student within your assigned hostel." }));
      return;
    }

    const clash = students.find(
      (s) => s.id !== studentId && s.room === draft.room && String(s.bed) === String(draft.bed)
    );
    if (clash) {
      setAllotError((e) => ({ ...e, [requestId]: `Bed ${draft.bed} in ${draft.room} is already occupied by ${clash.name}.` }));
      return;
    }
    setAllotError((e) => ({ ...e, [requestId]: "" }));

    try {
      await updateDocument("students", studentId, {
        room: draft.room,
        bed: draft.bed,
        ...(assignedHostel ? { hostel: assignedHostel, hostelType: assignedHostel } : {}),
        allottedOn: new Date().toISOString().slice(0, 10),
      });
      await deleteDocument("roomRequests", requestId);
      logAudit({
        actor: profile?.name || user?.email || "Warden",
        action: "Allotted room",
        target: `Room ${draft.room}, Bed ${draft.bed} (${wing})`,
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to allot room:", err);
      setAllotError((e) => ({ ...e, [requestId]: "Something went wrong allotting this room. Please try again." }));
    }
  }

  async function vacate(student) {
    if (!student?.room) return;
    try {
      await updateDocument("students", student.id, { room: "", bed: "", vacatedOn: new Date().toISOString().slice(0, 10) });
      logAudit({
        actor: profile?.name || user?.email || "Warden",
        action: "Vacated room",
        target: `${student.name} — Room ${student.room}`,
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to vacate student:", err);
    }
  }

  async function dismissRequest(id) {
    try {
      await deleteDocument("roomRequests", id);
    } catch (err) {
      console.error("Failed to dismiss request:", err);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="font-display text-2xl font-semibold text-ink">{assignedStudents.length}</p>
          <p className="text-sm text-slate-500">Students with a room assigned</p>
        </Card>
        <Card>
          <p className="font-display text-2xl font-semibold text-teal-600">{rooms.length}</p>
          <p className="text-sm text-slate-500">Rooms currently occupied</p>
        </Card>
        <Card>
          <p className="font-display text-2xl font-semibold text-ink">{students.length - assignedStudents.length}</p>
          <p className="text-sm text-slate-500">Students awaiting room assignment</p>
        </Card>
      </div>

      <Card title="Pending allotment & room-change requests">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : pendingRequests.length === 0 ? (
          <EmptyState title="No pending requests" description="Room-change or new-allotment requests will show up here." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {pendingRequests.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{r.studentName}</p>
                    <Pill tone={r.priority || "Normal"}>{r.priority || "Normal"}</Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Room">
                    <input
                      className={`${inputCls} w-24`}
                      placeholder="e.g. 204"
                      value={allotDraft[r.id]?.room || ""}
                      onChange={(e) => setAllotDraft((d) => ({ ...d, [r.id]: { ...d[r.id], room: e.target.value } }))}
                    />
                  </Field>
                  <Field label="Bed">
                    <input
                      className={`${inputCls} w-16`}
                      placeholder="1"
                      value={allotDraft[r.id]?.bed || ""}
                      onChange={(e) => setAllotDraft((d) => ({ ...d, [r.id]: { ...d[r.id], bed: e.target.value } }))}
                    />
                  </Field>
                  <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => allot(r.id, r.studentId)}>
                    <CheckIcon /> Allot
                  </Button>
                  <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => dismissRequest(r.id)}>
                    <XIcon /> Dismiss
                  </Button>
                </div>
                {allotError[r.id] && <p className="text-xs text-rose-600">{allotError[r.id]}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`${assignedHostel || "Hostel"} occupancy — room by room`}>
        {rooms.length === 0 ? (
              <EmptyState icon={<BedIcon />} title="No room allocations yet" description="Students with an assigned room will appear here." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map(([room, occupants]) => (
                  <div key={room} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-display text-sm font-semibold text-ink">{room}</p>
                      <span className="text-xs text-slate-400">{occupants.length} occupied</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {occupants.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                          <span className="flex items-center gap-1.5"><BedIcon /> Bed {s.bed || "—"}</span>
                          <span className="font-medium">{s.name}</span>
                          <button
                            type="button"
                            onClick={() => vacate(s)}
                            className="ml-2 shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                          >
                            Vacate
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
      </Card>
    </div>
  );
}
