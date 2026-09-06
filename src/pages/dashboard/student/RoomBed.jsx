import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { BedIcon } from "../../../components/dashboard/student/icons";
import { useCollection } from "../../../hooks/useCollection";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { addDocument } from "../../../firebase/firestore";

export default function RoomBed() {
  const { user, profile } = useAuth();
  const studentId = user?.uid || "";

  const wing = profile?.wing;
  const wingmates = useCollection("students", {
    where: wing ? [["wing", "==", wing]] : [],
    skip: !wing,
  });
  const waitlistQuery = useStudentCollection("roomRequests", studentId, { orderByField: "createdAt" });

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const roommates = useMemo(
    () => wingmates.data.filter((s) => s.id !== studentId && s.room && s.room === profile?.room),
    [wingmates.data, studentId, profile?.room]
  );

  const roomsInWing = useMemo(() => {
    const map = new Map();
    wingmates.data.forEach((s) => {
      if (!s.room) return;
      if (!map.has(s.room)) map.set(s.room, []);
      map.get(s.room).push(s);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [wingmates.data]);

  async function submitRequest(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await addDocument(
        "roomRequests",
        { studentId, studentName: profile?.name || user?.email, reason, priority: "Normal", status: "Pending" },
        studentId
      );
      setReason("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    } catch (err) {
      console.error("Failed to submit room request:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (!profile?.room) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <Card>
          <EmptyState icon={<BedIcon />} title="Room not yet allotted" description="Your warden hasn't allotted you a room yet. Check back soon." />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Your allocation">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <BedIcon />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                {profile.room} · {profile.bed || "—"}
              </p>
              <p className="text-sm text-slate-500">{profile.wing}{profile.floor ? `, ${profile.floor}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone="Approved">Allotted</Pill>
            {profile.allottedOn && <span className="text-xs text-slate-400">Since {profile.allottedOn}</span>}
          </div>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Roommates</p>
          {roommates.length === 0 ? (
            <p className="text-xs text-slate-400">No other students are recorded in this room yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roommates.map((r) => (
                <span key={r.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {r.name} · {r.bed || "—"}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {wing && (
        <Card title={`Students in ${wing}`} subtitle="Grouped by room — from the live student roster." className="overflow-x-auto">
          {wingmates.loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
          ) : roomsInWing.length === 0 ? (
            <EmptyState title="No room allocations recorded yet" description="Once the warden allots rooms in your wing, they'll show up here." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roomsInWing.map(([room, occupants]) => (
                <div key={room} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-display text-sm font-semibold text-ink">{room}</p>
                    <span className="text-xs text-slate-400">{occupants.length} student{occupants.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {occupants.map((o) => (
                      <div
                        key={o.id}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                          o.id === studentId ? "bg-teal-500/10 text-teal-700" : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span>Bed {o.bed || "—"}</span>
                        <span className="font-medium">{o.id === studentId ? "You" : o.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Room change / new allotment waiting list">
          {waitlistQuery.loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
          ) : waitlistQuery.items.length === 0 ? (
            <EmptyState title="No requests yet" description="Requests you submit will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {waitlistQuery.items.map((w) => (
                <li key={w.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{w.studentName}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{w.reason}</p>
                  </div>
                  <Pill tone={w.status}>{w.status}</Pill>
                </li>
              ))}
            </ul>
          )}
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
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit request"}
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
