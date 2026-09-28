import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { SirenIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { addDocument } from "../../../firebase/firestore";
import { toCsvText, downloadTextFile } from "../../../utils/csv";

const INCIDENT_CATEGORIES = ["Suspicious activity", "Disturbance", "Gate malfunction", "Unauthorized entry attempt", "Other"];
const INCIDENT_SEVERITIES = ["Low", "Medium", "High"];
const EMPTY_FORM = { category: INCIDENT_CATEGORIES[0], description: "", severity: "Low" };

// CSV export column spec — required fields, in the required order.
const CSV_COLUMNS = [
  { label: "Incident ID", value: (i) => i.id },
  { label: "Category", value: (i) => i.category },
  { label: "Description", value: (i) => i.description },
  { label: "Date", value: (i) => i.date },
  { label: "Severity", value: (i) => i.severity },
  { label: "Status", value: (i) => i.status },
  { label: "Reported By", value: (i) => i.reportedBy },
];

export default function SecurityIncidentReports() {
  const { profile, user } = useAuth();
  // No Firestore orderBy: it silently drops incidents that lack a `date`.
  // History stays complete; newest first is applied here instead.
  const incidentsQuery = useCollection("incidents");
  const incidents = useMemo(() => {
    const key = (i) => i.date || (i.createdAt?.toDate ? i.createdAt.toDate().toISOString().slice(0, 10) : "");
    return [...incidentsQuery.data].sort((a, b) => key(b).localeCompare(key(a)));
  }, [incidentsQuery.data]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");

  // Mirrors whatever the table is currently showing (search applied, not yet
  // paginated). Starts out equal to the full live dataset and only narrows
  // once the user types into the table's search box, so a download before
  // any search still exports every record.
  const [visibleIncidents, setVisibleIncidents] = useState(incidents);

  // Downloads exactly what's currently filtered in the table above — the
  // complete dataset when there's no search, or just the matching records
  // when there is. Reads from state only; never touches Firestore.
  function handleDownload() {
    setDownloadMessage("");
    if (visibleIncidents.length === 0) {
      setDownloadMessage("There are no incident reports to download yet.");
      return;
    }
    setDownloading(true);
    try {
      downloadTextFile(toCsvText(visibleIncidents, CSV_COLUMNS), "incident-reports.csv");
    } catch (err) {
      console.error("Failed to download incident reports:", err);
      setDownloadMessage("Couldn't download the incident reports. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

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

      <Card
        title="Incident log"
        action={
          <Button
            variant="outline"
            className="px-3 py-1.5 text-xs"
            onClick={handleDownload}
            disabled={incidentsQuery.loading || downloading || visibleIncidents.length === 0}
          >
            {downloading ? "Preparing…" : `Download Incident Reports (${visibleIncidents.length})`}
          </Button>
        }
      >
        {downloadMessage && <p className="mb-3 text-sm text-red-600">{downloadMessage}</p>}
        <DataTable
          onFilteredChange={setVisibleIncidents}
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
