import { Link } from "react-router-dom";
import collegeLogo from "../../assets/college-logo-circle.png";

export default function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="section-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-brand-row">
              <span className="footer-crest">
                <img src={collegeLogo} alt="GCE Keonjhar crest" />
              </span>
              <span className="footer-brand-name">GCE Keonjhar</span>
            </div>
            <p className="footer-about">
              Government College of Engineering, Keonjhar — Hostel Administration Office.
            </p>
          </div>

          <div>
            <h4 className="footer-heading">Quick links</h4>
            <ul className="footer-links">
              <li><a href="#notices">Notices</a></li>
              <li><a href="#facilities">Facilities</a></li>
              <li><a href="#gallery">Gallery</a></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-links">
              <li>Jamunalia, Old Town, Keonjhar – 758002, Odisha</li>
              <li>principal@gcekjr.ac.in</li>
              <li>06766-213180</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} GCE Keonjhar Hostel Management. All rights reserved.</span>
          <span className="accent">A constituent college of Biju Patnaik University of Technology</span>
        </div>
      </div>
    </footer>
  );
}
