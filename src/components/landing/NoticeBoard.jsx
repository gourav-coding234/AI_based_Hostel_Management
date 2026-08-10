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
  },
  {
    id: "n2",
    title: "Mess menu revised — new weekly schedule posted on the board",
    date: "10 Aug 2026",
    tag: "Mess",
  },
  {
    id: "n3",
    title: "Fire safety drill scheduled for all blocks this Saturday, 10 AM",
    date: "08 Aug 2026",
    tag: "Safety",
  },
  {
    id: "n4",
    title: "Gate pass requests must be submitted 24 hours in advance",
    date: "05 Aug 2026",
    tag: "Security",
  },
];

const TAG_STYLES = {
  Admin: "bg-teal-500/10 text-teal-700",
  Mess: "bg-amber-500/10 text-amber-700",
  Safety: "bg-rose-500/10 text-rose-700",
  Security: "bg-navy-700/10 text-navy-800",
};

export default function NoticeBoard() {
  return (
    <section id="notices" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              Stay informed
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
              Notice board
            </h2>
          </div>
          <p className="max-w-sm text-sm text-slate-500">
            The latest updates from the hostel office. Sign in to see the full history and
            block-specific notices.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SAMPLE_NOTICES.map((notice) => (
            <article
              key={notice.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-soft"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    TAG_STYLES[notice.tag] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {notice.tag}
                </span>
                <time className="text-xs text-slate-400">{notice.date}</time>
              </div>
              <h3 className="mt-4 font-display text-lg font-medium leading-snug text-ink">
                {notice.title}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
