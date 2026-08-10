// Small, shared UI primitives for the student dashboard sections.
// Pure presentational components — no data fetching, no auth logic.

export function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="font-display text-base font-semibold text-ink">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

const statusStyles = {
  // greens
  Allotted: "bg-teal-500/10 text-teal-700",
  Approved: "bg-teal-500/10 text-teal-700",
  Resolved: "bg-teal-500/10 text-teal-700",
  Completed: "bg-teal-500/10 text-teal-700",
  Present: "bg-teal-500/10 text-teal-700",
  Good: "bg-teal-500/10 text-teal-700",
  // ambers
  Waiting: "bg-amber-400/15 text-amber-600",
  "In Progress": "bg-amber-400/15 text-amber-600",
  Pending: "bg-amber-400/15 text-amber-600",
  Medium: "bg-amber-400/15 text-amber-600",
  // reds
  Open: "bg-rose-500/10 text-rose-600",
  Rejected: "bg-rose-500/10 text-rose-600",
  Absent: "bg-rose-500/10 text-rose-600",
  Urgent: "bg-rose-500/10 text-rose-600",
  High: "bg-rose-500/10 text-rose-600",
  // neutrals
  Low: "bg-slate-100 text-slate-500",
  Normal: "bg-slate-100 text-slate-500",
  General: "bg-navy-950/5 text-navy-900",
  Event: "bg-teal-500/10 text-teal-700",
};

export function Pill({ children, tone }) {
  const cls = statusStyles[tone ?? children] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function StatCard({ icon, label, value, sub, tone = "teal" }) {
  const toneClasses = {
    teal: "bg-teal-500/10 text-teal-600",
    amber: "bg-amber-400/15 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
    navy: "bg-navy-950/5 text-navy-900",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function ProgressBar({ value, max, tone = "teal" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const toneClasses = {
    teal: "bg-teal-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${toneClasses[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-navy-950 text-white hover:bg-navy-900",
    outline: "border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700",
    danger: "border border-rose-200 text-rose-600 hover:bg-rose-50",
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
      {icon && (
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </span>
      )}
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
  );
}
