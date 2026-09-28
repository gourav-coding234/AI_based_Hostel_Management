import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import { QrIcon } from "../../../components/dashboard/student/icons";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { useDocument } from "../../../hooks/useDocument";
import { addDocument } from "../../../firebase/firestore";

const GATE_PASS_TYPES = ["Outing", "Home Visit", "Medical", "Other"];

function qrUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(data)}`;
}

// Encodes exactly what Security's gate scanner needs to look the pass up
// and cross-check it — never anything Security should trust outright. The
// actual status/tripState always comes from Security's own Firestore fetch
// at scan time, not from this payload.
function qrPayload(pass) {
  return JSON.stringify({
    gatePassId: pass.id,
    studentId: pass.studentId,
    type: pass.type,
    from: pass.from,
    to: pass.to,
  });
}

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Picks which Approved pass to show, instead of trusting array order:
 *  - a pass whose [from, to] window contains right now wins outright;
 *  - otherwise the soonest upcoming approved pass (from still ahead of
 *    now) is shown, so an approval for a future outing still surfaces;
 *  - a pass whose window has already ended is never selected, so an
 *    expired approval doesn't linger as if it were still active.
 * Dates that fail to parse are treated as "current" rather than dropped,
 * so a record with an odd date value doesn't just vanish.
 */
function pickActivePass(approvedPasses, now) {
  let bestUpcoming = null;
  for (const p of approvedPasses) {
    const from = parseDate(p.from);
    const to = parseDate(p.to);
    const isExpired = to && now > to;
    const isUpcoming = from && now < from;
    if (isExpired) continue;
    if (!isUpcoming) return p; // currently within window (or dates missing/unparseable)
    if (!bestUpcoming || from < parseDate(bestUpcoming.from)) bestUpcoming = p;
  }
  return bestUpcoming;
}

export default function GatePass() {
  const { user, profile } = useAuth();
  const studentId = user?.uid || "";
  const gatePasses = useStudentCollection("gatePasses", studentId, { orderByField: "from" });
  // Own room/wing record — used only to tag the pass with block/room so the
  // admin/warden GatePasses pages' block & wing filters actually have
  // something to filter on. Never used to gate access; that's Firestore's job.
  const { data: studentRecord } = useDocument("students", studentId);

  const [type, setType] = useState(GATE_PASS_TYPES[0]);
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Purely a rendering fallback for a broken QR image request — never the
  // source of truth for whether a pass is approved. That always comes
  // straight from the Firestore documents above on every render, so a
  // refresh, another tab approving the pass, or the warden changing its
  // status all show up here immediately without any cached UI state.
  const [qrFailed, setQrFailed] = useState(false);

  const passes = gatePasses.items;
  // Recomputed fresh from `passes` every render — nothing about which pass
  // is "active" is ever cached in state or localStorage.
  const activePass = useMemo(() => pickActivePass(passes.filter((p) => p.status === "Approved"), new Date()), [passes]);
  const pendingPass = passes.find((p) => p.status === "Pending");

  useEffect(() => {
    setQrFailed(false);
  }, [activePass?.id]);

  async function submitRequest(e) {
    e.preventDefault();
    if (!reason.trim() || !from || !to) return;
    setSubmitting(true);
    setError("");
    try {
      await addDocument(
        "gatePasses",
        {
          studentId,
          studentName: profile?.name || user?.email,
          type,
          reason,
          from,
          to,
          status: "Pending",
          tripState: "Not started",
          block: profile?.hostelResidence || "",
          wing: studentRecord?.wing || profile?.hostelResidence || "",
          room: studentRecord?.room || "",
        },
        studentId
      );
      setReason("");
      setFrom("");
      setTo("");
    } catch (err) {
      console.error("Failed to submit gate pass request:", err);
      setError("Couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Active pass">
          {gatePasses.loading ? (
            <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
          ) : activePass ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              {qrFailed ? (
                <div
                  role="img"
                  aria-label={`QR code for gate pass ${activePass.id} could not be loaded`}
                  className="flex h-[180px] w-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-2 text-center shadow-sm shadow-slate-200/60"
                >
                  <QrIcon />
                  <p className="text-xs text-slate-400">QR image couldn't load — use your pass ID at the gate instead.</p>
                </div>
              ) : (
                <img
                  src={qrUrl(qrPayload(activePass))}
                  alt={`QR code for gate pass ${activePass.id}`}
                  width={180}
                  height={180}
                  className="rounded-xl border border-slate-200 p-2 shadow-sm shadow-slate-200/60"
                  onError={() => setQrFailed(true)}
                />
              )}
              <div>
                <p className="font-display text-base font-semibold text-ink">{activePass.type} · {activePass.id}</p>
                <p className="mt-1 text-sm text-slate-500">{activePass.reason}</p>
                <p className="mt-1 text-xs text-slate-400">{activePass.from} → {activePass.to}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={activePass.status}>{activePass.status}</Pill>
                <Pill tone={activePass.tripState === "Out" ? "Pending" : activePass.tripState === "Returned" ? "Resolved" : "Normal"}>
                  {activePass.tripState}
                </Pill>
              </div>
              <p className="max-w-xs text-xs text-slate-400">
                Show this QR code (or your pass ID, <span className="font-semibold text-slate-500">{activePass.id}</span>) to
                security at the gate — they verify and record it once on the way out and once on the way back in. Your trip
                status above updates automatically once security logs it.
              </p>
            </div>
          ) : pendingPass ? (
            <EmptyState
              icon={<QrIcon />}
              title="Awaiting warden approval"
              description="Your gate pass request is pending — the QR will appear here once it's approved."
            />
          ) : (
            <EmptyState
              icon={<QrIcon />}
              title="No approved gate pass"
              description="Once the warden approves your request, your QR pass will appear here."
            />
          )}
        </Card>

        <Card title="Request a gate pass">
          <form onSubmit={submitRequest} className="flex flex-col gap-4">
            <Field label="Type">
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {GATE_PASS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Reason">
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                placeholder="E.g. visiting home for a family function"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Out">
                <input type="datetime-local" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="Expected return">
                <input type="datetime-local" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
              </Field>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </Card>
      </div>

      <Card title="Gate pass history">
        {gatePasses.loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
        ) : passes.length === 0 ? (
          <EmptyState icon={<QrIcon />} title="No gate passes yet" description="Requests you submit will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Window</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 pr-0 text-right font-medium">Trip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {passes.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="py-2.5 text-slate-400">{p.id}</td>
                    <td className="py-2.5 font-medium text-ink">{p.type}</td>
                    <td className="py-2.5 text-slate-500">{p.from} → {p.to}</td>
                    <td className="py-2.5"><Pill tone={p.status}>{p.status}</Pill></td>
                    <td className="py-2.5 pr-0 text-right text-slate-500">{p.tripState}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
