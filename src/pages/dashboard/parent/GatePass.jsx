import { Card, Pill, EmptyState } from "../../../components/dashboard/student/ui";
import { AsyncSection } from "../../../components/ui/DataState";
import { QrIcon, CheckSquareIcon } from "../../../components/dashboard/parent/icons";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { formatDate } from "./parentData";

export default function ParentGatePass() {
  const linked = useLinkedStudent();
  const { studentUser, linkedStudentId } = linked;
  const gatePasses = useStudentCollection("gatePasses", linkedStudentId, { orderByField: "from" });
  // Read-only. Queried by studentId so it satisfies the same own-record rule
  // as every other Parent query; the rules give parents no write access here.
  const leaves = useStudentCollection("leaveRequests", linkedStudentId, { orderByField: "from" });

  const status = <LinkedStudentStatus {...linked} />;
  if (status) return status;

  const passList = gatePasses.items;
  const activePass = passList.find((p) => p.status === "Approved");

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Current status">
        {activePass ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
              <QrIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">{activePass.type} · {activePass.id}</p>
              <p className="mt-1 text-sm text-slate-500">{activePass.reason}</p>
              <p className="mt-1 text-xs text-slate-400">{activePass.from} → {activePass.to}</p>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone={activePass.status}>{activePass.status}</Pill>
              {activePass.tripState && (
                <Pill tone={activePass.tripState === "Out" ? "Pending" : activePass.tripState === "Returned" ? "Resolved" : "Normal"}>
                  {activePass.tripState}
                </Pill>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<QrIcon />}
            title="No approved gate pass right now"
            description={`${studentUser?.name || "Your child"} doesn't have an active outing or home-visit pass.`}
          />
        )}
      </Card>

      <Card title="Gate pass history">
        {gatePasses.loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading gate passes…</p>
        ) : gatePasses.error ? (
          <p className="py-6 text-center text-sm text-rose-600">{gatePasses.error}</p>
        ) : passList.length === 0 ? (
          <EmptyState icon={<QrIcon />} title="No gate passes yet" description="Requests your child submits will show up here once the warden acts on them." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Window</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 pr-0 text-right font-medium">Trip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {passList.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 text-slate-400">{p.id}</td>
                    <td className="py-2.5 font-medium text-ink">{p.type || "—"}</td>
                    <td className="py-2.5 text-slate-500">{p.from || "—"} → {p.to || "—"}</td>
                    <td className="py-2.5"><Pill tone={p.status}>{p.status || "Pending"}</Pill></td>
                    <td className="py-2.5 pr-0 text-right text-slate-500">{p.tripState || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-slate-400">
          Gate pass requests are submitted by your child and approved by the warden. This view is read-only.
        </p>
      </Card>
      <Card title="Leave requests">
        <AsyncSection
          loading={leaves.loading}
          error={leaves.error}
          isEmpty={leaves.items.length === 0}
          emptyTitle="No leave requests yet"
          emptyDescription="Leave requests your child submits, and the warden's decision, will show up here."
          emptyIcon={<CheckSquareIcon />}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Dates</th>
                  <th className="pb-2 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 pr-0 text-right font-medium">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.items.map((l) => {
                  const decidedBy = l.status === "Approved" ? l.approvedBy : l.status === "Rejected" ? l.rejectedBy : "";
                  const decidedAt = formatDate(l.status === "Approved" ? l.approvedAt : l.status === "Rejected" ? l.rejectedAt : null);
                  return (
                    <tr key={l.id}>
                      <td className="py-2.5 font-medium text-ink">{l.type || "—"}</td>
                      <td className="py-2.5 text-slate-500">{l.from || "—"} → {l.to || "—"}</td>
                      <td className="py-2.5 text-slate-500">{l.reason || "—"}</td>
                      <td className="py-2.5"><Pill tone={l.status}>{l.status || "Pending"}</Pill></td>
                      <td className="py-2.5 pr-0 text-right text-xs text-slate-500">
                        {decidedBy ? `${l.status} by ${decidedBy}${decidedAt ? ` · ${decidedAt}` : ""}` : "Awaiting decision"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsyncSection>
        <p className="mt-4 text-xs text-slate-400">
          Leave requests are submitted by your child and decided by the warden. This view is read-only.
        </p>
      </Card>
    </div>
  );
}
