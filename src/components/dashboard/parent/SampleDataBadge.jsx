/**
 * Marks a section as showing placeholder content instead of real records —
 * used only when a Parent page's real Firestore query came back empty, so
 * the dashboard doesn't look broken/blank before the office/warden has
 * entered anything real yet. Never hides real data; only ever shown
 * alongside sample data, never alongside actual records.
 */
export default function SampleDataBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
      Sample data
    </span>
  );
}
