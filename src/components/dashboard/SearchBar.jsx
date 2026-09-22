import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { flatNavForRole } from "../../config/navigation";
import { useDismissableMenu } from "../../hooks/useDismissableMenu";

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
  const [open, setOpen, ref] = useDismissableMenu();
  const navigate = useNavigate();
  const items = flatNavForRole(role);

  const results = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

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
        onKeyDown={(e) => {
          if (e.key === "Escape") e.currentTarget.blur();
        }}
        placeholder="Search pages…"
        className="topbar-search-input"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="topbar-search-results"
        aria-autocomplete="list"
      />
      {open && results.length > 0 && (
        <div className="dropdown-panel search-panel" role="listbox" id="topbar-search-results">
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
