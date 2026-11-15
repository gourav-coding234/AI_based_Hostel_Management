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

export default function ParentComplaints() {
  const linked = useLinkedStudent();
  const complaints = useStudentCollection("complaints", linked.linkedStudentId, { orderByField: "createdAt" });
  if (linked.loading || linked.notLinked || linked.notFound || linked.error) return <LinkedStudentStatus {...linked} />;
  if (complaints.loading) return <PortalLoader label="Loading complaints…" />;
  if (complaints.error) return <ErrorState message={complaints.error} />;

  return <Card title={`${linked.studentUser?.name || "Your child"} · Complaints`} subtitle="Track issue status and hostel office updates.">
    {complaints.items.length === 0 ? <EmptyState title="No complaints yet" description="Complaints submitted by your child will appear here." /> : (
      <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="text-xs uppercase tracking-wide text-slate-400"><th className="pb-2 font-medium">Issue</th><th className="pb-2 font-medium">Category</th><th className="pb-2 font-medium">Submitted</th><th className="pb-2 font-medium">Status</th><th className="pb-2 pr-0 font-medium">Remarks</th></tr></thead><tbody className="divide-y divide-slate-100">{complaints.items.map((row) => <tr key={row.id}><td className="py-3"><p className="font-medium text-ink">{row.title || row.subject || "Complaint"}</p><p className="mt-0.5 max-w-sm text-xs text-slate-500">{row.description || row.message || ""}</p></td><td className="py-3">{row.category || "—"}</td><td className="py-3">{displayDate(row.createdAt || row.date)}</td><td className="py-3"><Pill tone={row.status}>{row.status || "Open"}</Pill></td><td className="py-3 pr-0">{row.remarks || row.resolution || "—"}</td></tr>)}</tbody></table></div>
    )}
  </Card>;
}
