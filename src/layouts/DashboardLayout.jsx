import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import PageHeader from "../components/dashboard/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { NAVIGATION, flatNavForRole } from "../config/navigation";

const COLLAPSE_STORAGE_KEY = "hostel-sidebar-collapsed";

function findActiveItem(role, pathname) {
  const items = flatNavForRole(role);
  // Prefer an exact match; fall back to the longest prefix match so
  // sub-pages (if any are added later) still resolve to a sensible crumb.
  const exact = items.find((i) => i.to === pathname);
  if (exact) return exact;
  return items
    .filter((i) => pathname.startsWith(i.to) && !i.end)
    .sort((a, b) => b.to.length - a.to.length)[0];
}

export default function DashboardLayout({ title, children }) {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const role = profile?.role;

  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Close the mobile drawer whenever the route changes (e.g. via SearchBar).
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const activeItem = role ? findActiveItem(role, location.pathname) : null;
  const pageTitle = activeItem?.label || title;

  const overviewPath = role ? NAVIGATION[role]?.[0]?.items?.[0]?.to : undefined;
  const crumbs =
    activeItem && activeItem.label !== "Overview"
      ? [
          { label: title, to: overviewPath },
          ...(activeItem.section ? [{ label: activeItem.section }] : []),
          { label: activeItem.label },
        ]
      : undefined;

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className={`dashboard-main ${collapsed ? "sidebar-is-collapsed" : ""}`}>
        <Topbar title={pageTitle} onMenuClick={() => setMenuOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
        <main className="dashboard-content">
          {activeItem?.label !== "Overview" && (
            <PageHeader title={pageTitle} crumbs={crumbs} icon={activeItem?.icon} />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
