import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ title, onMenuClick }) {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const displayName = profile?.name ?? user?.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-ink lg:hidden"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {profile?.role && (
          <span className="hidden rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 sm:inline-block">
            {profile.role}
          </span>
        )}
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-950 text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="hidden text-sm font-medium text-ink sm:inline">{displayName}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
