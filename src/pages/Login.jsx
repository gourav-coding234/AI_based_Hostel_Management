import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signIn, friendlyAuthError } from "../firebase/auth";
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

    try {
      const credential = await signIn(email.trim(), password);
      const profile = await getUserProfile(credential.user.uid);

      if (!profile) {
        setError("No profile found for this account. Contact the hostel admin.");
        setSubmitting(false);
        return;
      }

      if (profile.role !== role) {
        setError(
          `This account is registered as ${profile.role}, not ${role}. Redirecting you to the right dashboard…`
        );
        setTimeout(() => navigate(dashboardPathForRole(profile.role), { replace: true }), 1200);
        return;
      }

      const redirectTo = location.state?.from?.pathname ?? dashboardPathForRole(profile.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Utility masthead — navy, matches the institute's official-portal header */}
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

      <div className="grid flex-1 lg:grid-cols-2">
        {/* Showcase panel */}
        <div className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-[380px] w-[380px] rounded-full bg-white/5 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-center text-center">
            <span className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white shadow-soft">
              <img src={collegeLogo} alt="GCE Keonjhar crest" className="h-full w-full object-contain" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-semibold leading-tight">
              Government College of
              <br />
              Engineering, Keonjhar
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              ଜ୍ଞାନମ୍ ଅନନ୍ତମ୍ &nbsp;·&nbsp; ज्ञानम् अनन्तम्
            </p>
            <p className="mt-1 text-xs text-slate-500">Jamunalia, Old Town, Keonjhar – 758002, Odisha</p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["Estd. 1995", "AICTE Approved", "BPUT Affiliated"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-medium tracking-wide text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6 h-0.5 w-10 rounded-full bg-red-600" aria-hidden="true" />
          </div>

          <p className="relative text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Government College of Engineering, Keonjhar. All rights reserved.
          </p>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center px-5 py-16 sm:px-8">
          <div className="w-full max-w-sm">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-ink lg:hidden">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12.5 15 7.5 10l5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Main Website
            </Link>

            {/* Crest shown up top on mobile, where the showcase panel is hidden */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <img src={collegeLogo} alt="GCE Keonjhar crest" className="h-full w-full object-contain" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-ink">GCE Keonjhar</span>
                <span className="block text-[11px] uppercase tracking-[0.15em] text-slate-400">
                  Official Portal
                </span>
              </span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Secure Access</p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink">Sign in</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Choose your role and enter your credentials to continue.
            </p>

            {/* Role selector */}
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {ROLE_LIST.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                    role === r
                      ? "border-navy-900 bg-navy-950 text-white"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/15"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-800/15"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-navy-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Signing in…" : `Sign in as ${role}`}
              </button>
            </form>

            <p className="mt-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
              Need help? Contact the college office at{" "}
              <a href="mailto:principal@gcekjr.ac.in" className="font-medium text-navy-900 hover:underline">
                principal@gcekjr.ac.in
              </a>{" "}
              or call <span className="font-medium text-navy-900">06766-213180</span>.
            </p>

            <Link
              to="/"
              className="mt-6 hidden items-center gap-2 text-sm text-slate-500 hover:text-ink lg:inline-flex"
            >
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
