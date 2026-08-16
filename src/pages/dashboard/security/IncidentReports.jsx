import { useState } from "react";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { SirenIcon } from "../../../components/dashboard/security/icons";
import { initialIncidents, incidentCategories, incidentSeverities } from "../../../data/securityMock";

const EMPTY_FORM = { category: incidentCategories[0], description: "", severity: "Low" };

export default function SecurityIncidentReports() {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [form, setForm] = useState(EMPTY_FORM);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) return;
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    setIncidents((prev) => [
      { id: `INC-${89 + prev.length}`, ...form, description: form.description.trim(), date: today, status: "Open" },
      ...prev,
    ]);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Report an incident">
        <p className="-mt-2 mb-4 text-sm text-slate-500">
          Visible to the warden and admin office so they can follow up.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                {incidentCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Severity">
              <select value={form.severity} onChange={(e) => set("severity", e.target.value)} className={inputCls}>
                {incidentSeverities.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="What happened">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe what happened, where, and when"
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Button type="submit">
            <SirenIcon /> Submit report
          </Button>
        </form>
      </Card>

      <Card title="Incident log">
        <ul className="flex flex-col gap-3">
          {incidents.map((i) => (
            <li key={i.id} className="rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {i.category} <span className="ml-1 font-normal text-slate-400">· {i.id}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">{i.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{i.date}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill tone={i.severity}>{i.severity}</Pill>
                  <Pill tone={i.status}>{i.status}</Pill>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
