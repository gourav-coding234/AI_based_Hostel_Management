import { useMemo, useState } from "react";
import { LoadingState, ErrorState, EmptyState } from "./DataState";

const CHEVRON_UP_DOWN = (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 8l4-4 4 4M6 12l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DOTS_ICON = (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="4" cy="10" r="1.4" />
    <circle cx="10" cy="10" r="1.4" />
    <circle cx="16" cy="10" r="1.4" />
  </svg>
);

function RowActionsMenu({ actions }) {
  const [open, setOpen] = useState(false);
  if (!actions || actions.length === 0) return null;
  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-ink"
        aria-label="Row actions"
      >
        {DOTS_ICON}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-md shadow-slate-200/60">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  a.onClick();
                }}
                className={`block w-full px-3 py-1.5 text-left text-xs font-medium ${
                  a.danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Generic data table: search + column sort + pagination + optional
 * per-row three-dot actions. Renders the app's shared Loading/Error/Empty
 * states — never fabricates rows.
 *
 * columns: [{ key, label, sortable?, render?(row) }]
 * rows: array of real records (already fetched from Firestore)
 * rowActions?: (row) => [{ label, onClick, danger? }]
 */
export default function DataTable({
  columns,
  rows,
  getRowId = (row) => row.id,
  loading = false,
  error = "",
  emptyTitle = "No records found",
  emptyDescription,
  emptyIcon,
  searchable = true,
  searchKeys,
  searchPlaceholder = "Search…",
  pageSize = 10,
  rowActions,
  onRowClick,
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const keysToSearch = searchKeys || columns.map((c) => c.key);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((row) => keysToSearch.some((k) => String(row[k] ?? "").toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex flex-col gap-4">
      {searchable && (
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="w-full max-w-xs rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-ink placeholder:text-slate-400 shadow-sm shadow-slate-100 transition-colors focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
        />
      )}

      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      ) : sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No rows match your search.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  {columns.map((c) => (
                    <th key={c.key} className="pb-2 pr-4 font-medium">
                      {c.sortable ? (
                        <button type="button" onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-ink">
                          {c.label} {CHEVRON_UP_DOWN}
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                  {rowActions && <th className="pb-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`transition-colors hover:bg-slate-50/70 ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className="py-2.5 pr-4 text-slate-600">
                        {c.render ? c.render(row) : row[c.key]}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="py-2.5 text-right">
                        <RowActionsMenu actions={rowActions(row)} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {currentPage} of {totalPages} · {sorted.length} row{sorted.length === 1 ? "" : "s"}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
