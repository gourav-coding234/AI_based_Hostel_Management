import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { useDismissableMenu } from "../../hooks/useDismissableMenu";

const BELL_ICON = (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M5 8a5 5 0 0 1 10 0c0 3.2 1 4.5 1.5 5H3.5c.5-.5 1.5-1.8 1.5-5Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.2 16a1.8 1.8 0 0 0 3.6 0" strokeLinecap="round" />
  </svg>
);

export default function NotificationMenu({ role }) {
  const { items, loading } = useNotifications(role);
  const [open, setOpen, ref] = useDismissableMenu();
  const navigate = useNavigate();

  return (
    <div className="topbar-menu" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {BELL_ICON}
        {items.length > 0 && <span className="icon-btn-dot" />}
      </button>

      {open && (
        <div className="dropdown-panel notification-panel" role="menu" aria-label="Notifications">
          <p className="dropdown-panel-title">Notifications</p>
          {loading ? (
            <p className="dropdown-empty">Loading…</p>
          ) : items.length === 0 ? (
            <p className="dropdown-empty">You're all caught up.</p>
          ) : (
            <ul className="notification-list">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="notification-item"
                    onClick={() => {
                      setOpen(false);
                      navigate(n.to);
                    }}
                  >
                    <span className="notification-dot" />
                    <span>
                      <span className="notification-title">{n.title}</span>
                      <span className="notification-subtitle">{n.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
