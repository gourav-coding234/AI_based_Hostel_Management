import { useMemo, useState } from "react";
import { Card, Pill, Button, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import { WrenchIcon } from "../../../components/dashboard/student/icons";
import { initialComplaints, complaintCategories } from "../../../data/studentMock";

let nextId = 240;

export default function Complaints() {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState(complaintCategories[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");

  const filtered = useMemo(
    () => (filter === "All" ? complaints : complaints.filter((c) => c.category === filter)),
    [complaints, filter]
  );

  function submitComplaint(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setComplaints((list) => [
      {
        id: `CMP-${nextId++}`,
        category,
        title,
        description,
        status: "Open",
        date: "Today",
        priority,
      },
      ...list,
    ]);
    setTitle("");
    setDescription("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Raise a complaint">
          <form onSubmit={submitComplaint} className="flex flex-col gap-4">
            <Field label="Category">
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {complaintCategories.map((c) => (
                  <option key={c} value={c}>
                    {c === "Room" ? "My room" : c === "Wing" ? "My wing" : c === "Food" ? "Mess / food" : "Other"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject">
              <input
                className={inputCls}
                placeholder="Short summary — e.g. leaking tap"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Details">
              <textarea
                className={`${inputCls} min-h-[90px] resize-none`}
                placeholder="Describe the issue, location and how long it's been going on"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field label="Priority">
              <div className="flex gap-2">
                {["Low", "Medium", "High"].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      priority === p ? "bg-navy-950 text-white" : "border border-slate-200 text-slate-500"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>
            <Button type="submit" className="self-start">
              Submit complaint
            </Button>
          </form>
        </Card>

        <Card
          title="Your complaints"
          action={
            <select
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 focus:border-teal-400 focus:outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All categories</option>
              {complaintCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          }
        >
          {filtered.length === 0 ? (
            <EmptyState icon={<WrenchIcon />} title="No complaints here" description="Nothing filed in this category yet." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {filtered.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">{c.title}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {c.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
                    <p className="mt-1 text-xs text-slate-300">{c.id} · {c.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Pill tone={c.status}>{c.status}</Pill>
                    <Pill tone={c.priority}>{c.priority}</Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
