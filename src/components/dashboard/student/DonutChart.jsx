// Small dependency-free SVG donut chart. Takes segments of
// { label, value, colorClass } and renders proportional arcs plus a legend.
// colorClass should be a Tailwind text-* class; it's used as the stroke color
// via `currentColor` so it stays in sync with the app's palette.

export default function DonutChart({ segments, size = 160, thickness = 22, centerLabel, centerSub }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulative = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const fraction = total > 0 ? s.value / total : 0;
      const dash = fraction * circumference;
      const offset = cumulative * circumference;
      cumulative += fraction;
      return { ...s, dash, offset };
    });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-slate-100" />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={thickness}
              strokeDasharray={`${a.dash} ${circumference - a.dash}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
              className={a.colorClass}
            />
          ))}
        </svg>
        {(centerLabel || centerSub) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel && <span className="font-display text-xl font-semibold text-ink">{centerLabel}</span>}
            {centerSub && <span className="text-xs text-slate-400">{centerSub}</span>}
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-2.5">
        {segments.map((s, i) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full bg-current ${s.colorClass}`} />
              <span className="w-16 font-medium text-ink">{s.label}</span>
              <span className="text-slate-400">{s.value} day{s.value === 1 ? "" : "s"} · {pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
