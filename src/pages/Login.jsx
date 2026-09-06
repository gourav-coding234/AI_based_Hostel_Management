import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signIn, signOut, friendlyAuthError } from "../firebase/auth";
import { getUserProfile } from "../firebase/firestore";
import { ROLE_LIST, dashboardPathForRole } from "../roles";
import collegeLogo from "../assets/college-logo-circle.png";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(ROLE_LIST[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Track whether Firebase Auth ended up with a live session for this
    // attempt, so every exit path below can guarantee it's cleaned up if
    // the login doesn't fully succeed. Selected role is UI state only —
    // it is never trusted on its own and never sent anywhere as identity.
    let signedIn = false;

    try {
      const credential = await signIn(email.trim(), password);
      signedIn = true;

      // The account's real role is read fresh from Firestore — the
      // trusted, server-side source of truth — never from the role button
      // the person clicked, localStorage, or the URL.
      const profile = await getUserProfile(credential.user.uid);

      if (!profile) {
        await signOut();
        setError("No profile found for this account. Contact the hostel admin.");
        setSubmitting(false);
        return;
      }

      if (profile.role !== role) {
        // Selected role does not match the account's actual role: reject
        // outright. No session is left behind and no dashboard is reached
        // — sign back out immediately rather than "helpfully" redirecting.
        await signOut();
        setError(
          `Incorrect role selected. Your account is registered as ${profile.role}. Please select ${profile.role} and try again.`
        );
        setSubmitting(false);
        return;
      }

      const redirectTo = location.state?.from?.pathname ?? dashboardPathForRole(profile.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (signedIn) {
        // Authenticated but something after that failed (e.g. the profile
        // lookup threw) — don't leave a dangling session on a failed login.
        await signOut().catch(() => {});
      }
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Utility masthead — navy, matches the institute's official-portal header */}
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

      <div className="auth-body">
        {/* Showcase panel */}
        <div className="auth-showcase">
          <div className="auth-showcase-shape" aria-hidden="true" />

          <div className="auth-crest-wrap">
            <span className="auth-crest">
              <img src={collegeLogo} alt="GCE Keonjhar crest" />
            </span>
            <h1 className="auth-college-name">
              Government College of
              <br />
              Engineering, Keonjhar
            </h1>
            <p className="auth-motto">
              ଜ୍ଞାନମ୍ ଅନନ୍ତମ୍ &nbsp;·&nbsp; ज्ञानम् अनन्तम्
            </p>
            <p className="auth-address">Jamunalia, Old Town, Keonjhar – 758002, Odisha</p>

            <div className="auth-tags">
              {["Estd. 1995", "AICTE Approved", "BPUT Affiliated"].map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>

            <div className="auth-rule" aria-hidden="true" />
          </div>

          <p className="auth-copyright">
            © {new Date().getFullYear()} Government College of Engineering, Keonjhar. All rights reserved.
          </p>
        </div>

        {/* Form panel */}
        <div className="auth-form-panel">
          <div className="auth-form">
            <Link to="/" className="back-link mobile-only">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12.5 15 7.5 10l5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Main Website
            </Link>

            {/* Crest shown up top on mobile, where the showcase panel is hidden */}
            <div className="mobile-brand">
              <span className="mobile-brand-crest">
                <img src={collegeLogo} alt="GCE Keonjhar crest" />
              </span>
              <span>
                <span className="mobile-brand-name">GCE Keonjhar</span>
                <span className="mobile-brand-sub">Official Portal</span>
              </span>
            </div>

            <p className="auth-eyebrow">Secure Access</p>
            <h2 className="auth-heading">Sign in</h2>
            <p className="auth-sub">Choose your role and enter your credentials to continue.</p>

            {/* Role selector */}
            <div className="role-grid">
              {ROLE_LIST.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`role-btn ${role === r ? "is-active" : ""}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="auth-fields">
              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gcekjr.ac.in"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
                {submitting ? "Signing in…" : `Sign in as ${role}`}
              </button>
            </form>

            <p className="help-box">
              Need help? Contact the college office at{" "}
              <a href="mailto:principal@gcekjr.ac.in">principal@gcekjr.ac.in</a> or call{" "}
              <strong>06766-213180</strong>.
            </p>

            <Link to="/" className="back-link desktop-only">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12.5 15 7.5 10l5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Main Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
