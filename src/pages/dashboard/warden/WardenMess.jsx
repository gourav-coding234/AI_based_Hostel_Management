import { useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { UtensilsIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { updateDocument, bulkUpsertMessMenu } from "../../../firebase/firestore";
import { parseDataFile } from "../../../utils/fileImport";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EMPTY_MEAL = { breakfast: "", lunch: "", dinner: "" };

export default function WardenMess() {
  const { user, profile } = useAuth();
  const menuQuery = useCollection("messMenu");
  const reportsQuery = useCollection("messReports", { orderByField: "date" });
  const menuByDay = Object.fromEntries(menuQuery.data.map((d) => [d.id, d]));

  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_MEAL);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const [upload, setUpload] = useState({ rows: [], errors: [], message: "", mode: "merge", busy: false });

  async function chooseUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = await parseDataFile(file);
      const rows = [];
      const errors = [];
      parsed.records.forEach((row, index) => {
        const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), String(value || "").trim()]));
        const day = DAYS.find((d) => d.toLowerCase() === normalized.day?.toLowerCase());
        if (!day) errors.push(`Row ${index + 2}: day must be a weekday name.`);
        else if (![normalized.breakfast, normalized.lunch, normalized.dinner].some(Boolean)) errors.push(`Row ${index + 2}: add at least one meal.`);
        else rows.push({ day, breakfast: normalized.breakfast, lunch: normalized.lunch, dinner: normalized.dinner });
      });
      const seen = new Set();
      const unique = rows.filter((row) => {
        if (seen.has(row.day)) { errors.push(`Repeated day: ${row.day}. Keep one row per day.`); return false; }
        seen.add(row.day); return true;
      });
      setUpload((current) => ({ ...current, rows: unique, errors, message: file.name }));
    } catch (error) {
      setUpload((current) => ({ ...current, rows: [], errors: [error.message || "Could not read this file."], message: file.name }));
    }
  }

  async function importMenu() {
    setUpload((current) => ({ ...current, busy: true, errors: [] }));
    try {
      const count = await bulkUpsertMessMenu(upload.rows, upload.mode, { uid: user?.uid, name: profile?.name || user?.email });
      setUpload((current) => ({ ...current, busy: false, rows: [], message: `Saved ${count} menu day${count === 1 ? "" : "s"}.` }));
    } catch (error) {
      console.error("Mess menu upload failed:", error);
      setUpload((current) => ({ ...current, busy: false, errors: ["Could not save the timetable. Check Firestore rules and try again."] }));
    }
  }

  const currentMeal = menuByDay[activeDay] || EMPTY_MEAL;

  function startEdit() {
    setDraft({ breakfast: currentMeal.breakfast || "", lunch: currentMeal.lunch || "", dinner: currentMeal.dinner || "" });
    setEditing(true);
  }

  async function saveEdit() {
    // One messMenu document per weekday (doc id = weekday name), the same
    // document the Student page reads live. Guard against ever writing a
    // non-weekday id, or `undefined`/non-string meal values (Firestore
    // rejects undefined, and a stray non-string would break the student
    // view) — every meal is coerced to a trimmed string.
    if (saving || !DAYS.includes(activeDay)) return;
    const meals = {
      breakfast: String(draft.breakfast ?? "").trim(),
      lunch: String(draft.lunch ?? "").trim(),
      dinner: String(draft.dinner ?? "").trim(),
    };
    setSaving(true);
    try {
      // updateDocument merges onto messMenu/{day} and stamps updatedAt;
      // updatedBy* record which staff member made this change.
      await updateDocument("messMenu", activeDay, {
        ...meals,
        day: activeDay,
        updatedBy: profile?.name || user?.email || "Warden",
        updatedByUid: user?.uid || "",
      });
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
      <Card title="Bulk upload timetable" subtitle="CSV, XLSX, or XLS. One row per weekday with day, breakfast, lunch, and dinner columns.">
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={chooseUpload} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>Choose file</Button>
          <a className="text-sm font-medium text-teal-700 underline" href="/mess_menu_template.csv" download>Download sample template</a>
          <label className="text-sm text-slate-600">Import mode <select className={`${inputCls} ml-2 w-auto`} value={upload.mode} onChange={(e) => setUpload((current) => ({ ...current, mode: e.target.value }))}><option value="merge">Merge / update</option><option value="replace">Replace timetable</option></select></label>
        </div>
        {upload.message && <p className="mt-3 text-sm text-slate-500">{upload.message}</p>}
        {upload.errors.map((error) => <p key={error} className="mt-2 text-sm text-rose-600">{error}</p>)}
        {upload.rows.length > 0 && <>
          <div className="mt-3 max-h-48 overflow-auto rounded-lg border border-slate-200"><table className="w-full text-left text-xs"><thead><tr>{["Day", "Breakfast", "Lunch", "Dinner"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{upload.rows.map((row) => <tr key={row.day} className="border-t border-slate-100"><td className="px-3 py-2">{row.day}</td><td className="px-3 py-2">{row.breakfast}</td><td className="px-3 py-2">{row.lunch}</td><td className="px-3 py-2">{row.dinner}</td></tr>)}</tbody></table></div>
          <Button className="mt-3" onClick={importMenu} disabled={upload.busy || upload.rows.length === 0}>{upload.busy ? "Saving…" : `Import ${upload.rows.length} valid days`}</Button>
        </>}
      </Card>
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
