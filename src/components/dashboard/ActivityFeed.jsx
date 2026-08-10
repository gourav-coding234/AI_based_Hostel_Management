export default function ActivityFeed({ title, items, emptyLabel = "Nothing to show yet." }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink">{item.title}</p>
                {item.subtitle && <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>}
              </div>
              {item.meta && <span className="shrink-0 text-xs text-slate-400">{item.meta}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
