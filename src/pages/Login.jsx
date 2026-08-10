import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signIn, friendlyAuthError } from "../firebase/auth";
import { getUserProfile } from "../firebase/firestore";
import { ROLE_LIST, dashboardPathForRole } from "../roles";

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
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Showcase panel */}
      <div className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-[380px] w-[380px] rounded-full bg-teal-500/20 blur-3xl"
          aria-hidden="true"
        />
        <Link to="/" className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/15 font-display text-lg font-semibold text-teal-400">
            G
          </span>
          <span className="font-display text-base font-semibold">GCE Keonjhar</span>
        </Link>

        <div className="relative">
          <h1 className="max-w-md font-display text-3xl font-semibold leading-tight">
            Everything about hostel life, in one sign-in.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-slate-400">
            Students, parents, wardens, security staff, and admins each get a dashboard built for
            what they need to do.
          </p>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} GCE Keonjhar Hostel Management
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-ink lg:hidden">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12.5 15 7.5 10l5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>

          <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1.5 text-sm text-slate-500">Choose your role and enter your credentials.</p>

          {/* Role selector */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {ROLE_LIST.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                  role === r
                    ? "border-teal-500 bg-teal-500/10 text-teal-700"
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
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-navy-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : `Sign in as ${role}`}
            </button>
          </form>

          <Link
            to="/"
            className="mt-6 hidden items-center gap-2 text-sm text-slate-500 hover:text-ink lg:inline-flex"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12.5 15 7.5 10l5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
