import { useCollection } from "../../hooks/useCollection";

// Reads the real `notices` collection, restricted to documents an admin has
// flagged with `isPublic: true`. That subset is readable without signing in
// (see the `notices` rule in firestore.rules), which is what lets this
// section work on the public landing page.
//
// Nothing here is fabricated: an empty or unreachable collection renders an
// honest empty/error state rather than sample rows.

const PRIORITY_TAG = {
  Urgent: "Urgent",
  Event: "Event",
  General: "Notice",
};

/** Notices posted within the last 14 days get the "New" flag. */
const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function isRecent(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() < NEW_WINDOW_MS;
}

export default function NoticeBoard() {
  const { data, loading, error } = useCollection("notices", {
    where: [["isPublic", "==", true]],
    orderByField: "date",
    orderByDirection: "desc",
    limitCount: 5,
  });

  return (
    <section id="notices" className="section on-paper">
      <div className="section-inner">
        <div className="section-head">
          <div>
            <span className="section-label">Stay informed</span>
            <h2 className="section-title">Notice board</h2>
          </div>
          <p className="section-note">
            The latest updates from the hostel office. Sign in to see the full history and
            block-specific notices.
          </p>
        </div>

        {loading && <p className="notice-state">Loading notices…</p>}

        {!loading && error && (
          <p className="notice-state">
            Notices are unavailable right now. Please check the hostel notice board or contact the
            office.
          </p>
        )}

        {!loading && !error && data.length === 0 && (
          <p className="notice-state">
            No public notices have been posted yet. Sign in to view notices for your block.
          </p>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="notice-list">
            {data.map((notice) => (
              <article key={notice.id} className="notice-item">
                <time className="notice-date" dateTime={notice.date}>
                  {formatDate(notice.date)}
                </time>
                <span className="notice-title">
                  {notice.title}
                  {isRecent(notice.date) && <span className="badge-new">New</span>}
                </span>
                <span className="notice-tag">
                  {PRIORITY_TAG[notice.priority] || notice.target || "Notice"}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
