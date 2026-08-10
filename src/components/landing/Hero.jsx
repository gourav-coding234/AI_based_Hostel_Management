import { Link } from "react-router-dom";
import heroImg from "../../assets/hero.png";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-navy-950 text-white">
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-teal-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300">
            AI-based Smart Hostel Management
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            One portal for every hostel resident at{" "}
            <span className="text-teal-400">GCE Keonjhar</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Notices, attendance, fees, gate passes, and room allocation — all in one place, built
            for students, parents, wardens, security staff, and hostel administrators alike.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="rounded-full bg-teal-500 px-7 py-3 text-sm font-semibold text-navy-950 shadow-soft transition-colors hover:bg-teal-400"
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

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-0 -rotate-3 rounded-3xl bg-teal-500/10" aria-hidden="true" />
          <img
            src={heroImg}
            alt=""
            className="relative w-full rounded-3xl border border-white/10 bg-navy-900 object-cover shadow-soft"
          />
        </div>
      </div>
    </section>
  );
}
