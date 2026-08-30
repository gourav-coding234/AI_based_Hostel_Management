// Small, shared UI primitives for the student dashboard sections.
// Pure presentational components — no data fetching, no auth logic.
// Every prop below is backward compatible: existing pages that only pass
// title/action/children/className etc. render exactly the same content,
// just with a more polished look.

export function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition-shadow duration-200 hover:shadow-md sm:p-6 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="font-display text-base font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

const statusStyles = {
  // greens
  Allotted: "bg-teal-500/10 text-teal-700 ring-teal-600/10",
  Approved: "bg-teal-500/10 text-teal-700 ring-teal-600/10",
  Resolved: "bg-teal-500/10 text-teal-700 ring-teal-600/10",
  Completed: "bg-teal-500/10 text-teal-700 ring-teal-600/10",
  Present: "bg-teal-500/10 text-teal-700 ring-teal-600/10",
  Good: "bg-teal-500/10 text-teal-700 ring-teal-600/10",
  // ambers
  Waiting: "bg-amber-400/15 text-amber-600 ring-amber-500/10",
  "In Progress": "bg-amber-400/15 text-amber-600 ring-amber-500/10",
  Pending: "bg-amber-400/15 text-amber-600 ring-amber-500/10",
  Medium: "bg-amber-400/15 text-amber-600 ring-amber-500/10",
  Partial: "bg-amber-400/15 text-amber-600 ring-amber-500/10",
  Leave: "bg-amber-400/15 text-amber-600 ring-amber-500/10",
  // reds
  Open: "bg-rose-500/10 text-rose-600 ring-rose-600/10",
  Rejected: "bg-rose-500/10 text-rose-600 ring-rose-600/10",
  Absent: "bg-rose-500/10 text-rose-600 ring-rose-600/10",
  Urgent: "bg-rose-500/10 text-rose-600 ring-rose-600/10",
  High: "bg-rose-500/10 text-rose-600 ring-rose-600/10",
  Overdue: "bg-rose-500/10 text-rose-600 ring-rose-600/10",
  // neutrals
  Low: "bg-slate-100 text-slate-500 ring-slate-500/10",
  Normal: "bg-slate-100 text-slate-500 ring-slate-500/10",
  General: "bg-navy-950/5 text-navy-900 ring-navy-900/10",
  Event: "bg-teal-500/10 text-teal-700 ring-teal-600/10",
};

export function Pill({ children, tone }) {
  const cls = statusStyles[tone ?? children] ?? "bg-slate-100 text-slate-600 ring-slate-500/10";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
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
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${toneClasses[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function ProgressBar({ value, max, tone = "teal" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const toneClasses = {
    teal: "bg-gradient-to-r from-teal-400 to-teal-500",
    amber: "bg-gradient-to-r from-amber-400 to-amber-500",
    rose: "bg-gradient-to-r from-rose-400 to-rose-500",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${toneClasses[tone]}`}
        style={{ width: `${pct}%` }}
      />
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
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 shadow-sm shadow-slate-100 transition-colors focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-navy-950 text-white shadow-sm shadow-navy-950/20 hover:bg-navy-900",
    outline: "border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700",
    danger: "border border-rose-200 text-rose-600 hover:bg-rose-50",
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      {icon && (
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
          {icon}
        </span>
      )}
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400">{description}</p>}
    </div>
  );
}
