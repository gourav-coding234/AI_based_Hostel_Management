import { Link } from "react-router-dom";
import collegeLogo from "../../assets/college-logo-circle.png";

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-inner">
        <div>
          <span className="hero-tag">AI-based Smart Hostel Management</span>
          <h1 className="hero-title">
            One portal for every hostel resident at{" "}
            <span className="accent">GCE Keonjhar</span>
          </h1>
          <p className="hero-desc">
            Notices, attendance, fees, gate passes, and room allocation — all in one place, built
            for students, parents, wardens, security staff, and hostel administrators alike.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-white">
              Login to your dashboard
            </Link>
            <a href="#facilities" className="btn btn-outline-white">
              Explore facilities
            </a>
          </div>
        </div>

        {/* Dashboard-preview illustration — a mocked-up window, not a live screenshot */}
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-titlebar">
              <span className="preview-dot" style={{ background: "#c94238" }} />
              <span className="preview-dot" style={{ background: "#d9a441" }} />
              <span className="preview-dot" style={{ background: "#c7c4b8" }} />
              <span className="preview-crest">
                <img src={collegeLogo} alt="" />
              </span>
              <span className="preview-label">Hostel Portal</span>
            </div>

            <div className="preview-body">
              <div className="preview-nav">
                <div className="preview-bar is-active" style={{ width: 40 }} />
                <div className="preview-bar" style={{ width: 32 }} />
                <div className="preview-bar" style={{ width: 36 }} />
                <div className="preview-bar" style={{ width: 28 }} />
              </div>

              <div className="preview-content">
                <div className="preview-row">
                  <div className="preview-heading" />
                  <span className="preview-flag">New</span>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="preview-tile">
                    <div className="preview-tile-icon" />
                    <div className="preview-tile-lines">
                      <div className="preview-line" />
                      <div className="preview-line is-short" />
                    </div>
                  </div>
                ))}
                <div className="preview-stats">
                  <div className="preview-stat is-dark">
                    <div className="preview-line" style={{ width: 32 }} />
                  </div>
                  <div className="preview-stat is-light">
                    <div className="preview-line" style={{ width: 40, background: "var(--border-strong)" }} />
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
