import { Card, Pill, EmptyState } from "../../../components/dashboard/student/ui";
import { ErrorState } from "../../../components/ui/DataState";
import PortalLoader from "../../../components/ui/PortalLoader";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";
import { useStudentCollection } from "../../../hooks/useStudentCollection";

function displayDate(value) {
  if (!value) return "—";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN");
}

export default function ParentLeave() {
  const linked = useLinkedStudent();
  const requests = useStudentCollection("leaveRequests", linked.linkedStudentId, { orderByField: "createdAt" });
  if (linked.loading || linked.notLinked || linked.notFound || linked.error) return <LinkedStudentStatus {...linked} />;
  if (requests.loading) return <PortalLoader label="Loading leave requests…" />;
  if (requests.error) return <ErrorState message={requests.error} />;

  return <Card title={`${linked.studentUser?.name || "Your child"} · Leave requests`} subtitle="Read-only updates from the hostel office.">
    {requests.items.length === 0 ? <EmptyState title="No leave requests yet" description="Leave requests submitted by your child will appear here." /> : (
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="text-xs uppercase tracking-wide text-slate-400"><th className="pb-2 font-medium">Type / reason</th><th className="pb-2 font-medium">Dates</th><th className="pb-2 font-medium">Destination</th><th className="pb-2 font-medium">Status</th><th className="pb-2 pr-0 font-medium">Remarks</th></tr></thead><tbody className="divide-y divide-slate-100">{requests.items.map((row) => <tr key={row.id}><td className="py-3"><p className="font-medium text-ink">{row.type || row.reason || "Leave"}</p>{row.reason && row.type && <p className="mt-0.5 text-xs text-slate-400">{row.reason}</p>}</td><td className="py-3">{displayDate(row.from)} – {displayDate(row.to)}</td><td className="py-3">{row.destination || "—"}</td><td className="py-3"><Pill tone={row.status}>{row.status || "Pending"}</Pill></td><td className="py-3 pr-0">{row.remarks || row.approvalRemarks || "—"}</td></tr>)}</tbody></table></div>
    )}
  </Card>;
}
