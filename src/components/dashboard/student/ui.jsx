// Small, shared UI primitives for the dashboard sections.
// Pure presentational components — no data fetching, no auth logic.

export function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle || action) && (
        <div className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// Maps a status word to a pill colour. Kept as one lookup table so every
// page shows the same colour for the same status instead of picking its
// own greens and reds.
const statusTone = {
  Allotted: "green",
  Approved: "green",
  Resolved: "green",
  Completed: "green",
  Present: "green",
  Good: "green",
  Waiting: "amber",
  "In Progress": "amber",
  Pending: "amber",
  Medium: "amber",
  Partial: "amber",
  Leave: "amber",
  Open: "red",
  Rejected: "red",
  Absent: "red",
  Urgent: "red",
  High: "red",
  Overdue: "red",
  Low: "gray",
  Normal: "gray",
  General: "navy",
  Event: "green",
};

export function Pill({ children, tone }) {
  const t = statusTone[tone ?? children] ?? "gray";
  return <span className={`pill pill-${t}`}>{children}</span>;
}

export function StatCard({ icon, label, value, sub, tone = "navy" }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon tone-${tone}`}>{icon}</span>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
      {sub && <p className="stat-hint">{sub}</p>}
    </div>
  );
}

export function ProgressBar({ value, max, tone = "green" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress">
      <div className={`progress-fill tone-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "input";

export function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state-icon">{icon}</span>}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
    </div>
  );
}
