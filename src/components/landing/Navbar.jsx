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
    <header className="navbar">
      {/* Utility masthead — matches the sign-in page's official-portal strip */}
      <div className="masthead">
        <span>Government College of Engineering, Keonjhar — Official Portal</span>
        <span className="masthead-links">
          <span>AICTE Approved</span>
          <span className="masthead-sep" aria-hidden="true" />
          <span>BPUT Affiliated</span>
          <span className="masthead-sep" aria-hidden="true" />
          <span>NAAC Accredited</span>
        </span>
      </div>

      <div className="navbar-main">
        <div className="navbar-inner">
          <a href="#home" className="brand">
            <span className="brand-crest">
              <img src={collegeLogo} alt="GCE Keonjhar crest" />
            </span>
            <span>
              <span className="brand-title">GCE Keonjhar</span>
              <span className="brand-sub">Smart Hostel Portal</span>
            </span>
          </a>

          <nav className="nav-links">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="navbar-actions">
            <Link to="/login" className="btn btn-white navbar-login">
              Login
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="menu-toggle"
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
          <div className="mobile-nav">
            <nav>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="mobile-nav-link"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/login" className="btn btn-white btn-block" style={{ marginTop: 8 }}>
                Login
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
