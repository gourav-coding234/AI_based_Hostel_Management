import { useState } from "react";
import { Link } from "react-router-dom";
import collegeLogo from "../../assets/college-logo-circle.png";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Notices", href: "#notices" },
  { label: "Facilities", href: "#facilities" },
  { label: "Gallery", href: "#gallery" },
  { label: "Brochure", href: "#brochure" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Utility masthead — matches the sign-in page's official-portal strip */}
      <div className="hidden items-center justify-between border-b border-navy-800 bg-navy-950 px-6 py-2 text-[11px] text-slate-300 sm:flex">
        <span>Government College of Engineering, Keonjhar — Official Portal</span>
        <span className="flex items-center gap-4">
          <span>AICTE Approved</span>
          <span className="h-3 w-px bg-white/15" aria-hidden="true" />
          <span>BPUT Affiliated</span>
          <span className="h-3 w-px bg-white/15" aria-hidden="true" />
          <span>NAAC Accredited</span>
        </span>
      </div>

      <div className="border-b border-navy-800 bg-navy-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <a href="#home" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
              <img src={collegeLogo} alt="GCE Keonjhar crest" className="h-full w-full object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold text-white">
                GCE Keonjhar
              </span>
              <span className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Smart Hostel Portal
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-full bg-white px-5 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-slate-100 sm:inline-block"
            >
              Login
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                {open ? (
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                ) : (
                  <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-white/10 bg-navy-950 px-5 pb-5 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/login"
                className="mt-2 rounded-full bg-white px-5 py-2.5 text-center text-sm font-semibold text-navy-950"
              >
                Login
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
