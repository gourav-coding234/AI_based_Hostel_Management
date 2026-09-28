import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Pill, Button } from "../../../components/dashboard/student/ui";
import { AsyncSection } from "../../../components/ui/DataState";
import { MegaphoneIcon } from "../../../components/dashboard/parent/icons";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import { useCollection } from "../../../hooks/useCollection";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";
import { useParentNotifications } from "../../../hooks/useParentNotifications";
import { noticeAppliesTo } from "../../../utils/notices";
import { inr, notificationToNotice } from "./parentData";

// `date` is normally a "YYYY-MM-DD" string, but imported/older records may hold
// other formats or a Firestore Timestamp. Normalise to epoch millis for sorting
// and to a plain string for display (never render a raw object).
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

// Newest first by real date; on the same day Urgent comes first, then the most
// recently created.
function compareNotices(a, b) {
  const byDate = sortKey(b) - sortKey(a);
  if (byDate !== 0) return byDate;
  const urgent = (n) => (String(n.priority).toLowerCase() === "urgent" ? 1 : 0);
  if (urgent(b) !== urgent(a)) return urgent(b) - urgent(a);
  return toMillis(b.createdAt) - toMillis(a.createdAt);
}

// Read-only view: parents can read notices but have no create/edit/delete
// controls. Admin and Warden manage the shared `notices` collection.
export default function ParentNotices() {
  const linked = useLinkedStudent();
  const { studentUser } = linked;
  // No orderBy on the query: Firestore silently drops documents that lack the
  // ordered field, which would hide notices with a missing date. Sorted below.
  const noticesQuery = useCollection("notices");
  // Messages sent by the warden to THIS parent account only (fee reminders,
  // leave decisions) — shown in the same list, same card style. Rules
  // restrict this query to notifications addressed to the signed-in parent.
  const notifications = useParentNotifications();
  const [openId, setOpenId] = useState(null);

  const status = <LinkedStudentStatus {...linked} />;
  if (status) return status;

  const filteredNotices = [
    ...notifications.data.map(notificationToNotice),
    ...noticesQuery.data.filter((n) => noticeAppliesTo(n.target, linked.studentRecord?.wing || studentUser?.hostelResidence)),
  ].sort(compareNotices);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <MegaphoneIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Notice board</p>
              <p className="text-sm text-slate-500">Published by the warden and hostel admin.</p>
            </div>
          </div>
          {notifications.unreadCount > 0 && (
            <div className="flex items-center gap-3">
              <Pill tone="Pending">{notifications.unreadCount} unread</Pill>
              <Button variant="outline" onClick={notifications.markAllRead}>Mark all as read</Button>
            </div>
          )}
        </div>
        {notifications.markError && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{notifications.markError}</p>}
      </Card>

      <AsyncSection
        loading={noticesQuery.loading || notifications.loading}
        error={noticesQuery.error || notifications.error}
        isEmpty={filteredNotices.length === 0}
        emptyTitle="No notices yet"
        emptyDescription="Notices posted by the warden or admin office will show up here."
        emptyIcon={<MegaphoneIcon />}
      >
        <div className="flex flex-col gap-3">
          {filteredNotices.map((n) => {
            const open = openId === n.id;
            const unread = n.personal && !n.read;
            const dateText = displayDate(n);
            const priority = n.priority || "General";
            return (
              <div key={n.id} className="rounded-2xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : n.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                >
                  <div className="min-w-0">
                    <p className={`truncate text-sm text-ink ${unread ? "font-bold" : "font-semibold"}`}>{n.title || "Untitled notice"}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{[n.postedBy || "Hostel office", dateText].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {unread && <Pill tone="Pending">Unread</Pill>}
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
                  <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:px-6">
                    <p className="whitespace-pre-wrap break-words">{n.body || "No details provided."}</p>
                    {n.type === "Fee Reminder" && (
                      <p className="text-xs text-slate-400">
                        Amount due: <span className="font-semibold text-ink">{inr(n.amountDue)}</span>
                        {n.dueDate ? <> · Due date: <span className="font-semibold text-ink">{n.dueDate}</span></> : null}
                      </p>
                    )}
                    {n.personal && (
                      <div className="flex flex-wrap items-center gap-4">
                        {n.type === "Fee Reminder" && (
                          <Link to="/dashboard/parent/fees" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                            View fees →
                          </Link>
                        )}
                        {n.type === "Leave Update" && (
                          <Link to="/dashboard/parent/gate-pass" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                            View leave requests →
                          </Link>
                        )}
                        {unread && (
                          <Button variant="outline" onClick={() => notifications.markRead(n.notificationId)}>
                            Mark as read
                          </Button>
                        )}
                      </div>
                    )}
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
