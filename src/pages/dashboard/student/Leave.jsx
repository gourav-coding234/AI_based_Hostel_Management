import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import { AlertIcon } from "../../../components/dashboard/student/icons";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { useDocument } from "../../../hooks/useDocument";
import { addDocument } from "../../../firebase/firestore";

const LEAVE_TYPES = ["Home Visit", "Medical", "Emergency", "Other"];

// Checks the form in the same order a student fills it in, so whichever
// field is wrong first is the one they're told about. `from`/`to` are the
// browser date input's "YYYY-MM-DD" strings, which sort correctly as
// plain strings, so no Date parsing is needed to compare them.
function validate({ type, reason, from, to }) {
  if (!type) return "Please select a leave type.";
  if (!reason.trim()) return "Please tell us the reason for your leave.";
  if (!from) return "Please pick a start date.";
  if (!to) return "Please pick an end date.";
  if (to < from) return "The 'To' date can't be before the 'From' date.";
  return "";
}

export default function Leave() {
  const { user, profile } = useAuth();
  const studentId = user?.uid || "";
  const myRequests = useStudentCollection("leaveRequests", studentId, { orderByField: "from" });
  // Same room record used by GatePass — only to tag the request with a
  // wing/room so the warden's wing filter has something real to filter on.
  const { data: studentRecord } = useDocument("students", studentId);

  const [type, setType] = useState(LEAVE_TYPES[0]);
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitRequest(e) {
    e.preventDefault();
    // Belt-and-braces guard alongside the disabled button below — a fast
    // double Enter/click on the same tick shouldn't file two requests.
    if (submitting) return;

    const validationError = validate({ type, reason, from, to });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await addDocument(
        "leaveRequests",
        {
          studentId,
          studentName: profile?.name || user?.email,
          type,
          reason,
          from,
          to,
          status: "Pending",
          parentNotified: false,
          wing: studentRecord?.wing || profile?.hostelResidence || "",
          room: studentRecord?.room || "",
        },
        studentId
      );
      setReason("");
      setFrom("");
      setTo("");
    } catch (err) {
      console.error("Failed to submit leave request:", err);
      setError("Couldn't submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const requests = myRequests.items;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Request leave">
          <form onSubmit={submitRequest} className="flex flex-col gap-4">
            <Field label="Type">
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Reason">
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                placeholder="Why are you requesting leave?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="From">
                <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="To">
                <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
              </Field>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </Card>

        <Card title="Your leave requests">
          {myRequests.loading ? (
            <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
          ) : requests.length === 0 ? (
            <EmptyState icon={<AlertIcon />} title="No leave requests yet" description="Requests you submit will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {requests.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{r.type} · {r.from} → {r.to}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
                    {r.status === "Pending" && (
                      <p className="mt-1 text-xs text-slate-400">Waiting for warden review.</p>
                    )}
                    {r.status === "Approved" && (
                      <p className="mt-1 text-xs text-slate-400">
                        {r.parentNotified ? "Your parent has been notified." : "Parent notification pending."}
                      </p>
                    )}
                    {r.status === "Rejected" && (
                      <p className="mt-1 text-xs text-slate-400">This request was not approved.</p>
                    )}
                  </div>
                  <Pill tone={r.status}>{r.status}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
