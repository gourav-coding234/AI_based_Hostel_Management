import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer id="contact" className="bg-ink py-14 text-slate-400">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 font-display text-base font-semibold text-teal-400">
                G
              </span>
              <span className="font-display text-base font-semibold text-white">GCE Keonjhar</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Government College of Engineering, Keonjhar — Hostel Administration Office.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-white">Quick links</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#notices" className="hover:text-white">Notices</a></li>
              <li><a href="#facilities" className="hover:text-white">Facilities</a></li>
              <li><a href="#gallery" className="hover:text-white">Gallery</a></li>
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-white">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>GCE Keonjhar Campus, Odisha, India</li>
              <li>hostel.office@gcekjr.ac.in</li>
              <li>+91 00000 00000</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs">
          © {new Date().getFullYear()} GCE Keonjhar Hostel Management. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
