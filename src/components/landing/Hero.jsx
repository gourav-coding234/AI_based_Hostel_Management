import { Link } from "react-router-dom";
import collegeLogo from "../../assets/college-logo-circle.png";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-navy-950 text-white">
      <div className="absolute inset-x-0 top-0 h-1 bg-red-600" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
            AI-based Smart Hostel Management
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            One portal for every hostel resident at{" "}
            <span className="text-white underline decoration-red-600 decoration-4 underline-offset-4">
              GCE Keonjhar
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Notices, attendance, fees, gate passes, and room allocation — all in one place, built
            for students, parents, wardens, security staff, and hostel administrators alike.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-navy-950 shadow-soft transition-colors hover:bg-slate-100"
            >
              Login to your dashboard
            </Link>
            <a
              href="#facilities"
              className="rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white/40"
            >
              Explore facilities
            </a>
          </div>
        </div>

        {/* Dashboard-preview illustration — replaces the old placeholder image */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-0 -rotate-3 rounded-3xl bg-white/5" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white shadow-soft">
            {/* Mock window bar */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="ml-3 flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                <img src={collegeLogo} alt="" className="h-full w-full object-contain" />
              </span>
              <span className="text-xs font-semibold text-slate-500">Hostel Portal</span>
            </div>

            <div className="grid grid-cols-[80px_1fr]">
              {/* Mini sidebar */}
              <div className="space-y-2 border-r border-slate-100 bg-slate-50 p-3">
                <div className="h-2 w-10 rounded-full bg-navy-800" />
                <div className="h-2 w-8 rounded-full bg-slate-200" />
                <div className="h-2 w-9 rounded-full bg-slate-200" />
                <div className="h-2 w-7 rounded-full bg-slate-200" />
              </div>

              {/* Mock content */}
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-24 rounded-full bg-navy-900" />
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    New
                  </span>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                    <div className="h-6 w-6 shrink-0 rounded-md bg-navy-950" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-slate-200" />
                      <div className="h-1.5 w-2/3 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-navy-950 px-3 py-2">
                    <div className="h-2 w-8 rounded-full bg-white/70" />
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="h-2 w-10 rounded-full bg-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
