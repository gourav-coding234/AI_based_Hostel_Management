export default function ActivityFeed({ title, items, emptyLabel = "Nothing to show yet." }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition-shadow duration-200 hover:shadow-md">
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-lg px-1.5 py-3 -mx-1.5 transition-colors first:pt-2 last:pb-2 hover:bg-slate-50/70"
            >
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
