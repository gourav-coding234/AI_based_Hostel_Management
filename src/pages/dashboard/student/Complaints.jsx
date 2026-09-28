import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import { WrenchIcon } from "../../../components/dashboard/student/icons";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { addDocument } from "../../../firebase/firestore";

// "Inventory" covers requests/complaints about room furniture & fittings —
// merged in from the old standalone Inventory page (see Inventory.jsx,
// kept only for the Admin/Warden side). Selecting it reveals the extra
// Item/Quantity fields below.
const COMPLAINT_CATEGORIES = ["General", "Maintenance", "Electrical", "Plumbing", "Mess", "Inventory", "Furniture", "Other"];
const INVENTORY_ITEM_TYPES = ["Chair", "Table", "Bed", "Mattress", "Cupboard", "Fan", "Tube light", "Other"];

export default function Complaints() {
  const { user, profile } = useAuth();
  const studentId = user?.uid || "";
  const complaintsQuery = useStudentCollection("complaints", studentId, { orderByField: "date" });
  const complaints = complaintsQuery.items;

  // Lets other pages (e.g. the Overview quick links) deep-link straight
  // into the Inventory category — /dashboard/student/complaints?category=Inventory
  const [searchParams] = useSearchParams();
  const initialCategory = COMPLAINT_CATEGORIES.includes(searchParams.get("category"))
    ? searchParams.get("category")
    : COMPLAINT_CATEGORIES[0];

  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState(initialCategory);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [item, setItem] = useState(INVENTORY_ITEM_TYPES[0]);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isInventory = category === "Inventory";

  const filtered = useMemo(
    () => (filter === "All" ? complaints : complaints.filter((c) => c.category === filter)),
    [complaints, filter]
  );

  async function submitComplaint(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        studentId,
        studentName: profile?.name || user?.email,
        category,
        title,
        description,
        status: "Open",
        date: new Date().toISOString().slice(0, 10),
        priority,
      };
      // Extra, additive fields for inventory-type complaints — the base
      // complaint fields above stay the same so the Admin/Warden complaint
      // workflow keeps working unchanged for every category.
      if (isInventory) {
        payload.item = item;
        payload.quantity = Number(quantity) || 1;
      }
      await addDocument("complaints", payload, studentId);
      setTitle("");
      setDescription("");
      setQuantity(1);
    } catch (err) {
      console.error("Failed to submit complaint:", err);
      setError("Couldn't submit your complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Raise a complaint">
          <form onSubmit={submitComplaint} className="flex flex-col gap-4">
            <Field label="Category">
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {COMPLAINT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            {isInventory && (
              <>
                <Field label="Item">
                  <select className={inputCls} value={item} onChange={(e) => setItem(e.target.value)}>
                    {INVENTORY_ITEM_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity">
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </Field>
              </>
            )}

            <Field label={isInventory ? "Problem / reason" : "Subject"}>
              <input
                className={inputCls}
                placeholder={isInventory ? "Short summary — e.g. broken chair leg" : "Short summary — e.g. leaking tap"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Description">
              <textarea
                className={`${inputCls} min-h-[90px] resize-none`}
                placeholder={
                  isInventory
                    ? "Describe the issue and, if requesting extra furniture, why you need it"
                    : "Describe the issue, location and how long it's been going on"
                }
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
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                      priority === p
                        ? "bg-navy-950 text-white shadow-sm"
                        : "border border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Submitting…" : "Submit complaint"}
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
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          }
        >
          {complaintsQuery.loading ? (
            <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
          ) : filtered.length === 0 ? (
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
                    {c.item && (
                      <p className="mt-0.5 text-xs text-slate-400">Item: {c.item}{c.quantity ? ` × ${c.quantity}` : ""}</p>
                    )}
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
