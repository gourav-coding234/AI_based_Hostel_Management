const FACILITIES = [
  {
    title: "Furnished rooms",
    desc: "Shared and single-occupancy rooms with beds, study tables, and wardrobes.",
    icon: (
      <path d="M3 10.5 12 4l9 6.5M5 9.5V19h5v-5h4v5h5V9.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Dining & mess",
    desc: "Hygienic dining hall with a rotating weekly menu and dietary options.",
    icon: <path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M17 3v18M14 8h6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Campus-wide Wi-Fi",
    desc: "High-speed internet across rooms, study halls, and common areas.",
    icon: (
      <path d="M2 8.5a16 16 0 0 1 20 0M5.5 12a11 11 0 0 1 13 0M9 15.5a6 6 0 0 1 6 0M12 19h.01" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Laundry service",
    desc: "Scheduled laundry pickup and drop-off for every block.",
    icon: <path d="M4 4h16v16H4zM8 4v2M16 4v2M12 15a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Gym & recreation",
    desc: "In-house fitness room plus indoor games for downtime.",
    icon: (
      <path d="M6 7v10M18 7v10M2 9v6M22 9v6M6 12h12" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Medical room",
    desc: "First-aid and an on-call doctor for routine and emergency needs.",
    icon: <path d="M12 3v18M3 12h18" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "24×7 security",
    desc: "Manned gates, CCTV coverage, and logged visitor and gate-pass entries.",
    icon: (
      <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Study hall",
    desc: "Quiet, well-lit space for focused study, open late into the evening.",
    icon: (
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v19H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default function Facilities() {
  return (
    <section id="facilities" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
          What's on campus
        </span>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Facilities built for hostel life
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FACILITIES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 p-6 transition-colors hover:border-teal-400/50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-950 text-teal-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  {f.icon}
                </svg>
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
