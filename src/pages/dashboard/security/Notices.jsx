import { useState } from "react";
import { Card, Pill } from "../../../components/dashboard/student/ui";
import { AsyncSection } from "../../../components/ui/DataState";
import { MegaphoneIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";

// --- Audience targeting -----------------------------------------------------
// Notices carry a free-text `target` (Admin: "All Hostels", "A Wing"...;
// Warden: "All Wings", "A Wing"...). There is no per-role audience field, so
// Security sees a notice unless its target explicitly names a different
// audience and does not include Security. Wing notices stay visible because
// gate staff cover every wing. When in doubt, the notice is shown.
const SECURITY_RE = /\b(security|guards?|gate|watchmen|watchman)\b/i;
const UNRELATED_AUDIENCE_RE = /\b(students?|parents?|guardians?|wardens?|mess|kitchen|canteen|housekeeping|faculty|teachers?|accounts?|fees?)\b/i;

function noticeAppliesToSecurity(target) {
  const t = String(target ?? "").trim();
  if (!t) return true; // no targeting -> institution-wide
  if (/^all\b/i.test(t)) return true; // "All Hostels" / "All Wings" / "All"
  if (SECURITY_RE.test(t)) return true; // explicitly for security
  return !UNRELATED_AUDIENCE_RE.test(t); // hide only if clearly for someone else
}

// --- Dates ------------------------------------------------------------------
// `date` is normally a "YYYY-MM-DD" string, but CSV imports / older records may
// hold other formats or a Firestore Timestamp. Normalise to epoch millis for
// sorting, and to a display string for rendering (never render a raw object).
function toMillis(value) {
  if (value == null || value === "") return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime() || 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function displayDate(n) {
  if (typeof n.date === "string" && n.date.trim()) return n.date.trim();
  const ms = toMillis(n.date) || toMillis(n.createdAt);
  return ms ? new Date(ms).toISOString().slice(0, 10) : "";
}

function sortKey(n) {
  return toMillis(n.date) || toMillis(n.createdAt);
}

function compareNotices(a, b) {
  const byDate = sortKey(b) - sortKey(a);
  if (byDate !== 0) return byDate;
  // Same day: urgent first, then most recently created.
  const urgent = (n) => (String(n.priority).toLowerCase() === "urgent" ? 1 : 0);
  if (urgent(b) !== urgent(a)) return urgent(b) - urgent(a);
  return toMillis(b.createdAt) - toMillis(a.createdAt);
}

// Read-only view: Security can read notices but has no create/edit/delete
// controls. Admin and Warden manage notices in the shared `notices` collection.
export default function SecurityNotices() {
  // No orderBy here: Firestore silently drops documents that lack the ordered
  // field, which would hide notices with a missing date. Sorting is done below.
  const noticesQuery = useCollection("notices");
  const notices = noticesQuery.data.filter((n) => noticeAppliesToSecurity(n.target)).sort(compareNotices);
  const [openId, setOpenId] = useState(null);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <MegaphoneIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Notice board</p>
            <p className="text-sm text-slate-500">Published by the warden and hostel admin.</p>
          </div>
        </div>
      </Card>

      <AsyncSection
        loading={noticesQuery.loading}
        error={noticesQuery.error}
        isEmpty={notices.length === 0}
        emptyTitle="No notices yet"
        emptyDescription="Notices posted by the warden or admin office will show up here."
        emptyIcon={<MegaphoneIcon />}
      >
        <div className="flex flex-col gap-3">
          {notices.map((n) => {
            const open = openId === n.id;
            const dateText = displayDate(n);
            const priority = n.priority || "General";
            return (
              <div
                key={n.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 transition-shadow duration-200 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : n.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{n.title || "Untitled notice"}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{[n.postedBy || "Hostel office", dateText].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Pill tone={priority}>{priority}</Pill>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    >
                      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
                {open && (
                  <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:px-6">
                    <p className="whitespace-pre-wrap break-words">{n.body || "No details provided."}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AsyncSection>
    </div>
  );
}
