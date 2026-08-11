import { Card } from "../../../components/dashboard/student/ui";
import { ClipboardIcon } from "../../../components/dashboard/admin/icons";
import { auditLog } from "../../../data/adminMock";

export default function AuditLog() {
  return (
    <div className="flex flex-col gap-6">
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
        <ol className="relative flex flex-col gap-6 border-l border-slate-100 pl-6">
          {auditLog.map((log) => (
            <li key={log.id} className="relative">
              <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal-500 ring-2 ring-teal-500/20" />
              <p className="text-sm font-medium text-ink">
                {log.actor} <span className="font-normal text-slate-500">{log.action.toLowerCase()}</span>
              </p>
              <p className="text-sm text-slate-600">{log.target}</p>
              <p className="mt-0.5 text-xs text-slate-400">{log.timestamp}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
