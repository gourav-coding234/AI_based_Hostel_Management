import { Card } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { ClipboardIcon } from "../../../components/dashboard/admin/icons";
import { useCollection } from "../../../hooks/useCollection";

function tsToLabel(ts) {
  if (!ts) return "";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AuditLog() {
  const logQuery = useCollection("auditLogs", { orderByField: "createdAt", limitCount: 100 });
  const auditLog = logQuery.data;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
            <ClipboardIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Activity log</p>
            <p className="text-sm text-slate-500">Account changes, notices and key actions across the system.</p>
          </div>
        </div>
      </Card>

      <Card>
        {logQuery.loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : auditLog.length === 0 ? (
          <EmptyState icon={<ClipboardIcon />} title="No activity recorded yet" description="Key actions — creating accounts, publishing notices, resolving complaints — will appear here as they happen." />
        ) : (
          <ol className="relative flex flex-col gap-6 border-l border-slate-100 pl-6">
            {auditLog.map((log) => (
              <li key={log.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal-500 ring-2 ring-teal-500/20" />
                <p className="text-sm font-medium text-ink">
                  {log.actor} <span className="font-normal text-slate-500">{(log.action || "").toLowerCase()}</span>
                </p>
                <p className="text-sm text-slate-600">{log.target}</p>
                <p className="mt-0.5 text-xs text-slate-400">{tsToLabel(log.createdAt)}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
