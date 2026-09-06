import { useAuth } from "../../context/AuthContext";
import SearchBar from "./SearchBar";
import NotificationMenu from "./NotificationMenu";
import UserMenu from "./UserMenu";

const MENU_ICON = (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
  </svg>
);

const SUN_ICON = (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
    <circle cx="10" cy="10" r="3.4" />
    <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" strokeLinecap="round" />
  </svg>
);

const MOON_ICON = (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M16.5 12.3A6.8 6.8 0 0 1 7.7 3.5 6.8 6.8 0 1 0 16.5 12.3Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Topbar({ title, onMenuClick, theme, onToggleTheme }) {
  const { profile } = useAuth();
  const role = profile?.role;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" onClick={onMenuClick} className="menu-btn" aria-label="Open menu">
          {MENU_ICON}
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-right">
        {role && <SearchBar role={role} />}
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? SUN_ICON : MOON_ICON}
        </button>
        {role && <NotificationMenu role={role} />}
        <UserMenu />
      </div>
    </header>
  );
}
