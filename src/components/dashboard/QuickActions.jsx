import { Link } from "react-router-dom";
import { Card } from "./student/ui";

/**
 * Grid of "jump to a common task" links, used on every role's Overview
 * page. `actions`: [{ label, description?, to, icon }]
 */
export default function QuickActions({ title = "Quick actions", actions }) {
  if (!actions || actions.length === 0) return null;
  return (
    <Card title={title}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
              {a.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{a.label}</span>
              {a.description && <span className="block truncate text-xs text-slate-400">{a.description}</span>}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
