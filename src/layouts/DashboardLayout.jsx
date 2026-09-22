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

  // While the drawer is open, lock the page behind it and let Escape close
  // it. Without the lock, scrolling on a phone moves the page under the
  // overlay instead of the menu, which reads as a broken screen.
  useEffect(() => {
    if (!menuOpen) return undefined;

    document.body.classList.add("has-drawer-open");

    function onKeyDown(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("has-drawer-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // A desktop resize while the drawer is open would otherwise leave the
  // body scroll-locked with no visible overlay to dismiss.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    function onChange(e) {
      if (e.matches) setMenuOpen(false);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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
