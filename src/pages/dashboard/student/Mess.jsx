import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { UtensilsIcon } from "../../../components/dashboard/student/icons";
import { useDocument } from "../../../hooks/useDocument";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { addDocument } from "../../../firebase/firestore";

const MESS_REPORT_TYPES = ["Food shortage", "Food quality", "Hygiene", "Timing", "Other"];

export default function Mess() {
  const { user, profile } = useAuth();
  const studentId = user?.uid || "";

  const todayName = new Date().toLocaleDateString("en-IN", { weekday: "long" });
  const menu = useDocument("messMenu", todayName);
  const reportsQuery = useStudentCollection("messReports", studentId, { orderByField: "date" });

  const [type, setType] = useState(MESS_REPORT_TYPES[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReport(e) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await addDocument(
        "messReports",
        {
          studentId,
          studentName: profile?.name || user?.email,
          date: new Date().toISOString().slice(0, 10),
          type,
          description,
          status: "Open",
        },
        studentId
      );
      setDescription("");
    } catch (err) {
      console.error("Failed to submit mess report:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Today's mess menu">
        {menu.loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : !menu.data ? (
          <EmptyState icon={<UtensilsIcon />} title="Menu not posted yet" description="The mess staff hasn't published today's menu yet." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ["Breakfast", menu.data.breakfast],
              ["Lunch", menu.data.lunch],
              ["Dinner", menu.data.dinner],
            ].map(([meal, items]) => (
              <div
                key={meal}
                className="rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                    <UtensilsIcon />
                  </span>
                  <p className="text-sm font-semibold text-ink">{meal}</p>
                </div>
                <p className="text-sm text-slate-500">{items || "Not listed"}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Report a mess issue">
          <form onSubmit={submitReport} className="flex flex-col gap-4">
            <Field label="Issue type">
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {MESS_REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <textarea
                className={`${inputCls} min-h-[100px] resize-none`}
                placeholder="Describe what's short or wrong — e.g. no spoons left at dinner, rice ran out, food was undercooked…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Submitting…" : "Submit report"}
            </Button>
          </form>
        </Card>

        <Card title="Your recent reports">
          {reportsQuery.loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : reportsQuery.items.length === 0 ? (
            <p className="text-sm text-slate-400">No reports filed yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {reportsQuery.items.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{r.type}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
                    <p className="mt-1 text-xs text-slate-300">{r.date}</p>
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
