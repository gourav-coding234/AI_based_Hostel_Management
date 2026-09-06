import { useState } from "react";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { UserPlusIcon, LogOutIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { addDocument, updateDocument } from "../../../firebase/firestore";

const VISITOR_PURPOSES = ["Meeting a student", "Parent visit", "Delivery / courier", "Vendor / maintenance", "Other"];
const EMPTY_FORM = { visitorName: "", purpose: VISITOR_PURPOSES[0], idProof: "", phone: "" };

function nowLabel() {
  return new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function SecurityVisitorLog() {
  // Order by inTimeSort (a real ISO timestamp), not the inTime display
  // string — locale strings with month names don't sort correctly once
  // entries span more than one month.
  const visitorsQuery = useCollection("visitors", { orderByField: "inTimeSort" });
  const visitors = visitorsQuery.data;
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCheckIn(e) {
    e.preventDefault();
    if (!form.visitorName.trim()) return;
    setSubmitting(true);
    try {
      await addDocument("visitors", { ...form, inTime: nowLabel(), inTimeSort: new Date().toISOString(), outTime: "" });
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Failed to check in visitor:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOut(id) {
    try {
      await updateDocument("visitors", id, { outTime: nowLabel() });
    } catch (err) {
      console.error("Failed to check out visitor:", err);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Check in a visitor">
        <form onSubmit={handleCheckIn} className="grid gap-4 sm:grid-cols-2">
          <Field label="Visitor name">
            <input value={form.visitorName} onChange={(e) => set("visitorName", e.target.value)} placeholder="Full name" className={inputCls} />
          </Field>
          <Field label="Purpose">
            <select value={form.purpose} onChange={(e) => set("purpose", e.target.value)} className={inputCls}>
              {VISITOR_PURPOSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="ID proof">
            <input value={form.idProof} onChange={(e) => set("idProof", e.target.value)} placeholder="e.g. Aadhaar — last 4 digits" className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              <UserPlusIcon /> {submitting ? "Checking in…" : "Check in"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Visitor log">
        {visitorsQuery.loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : visitorsQuery.isEmpty ? (
          <EmptyState icon={<UserPlusIcon />} title="No visitors logged yet" description="Visitors you check in will show up here." />
        ) : (
          <div className="flex flex-col gap-3">
            {visitors.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{v.visitorName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{v.purpose}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {v.idProof}{v.phone ? ` · ${v.phone}` : ""} · In: {v.inTime}
                    {v.outTime ? ` · Out: ${v.outTime}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Pill tone={v.outTime ? "Resolved" : "Pending"}>{v.outTime ? "Checked out" : "On premises"}</Pill>
                  {!v.outTime && (
                    <Button variant="outline" onClick={() => handleCheckOut(v.id)}>
                      <LogOutIcon /> Check out
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
