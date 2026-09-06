import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { flatNavForRole } from "../../config/navigation";

const SEARCH_ICON = (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
    <circle cx="9" cy="9" r="6" />
    <path d="m17 17-4-4" strokeLinecap="round" />
  </svg>
);

/**
 * Lightweight "jump to a page" search over this role's own navigation —
 * not a full-text search over Firestore records (each data-heavy page has
 * its own local search/filter for that, per requirement #23).
 */
export default function SearchBar({ role }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const items = flatNavForRole(role);

  const results = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(to) {
    setQuery("");
    setOpen(false);
    navigate(to);
  }

  return (
    <div className="topbar-search" ref={ref}>
      <span className="topbar-search-icon">{SEARCH_ICON}</span>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search pages…"
        className="topbar-search-input"
      />
      {open && results.length > 0 && (
        <div className="dropdown-panel search-panel">
          <ul className="notification-list">
            {results.map((r) => (
              <li key={r.to}>
                <button type="button" className="notification-item" onClick={() => go(r.to)}>
                  <span>
                    <span className="notification-title">{r.label}</span>
                    <span className="notification-subtitle">{r.section}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
