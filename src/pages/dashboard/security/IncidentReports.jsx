import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { SirenIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { addDocument } from "../../../firebase/firestore";

const INCIDENT_CATEGORIES = ["Suspicious activity", "Disturbance", "Gate malfunction", "Unauthorized entry attempt", "Other"];
const INCIDENT_SEVERITIES = ["Low", "Medium", "High"];
const EMPTY_FORM = { category: INCIDENT_CATEGORIES[0], description: "", severity: "Low" };

export default function SecurityIncidentReports() {
  const { profile, user } = useAuth();
  const incidentsQuery = useCollection("incidents", { orderByField: "date" });
  const incidents = incidentsQuery.data;
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      await addDocument("incidents", {
        title: `${form.category}`,
        category: form.category,
        description: form.description.trim(),
        severity: form.severity,
        date: new Date().toISOString().slice(0, 10),
        status: "Open",
        reportedBy: profile?.name || user?.email,
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Failed to submit incident:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Report an incident">
        <p className="-mt-2 mb-4 text-sm text-slate-500">
          Visible to the warden and admin office so they can follow up.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Severity">
              <select value={form.severity} onChange={(e) => set("severity", e.target.value)} className={inputCls}>
                {INCIDENT_SEVERITIES.map((s) => (
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
          <Button type="submit" disabled={submitting}>
            <SirenIcon /> {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </form>
      </Card>

      <Card title="Incident log">
        <DataTable
          columns={[
            {
              key: "category",
              label: "Incident",
              sortable: true,
              render: (i) => (
                <>
                  <p className="font-medium text-ink">{i.category}</p>
                  <p className="text-xs text-slate-500">{i.description}</p>
                </>
              ),
            },
            { key: "date", label: "Date", sortable: true },
            { key: "reportedBy", label: "Reported by", render: (i) => i.reportedBy || "—" },
            {
              key: "severity",
              label: "Severity / status",
              render: (i) => (
                <div className="flex items-center gap-2">
                  <Pill tone={i.severity}>{i.severity}</Pill>
                  <Pill tone={i.status}>{i.status}</Pill>
                </div>
              ),
            },
          ]}
          rows={incidents}
          loading={incidentsQuery.loading}
          searchKeys={["category", "description", "reportedBy"]}
          searchPlaceholder="Search incidents…"
          emptyTitle="No incidents reported yet"
          emptyDescription="Reports you file will show up here."
          emptyIcon={<SirenIcon />}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
