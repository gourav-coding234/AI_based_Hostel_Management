export default function MetricCard({ label, value, hint, accent = "navy" }) {
  return (
    <div className="metric-card">
      <span className={`metric-tag tone-${accent}`}>{label}</span>
      <p className="metric-value">{value}</p>
      {hint && <p className="metric-hint">{hint}</p>}
    </div>
  );
}
