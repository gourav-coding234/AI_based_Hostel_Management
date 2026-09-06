import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import { ScanIcon, LogInIcon, LogOutIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { updateDocument, addDocument } from "../../../firebase/firestore";

export default function SecurityGateScan() {
  const { profile, user } = useAuth();
  const passesQuery = useCollection("gatePasses");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [justLogged, setJustLogged] = useState("");

  function handleScan(e) {
    e.preventDefault();
    const id = query.trim().toLowerCase();
    if (!id) return;
    const match = passesQuery.data.find((p) => p.id.toLowerCase() === id);
    setSearched(match ?? null);
    setNotFound(!match);
    setJustLogged("");
  }

  async function logDirection(direction) {
    if (!searched) return;
    const nextState = direction === "Out" ? "Out" : "Returned";
    const now = new Date();
    try {
      const passUpdate = { tripState: nextState };
      // A pass that has been out and is now returned is done — this is the
      // only place "Completed" ever gets set, so the status filter on the
      // admin/warden GatePasses pages actually has something to match.
      if (nextState === "Returned" && searched.status === "Approved") {
        passUpdate.status = "Completed";
      }
      await updateDocument("gatePasses", searched.id, passUpdate);
      await addDocument("gateLogs", {
        studentId: searched.studentId,
        studentName: searched.studentName,
        room: searched.room,
        passId: searched.id,
        direction,
        // `time` stays a human-readable display string; `timeSort` is a real
        // sortable ISO timestamp — Firestore orderBy must use timeSort, never
        // the locale string, or ordering silently breaks once entries span
        // more than one month (locale month names don't sort correctly).
        time: now.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }),
        timeSort: now.toISOString(),
        guard: profile?.name || user?.email || "Security",
      });
      setSearched((s) => ({ ...s, ...passUpdate }));
      setJustLogged(direction);
    } catch (err) {
      console.error("Failed to log gate scan:", err);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Verify a gate pass">
        <p className="-mt-2 mb-4 text-sm text-slate-500">
          In a phone-camera build this would scan the student's QR code directly — for now, enter the pass ID shown
          on their screen.
        </p>
        <form onSubmit={handleScan} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Gate pass ID">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Paste the pass ID"
                className={inputCls}
              />
            </Field>
          </div>
          <Button type="submit" className="shrink-0">
            <ScanIcon /> Verify
          </Button>
        </form>
      </Card>

      {notFound && (
        <EmptyState
          icon={<ScanIcon />}
          title="No pass found with that ID"
          description="Double-check the ID with the student, or ask them to show their gate pass screen again."
        />
      )}

      {searched && (
        <Card title={`${searched.type} — ${searched.studentName}`} action={<Pill tone={searched.status}>{searched.status}</Pill>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Student</p>
              <p className="mt-1 text-sm text-ink">{searched.studentName} · {searched.room || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</p>
              <p className="mt-1 text-sm text-ink">{searched.reason}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valid window</p>
              <p className="mt-1 text-sm text-ink">{searched.from} → {searched.to}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current trip status</p>
              <p className="mt-1 text-sm text-ink">{searched.tripState}</p>
            </div>
          </div>

          {searched.status !== "Approved" ? (
            <p className="mt-5 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              This pass is not currently approved — do not allow exit/entry on it.
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => logDirection("Out")} disabled={searched.tripState === "Out"}>
                <LogOutIcon /> Log exit
              </Button>
              <Button variant="outline" onClick={() => logDirection("In")} disabled={searched.tripState !== "Out"}>
                <LogInIcon /> Log entry
              </Button>
            </div>
          )}

          {justLogged && (
            <p className="mt-3 rounded-xl bg-teal-500/10 px-4 py-2.5 text-sm text-teal-700">
              {justLogged === "Out" ? "Exit logged." : "Entry logged."} Also added to the in/out register.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
