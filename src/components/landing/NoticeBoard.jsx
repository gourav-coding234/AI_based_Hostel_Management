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
    <section id="notices" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
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

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {SAMPLE_NOTICES.map((notice, i) => (
            <a
              key={notice.id}
              href="#notices"
              className={`flex flex-col gap-2 px-6 py-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-6 ${
                i !== 0 ? "border-t border-slate-100" : ""
              }`}
            >
              <time className="shrink-0 text-xs font-semibold uppercase tracking-wide text-navy-800 sm:w-28">
                {notice.date}
              </time>
              <span className="flex-1 text-sm font-medium text-ink sm:text-base">
                {notice.title}
                {notice.isNew && (
                  <span className="ml-2 inline-block rounded-full bg-red-600 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-white">
                    New
                  </span>
                )}
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {notice.tag}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
