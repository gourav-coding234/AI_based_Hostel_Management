import { useState } from "react";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { UserPlusIcon, LogOutIcon } from "../../../components/dashboard/security/icons";
import { initialVisitors, visitorPurposes } from "../../../data/securityMock";

const EMPTY_FORM = { name: "", purpose: visitorPurposes[0], idProof: "", phone: "" };

export default function SecurityVisitorLog() {
  const [visitors, setVisitors] = useState(initialVisitors);
  const [form, setForm] = useState(EMPTY_FORM);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCheckIn(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
    setVisitors((prev) => [
      { id: `V-${520 + prev.length}`, ...form, checkIn: now, checkOut: "", status: "On premises" },
      ...prev,
    ]);
    setForm(EMPTY_FORM);
  }

  function handleCheckOut(id) {
    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
    setVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, checkOut: now, status: "Checked out" } : v)));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Check in a visitor">
        <form onSubmit={handleCheckIn} className="grid gap-4 sm:grid-cols-2">
          <Field label="Visitor name">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" className={inputCls} />
          </Field>
          <Field label="Purpose">
            <select value={form.purpose} onChange={(e) => set("purpose", e.target.value)} className={inputCls}>
              {visitorPurposes.map((p) => (
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
            <Button type="submit">
              <UserPlusIcon /> Check in
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Today's visitors">
        <div className="flex flex-col gap-3">
          {visitors.map((v) => (
            <div key={v.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{v.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{v.purpose}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {v.idProof}{v.phone ? ` · ${v.phone}` : ""} · In: {v.checkIn}
                  {v.checkOut ? ` · Out: ${v.checkOut}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Pill tone={v.status === "On premises" ? "Pending" : "Resolved"}>{v.status}</Pill>
                {v.status === "On premises" && (
                  <Button variant="outline" onClick={() => handleCheckOut(v.id)}>
                    <LogOutIcon /> Check out
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
