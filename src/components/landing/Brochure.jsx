export default function Brochure() {
  return (
    <section id="brochure" className="bg-navy-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-white/10 bg-navy-900 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
              Planning to join?
            </span>
            <h2 className="mt-2 max-w-lg font-display text-2xl font-semibold sm:text-3xl">
              Download the hostel brochure for fees, rules, and room details
            </h2>
            <p className="mt-3 max-w-md text-sm text-slate-400">
              Everything you need before move-in — room types, mess charges, visiting hours, and
              the code of conduct.
            </p>
          </div>

          {/* TODO: replace with the real brochure PDF at /public/brochure.pdf */}
          <a
            href="/brochure.pdf"
            download
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-navy-950 shadow-soft transition-colors hover:bg-slate-100"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16.5h12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download brochure
          </a>
        </div>
      </div>
    </section>
  );
}
