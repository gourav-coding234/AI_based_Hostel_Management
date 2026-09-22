import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NAVIGATION } from "../../config/navigation";

const COLLAPSE_ICON = (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12.5 4.5 7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Sidebar({ role, open, onClose, collapsed, onToggleCollapse }) {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = NAVIGATION[role] || [];

  const displayName = profile?.name?.trim() || user?.email || "User";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}

      <aside
        className={`sidebar ${open ? "is-open" : ""} ${collapsed ? "is-collapsed" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">G</span>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">GCE Keonjhar</span>
              {role && <span className="sidebar-role-tag">{role}</span>}
            </div>
          )}
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={collapsed ? "is-flipped" : ""}>{COLLAPSE_ICON}</span>
          </button>
        </div>

        <nav className="sidebar-nav sidebar-scroll">
          {groups.map((group) => (
            <div className="sidebar-group" key={group.section}>
              {!collapsed && <p className="sidebar-section-label">{group.section}</p>}
              {group.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => `sidebar-link ${isActive ? "is-active" : ""}`}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="user-avatar" />
            ) : (
              <span className="user-avatar-fallback">{initials}</span>
            )}
            {!collapsed && (
              <div className="sidebar-user-text">
                <span className="sidebar-user-name">{displayName}</span>
                <span className="sidebar-user-email">{user?.email}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title="Log out"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 14l4-4-4-4M17 10H8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
