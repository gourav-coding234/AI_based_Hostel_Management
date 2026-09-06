// Shared loading / empty / error states, built on the app's existing
// .empty-state CSS so real-data pages look identical to the rest of the
// UI instead of introducing a second visual language. No sample/demo
// content is ever rendered here — this is purely "what to show while
// there is no real data yet, or while the database can't be reached".
import { EmptyState } from "../dashboard/student/ui";

export { EmptyState };

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="loading-state">
      <span className="loading-spinner" />
      <p className="empty-state-desc">{label}</p>
    </div>
  );
}

export function ErrorState({ message = "Couldn't load this from the database. Please refresh.", onRetry }) {
  return (
    <div className="error-state">
      <span className="error-state-icon">!</span>
      <p className="error-state-title">{message}</p>
      {onRetry && (
        <button type="button" className="error-state-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Wraps a section of a page: Loading -> Error -> Empty -> children (real
 * data). Use this around every table/list/chart that used to read from a
 * mock array.
 */
export function AsyncSection({ loading, error, isEmpty, emptyTitle = "No data available", emptyDescription, emptyIcon, children }) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (isEmpty) return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  return children;
}

// For rows inside a <table> that already renders its own <thead>, where a
// full AsyncSection block would break out of the table layout.
export function EmptyRow({ colSpan, message = "No data available" }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: "28px 12px", textAlign: "center", fontSize: 13, color: "var(--text-faint)" }}>
        {message}
      </td>
    </tr>
  );
}
