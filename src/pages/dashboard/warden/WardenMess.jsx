import { useState } from "react";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { UtensilsIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { updateDocument } from "../../../firebase/firestore";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EMPTY_MEAL = { breakfast: "", lunch: "", dinner: "" };

export default function WardenMess() {
  const menuQuery = useCollection("messMenu");
  const reportsQuery = useCollection("messReports", { orderByField: "date" });
  const menuByDay = Object.fromEntries(menuQuery.data.map((d) => [d.id, d]));

  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_MEAL);
  const [saving, setSaving] = useState(false);

  const currentMeal = menuByDay[activeDay] || EMPTY_MEAL;

  function startEdit() {
    setDraft({ breakfast: currentMeal.breakfast || "", lunch: currentMeal.lunch || "", dinner: currentMeal.dinner || "" });
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await updateDocument("messMenu", activeDay, draft);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save menu:", err);
    } finally {
      setSaving(false);
    }
  }

  async function updateReportStatus(id, status) {
    try {
      await updateDocument("messReports", id, { status });
    } catch (err) {
      console.error("Failed to update mess report:", err);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card
        title="Weekly menu"
        action={
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
              <Button className="px-3 py-1.5 text-xs" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          ) : (
            <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={startEdit}>Edit {activeDay}</Button>
          )
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setActiveDay(d); setEditing(false); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeDay === d ? "bg-navy-950 text-white" : "border border-slate-200 text-slate-500"
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>

        {editing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Breakfast">
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                value={draft.breakfast}
                onChange={(e) => setDraft((d) => ({ ...d, breakfast: e.target.value }))}
              />
            </Field>
            <Field label="Lunch">
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                value={draft.lunch}
                onChange={(e) => setDraft((d) => ({ ...d, lunch: e.target.value }))}
              />
            </Field>
            <Field label="Dinner">
              <textarea
                className={`${inputCls} min-h-[80px] resize-none`}
                value={draft.dinner}
                onChange={(e) => setDraft((d) => ({ ...d, dinner: e.target.value }))}
              />
            </Field>
          </div>
        ) : !menuByDay[activeDay] ? (
          <EmptyState icon={<UtensilsIcon />} title={`No menu set for ${activeDay}`} description="Click Edit to add one." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ["Breakfast", currentMeal.breakfast],
              ["Lunch", currentMeal.lunch],
              ["Dinner", currentMeal.dinner],
            ].map(([meal, items]) => (
              <div key={meal} className="rounded-xl border border-slate-200 p-4">
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

      <Card title="Mess reports from students">
        {reportsQuery.loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : reportsQuery.isEmpty ? (
          <EmptyState title="No mess reports yet" description="Reports students submit will show up here." />
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {reportsQuery.data.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{r.type}</p>
                    <Pill tone={r.status}>{r.status}</Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
                  <p className="mt-1 text-xs text-slate-300">{r.studentName} · {r.date}</p>
                </div>
                {r.status !== "Resolved" && (
                  <div className="flex shrink-0 gap-2">
                    {r.status === "Open" && (
                      <Button variant="outline" className="px-3 py-1 text-xs" onClick={() => updateReportStatus(r.id, "In Progress")}>
                        Mark in progress
                      </Button>
                    )}
                    <Button className="px-3 py-1 text-xs" onClick={() => updateReportStatus(r.id, "Resolved")}>
                      Mark resolved
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
