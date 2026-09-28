import { useMemo, useState } from "react";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { UserPlusIcon, LogOutIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { useAuth } from "../../../context/AuthContext";
import { addDocument, updateDocument, getCollection } from "../../../firebase/firestore";
import { toCsvText, downloadTextFile } from "../../../utils/csv";

const VISITOR_PURPOSES = ["Meeting a student", "Parent visit", "Delivery / courier", "Vendor / maintenance", "Other"];
const EMPTY_FORM = { visitorName: "", purpose: VISITOR_PURPOSES[0], idProof: "", phone: "" };

// Display string only — never used for sorting or ordering.
function timeLabel(date) {
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// Sortable key for a record's check-in: the ISO `inTimeSort` written with
// every entry, falling back to the server `createdAt` for older records
// that were saved before that field existed. Never parses the display text.
function inSortKey(v) {
  if (v.inTimeSort) return v.inTimeSort;
  const d = v.createdAt?.toDate ? v.createdAt.toDate() : null;
  return d ? d.toISOString() : "";
}

function byNewestFirst(a, b) {
  return inSortKey(b).localeCompare(inSortKey(a));
}

// Oldest first for the printed register.
function byOldestFirst(a, b) {
  return inSortKey(a).localeCompare(inSortKey(b));
}

function statusOf(v) {
  return v.outTime || v.outTimeSort ? "Checked out" : "On premises";
}

const CSV_COLUMNS = [
  { label: "Visitor Name", value: (v) => v.visitorName },
  { label: "Purpose", value: (v) => v.purpose },
  { label: "ID Proof", value: (v) => v.idProof },
  { label: "Phone", value: (v) => v.phone },
  { label: "In Time", value: (v) => v.inTime },
  { label: "Out Time", value: (v) => v.outTime },
  { label: "Status", value: (v) => statusOf(v) },
  { label: "Recorded By", value: (v) => v.recordedBy },
];

export default function SecurityVisitorLog() {
  const { user, profile } = useAuth();
  const guardName = profile?.name || user?.displayName || user?.email || "";

  // No Firestore orderBy on purpose: a query ordered by `inTimeSort` silently
  // drops any document that lacks that field (older / imported records).
  // Fetch everything and sort client-side on the ISO key instead.
  const visitorsQuery = useCollection("visitors");
  const visitors = useMemo(() => [...visitorsQuery.data].sort(byNewestFirst), [visitorsQuery.data]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCheckIn(e) {
    e.preventDefault();
    if (!form.visitorName.trim()) return;
    setSubmitting(true);
    setMessage("");
    try {
      const now = new Date();
      await addDocument("visitors", {
        visitorName: form.visitorName.trim(),
        purpose: form.purpose,
        idProof: form.idProof.trim(),
        phone: form.phone.trim(),
        inTime: timeLabel(now),
        inTimeSort: now.toISOString(),
        outTime: "",
        outTimeSort: "",
        status: "On premises",
        recordedBy: guardName,
        ...(user?.uid ? { recordedByUid: user.uid } : {}),
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Failed to check in visitor:", err);
      setMessage("Couldn't check in this visitor. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Check-out only updates the record — visitors are never deleted, so the
  // register stays a complete history. Fields missing on older records are
  // filled in so every record ends up with the full shape.
  async function handleCheckOut(v) {
    setMessage("");
    try {
      const now = new Date();
      await updateDocument("visitors", v.id, {
        visitorName: v.visitorName || "",
        purpose: v.purpose || "",
        idProof: v.idProof || "",
        phone: v.phone || "",
        inTime: v.inTime || "",
        inTimeSort: inSortKey(v),
        outTime: timeLabel(now),
        outTimeSort: now.toISOString(),
        status: "Checked out",
        ...(v.recordedBy ? {} : { recordedBy: guardName }),
        checkedOutBy: guardName,
      });
    } catch (err) {
      console.error("Failed to check out visitor:", err);
      setMessage("Couldn't check out this visitor. Please try again.");
    }
  }

  // Downloads the WHOLE register straight from Firestore (not the rows on
  // screen), oldest first, so it always matches the stored history.
  async function handleDownload() {
    setDownloading(true);
    setMessage("");
    try {
      const all = await getCollection("visitors");
      if (all.length === 0) {
        setMessage("There are no visitor records to download yet.");
        return;
      }
      downloadTextFile(toCsvText([...all].sort(byOldestFirst), CSV_COLUMNS), "visitor-register.csv");
    } catch (err) {
      console.error("Failed to download visitor register:", err);
      setMessage("Couldn't download the visitor register. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Check in a visitor">
        <form onSubmit={handleCheckIn} className="grid gap-4 sm:grid-cols-2">
          <Field label="Visitor name">
            <input value={form.visitorName} onChange={(e) => set("visitorName", e.target.value)} placeholder="Full name" className={inputCls} />
          </Field>
          <Field label="Purpose">
            <select value={form.purpose} onChange={(e) => set("purpose", e.target.value)} className={inputCls}>
              {VISITOR_PURPOSES.map((p) => (
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
            <Button type="submit" disabled={submitting}>
              <UserPlusIcon /> {submitting ? "Checking in…" : "Check in"}
            </Button>
          </div>
        </form>
      </Card>

      <Card
        title="Visitor log"
        action={
          <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={handleDownload} disabled={visitorsQuery.loading || downloading}>
            {downloading ? "Preparing…" : "Download Visitor Register"}
          </Button>
        }
      >
        {message && <p className="mb-3 text-sm text-red-600">{message}</p>}
        {visitorsQuery.loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : visitorsQuery.isEmpty ? (
          <EmptyState icon={<UserPlusIcon />} title="No visitors logged yet" description="Visitors you check in will show up here." />
        ) : (
          <div className="flex flex-col gap-3">
            {visitors.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{v.visitorName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{v.purpose}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {v.idProof}{v.phone ? ` · ${v.phone}` : ""} · In: {v.inTime}
                    {v.outTime ? ` · Out: ${v.outTime}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Pill tone={v.outTime ? "Resolved" : "Pending"}>{statusOf(v)}</Pill>
                  {!v.outTime && (
                    <Button variant="outline" onClick={() => handleCheckOut(v)}>
                      <LogOutIcon /> Check out
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
