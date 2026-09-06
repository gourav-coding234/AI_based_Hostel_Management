import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const CHEVRON = (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PROFILE_PATH_BY_ROLE = {
  Admin: "/dashboard/admin/users",
  Student: "/dashboard/student/profile",
  Warden: null,
  Parent: "/dashboard/parent/profile",
  Security: "/dashboard/security/profile",
};

export default function UserMenu() {
  const { profile, user, role, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const displayName = profile?.name ?? user?.email ?? "User";
  const initials = displayName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const profilePath = PROFILE_PATH_BY_ROLE[role];

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="topbar-menu" ref={ref}>
      <button type="button" className="user-chip user-chip-btn" onClick={() => setOpen((o) => !o)}>
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" className="user-avatar" />
        ) : (
          <span className="user-avatar-fallback">{initials}</span>
        )}
        <span className="user-name">{displayName}</span>
        {CHEVRON}
      </button>

      {open && (
        <div className="dropdown-panel user-panel">
          <div className="user-panel-header">
            <p className="user-panel-name">{displayName}</p>
            <p className="user-panel-email">{user?.email}</p>
            {role && <span className="role-badge">{role}</span>}
          </div>
          <div className="user-panel-actions">
            {profilePath && (
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setOpen(false);
                  navigate(profilePath);
                }}
              >
                Profile
              </button>
            )}
            <button type="button" className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
