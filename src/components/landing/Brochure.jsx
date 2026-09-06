export default function Brochure() {
  return (
    <section id="brochure" className="section on-navy">
      <div className="section-inner">
        <div className="brochure-panel">
          <div>
            <span className="section-label">Planning to join?</span>
            <h2 className="brochure-title">
              Download the hostel brochure for fees, rules, and room details
            </h2>
            <p className="brochure-desc">
              Everything you need before move-in — room types, mess charges, visiting hours, and
              the code of conduct.
            </p>
          </div>

          {/* TODO: replace with the real brochure PDF at /public/brochure.pdf */}
          <a href="/brochure.pdf" download className="btn btn-white">
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
