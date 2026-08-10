import { Link } from "react-router-dom";
import collegeLogo from "../../assets/college-logo-circle.png";

export default function Footer() {
  return (
    <footer id="contact" className="bg-navy-950 py-14 text-slate-400">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
                <img src={collegeLogo} alt="GCE Keonjhar crest" className="h-full w-full object-contain" />
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
              <li>Jamunalia, Old Town, Keonjhar – 758002, Odisha</li>
              <li>principal@gcekjr.ac.in</li>
              <li>06766-213180</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} GCE Keonjhar Hostel Management. All rights reserved.</span>
          <span className="text-red-500/80">A constituent college of Biju Patnaik University of Technology</span>
        </div>
      </div>
    </footer>
  );
}
