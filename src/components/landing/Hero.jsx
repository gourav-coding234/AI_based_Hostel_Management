import { Link } from "react-router-dom";
import campusPhoto from "../../assets/leadership/gce-keonjhar-campus.jpeg";

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

        <div className="hero-campus">
          <img src={campusPhoto} alt="Government College of Engineering, Keonjhar campus among the surrounding hills" />
          <div className="hero-campus-caption">
            <span className="hero-campus-mark" aria-hidden="true" />
            <span><strong>Our campus</strong><br />Jamunalia, Keonjhar, Odisha</span>
          </div>
        </div>
      </div>
    </section>
  );
}
