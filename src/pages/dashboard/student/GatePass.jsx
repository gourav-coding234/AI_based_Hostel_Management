import { useState } from "react";
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

  const passes = gatePasses.items;
  const activePass = passes.find((p) => p.status === "Approved");

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
              <img
                src={qrUrl(`${activePass.id}|${activePass.type}|${activePass.from}-${activePass.to}`)}
                alt={`QR code for gate pass ${activePass.id}`}
                width={180}
                height={180}
                className="rounded-xl border border-slate-200 p-2 shadow-sm shadow-slate-200/60"
              />
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
