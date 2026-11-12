import collegeLogo from "../../assets/gce-logo-white.png";

export default function PortalLoader({ label = "Loading hostel portal…", compact = false }) {
  return (
    <div
      className={`portal-loader ${compact ? "portal-loader-compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="portal-loader-watermark" aria-hidden="true" />
      <i className="portal-loader-spark portal-loader-spark-one" aria-hidden="true" />
      <i className="portal-loader-spark portal-loader-spark-two" aria-hidden="true" />
      <i className="portal-loader-spark portal-loader-spark-three" aria-hidden="true" />
      <i className="portal-loader-spark portal-loader-spark-four" aria-hidden="true" />
      <div className="portal-loader-card">
        <div className="portal-loader-mark" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle className="portal-loader-ring-track" cx="50" cy="50" r="46" />
            <circle className="portal-loader-ring-progress" cx="50" cy="50" r="46" />
          </svg>
          <span className="portal-loader-orbit"><i /></span>
          <span className="portal-loader-logo-disc">
            <img className="portal-loader-crest" src={collegeLogo} alt="" />
          </span>
        </div>
        <p className="portal-loader-brand">GCE Keonjhar</p>
        <h1 className="portal-loader-title">Preparing your hostel portal</h1>
        <div className="portal-loader-ornament" aria-hidden="true"><i /></div>
        <p className="portal-loader-motto">Gyanam Anantam</p>
        <p className="portal-loader-label">{label}</p>
        <div className="portal-loader-track" aria-hidden="true"><span /></div>
        <span className="portal-loader-dots" aria-hidden="true"><i /><i /><i /></span>
      </div>
    </div>
  );
}
