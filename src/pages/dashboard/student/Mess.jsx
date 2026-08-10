import { useState } from "react";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { UtensilsIcon } from "../../../components/dashboard/student/icons";
import { messMenuToday, initialMessReports, messReportTypes } from "../../../data/studentMock";

let nextId = 200;

export default function Mess() {
  const [reports, setReports] = useState(initialMessReports);
  const [type, setType] = useState(messReportTypes[0]);
  const [description, setDescription] = useState("");

  function submitReport(e) {
    e.preventDefault();
    if (!description.trim()) return;
    setReports((list) => [
      {
        id: `MR-${nextId++}`,
        date: "Today",
        type,
        description,
        status: "Open",
      },
      ...list,
    ]);
    setDescription("");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Today's mess menu">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Breakfast", messMenuToday.breakfast],
            ["Lunch", messMenuToday.lunch],
            ["Dinner", messMenuToday.dinner],
          ].map(([meal, items]) => (
            <div key={meal} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <UtensilsIcon />
                </span>
                <p className="text-sm font-semibold text-ink">{meal}</p>
              </div>
              <p className="text-sm text-slate-500">{items}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Report a mess issue">
          <form onSubmit={submitReport} className="flex flex-col gap-4">
            <Field label="Issue type">
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {messReportTypes.map((t) => (
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
            <Button type="submit" className="self-start">
              Submit report
            </Button>
          </form>
        </Card>

        <Card title="Your recent reports">
          {reports.length === 0 ? (
            <p className="text-sm text-slate-400">No reports filed yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {reports.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink">{r.type}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
                    <p className="mt-1 text-xs text-slate-300">{r.id} · {r.date}</p>
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
