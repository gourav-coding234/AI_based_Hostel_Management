// TODO: wire to Firestore public notices — the `notices` collection currently
// requires an authenticated read (see firestore.rules). Either add a public
// rule for a `visibility: "public"` subset, or serve this via a Cloud
// Function, then swap this static array for a getCollection("notices", {...}) call.
const SAMPLE_NOTICES = [
  {
    id: "n1",
    title: "Hostel re-registration for the new semester opens Monday",
    date: "12 Aug 2026",
    tag: "Admin",
    isNew: true,
  },
  {
    id: "n2",
    title: "Mess menu revised — new weekly schedule posted on the board",
    date: "10 Aug 2026",
    tag: "Mess",
    isNew: true,
  },
  {
    id: "n3",
    title: "Fire safety drill scheduled for all blocks this Saturday, 10 AM",
    date: "08 Aug 2026",
    tag: "Safety",
    isNew: false,
  },
  {
    id: "n4",
    title: "Gate pass requests must be submitted 24 hours in advance",
    date: "05 Aug 2026",
    tag: "Security",
    isNew: false,
  },
];

export default function NoticeBoard() {
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

        <div className="notice-list">
          {SAMPLE_NOTICES.map((notice) => (
            <a key={notice.id} href="#notices" className="notice-item">
              <time className="notice-date">{notice.date}</time>
              <span className="notice-title">
                {notice.title}
                {notice.isNew && <span className="badge-new">New</span>}
              </span>
              <span className="notice-tag">{notice.tag}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
