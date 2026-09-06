import { Link } from "react-router-dom";

/**
 * crumbs: [{ label, to? }]  — last item (no `to`) renders as plain text.
 */
export default function Breadcrumbs({ crumbs }) {
  if (!crumbs || crumbs.length < 2) return null;
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i} className="breadcrumb-item">
          {c.to ? (
            <Link to={c.to} className="breadcrumb-link">{c.label}</Link>
          ) : (
            <span className="breadcrumb-current">{c.label}</span>
          )}
          {i < crumbs.length - 1 && <span className="breadcrumb-sep">/</span>}
        </span>
      ))}
    </nav>
  );
}
