export default function MetricCard({ label, value, hint, accent = "teal" }) {
  const accents = {
    teal: "bg-teal-500/10 text-teal-700",
    amber: "bg-amber-500/10 text-amber-700",
    rose: "bg-rose-500/10 text-rose-700",
    navy: "bg-navy-950/5 text-navy-800",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${accents[accent]}`}>
        {label}
      </span>
      <p className="mt-4 font-display text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
