import { Card, Pill, EmptyState } from "../../../components/dashboard/student/ui";
import { QrIcon } from "../../../components/dashboard/parent/icons";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import SampleDataBadge from "../../../components/dashboard/parent/SampleDataBadge";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { demoGatePasses } from "../../../data/parentDemoFallback";

export default function ParentGatePass() {
  const linked = useLinkedStudent();
  const { studentUser, linkedStudentId } = linked;
  const gatePasses = useStudentCollection("gatePasses", linkedStudentId, { orderByField: "from" });

  const status = <LinkedStudentStatus {...linked} />;
  if (status) return status;

  const usingSample = gatePasses.items.length === 0;
  const passList = usingSample ? demoGatePasses : gatePasses.items;
  const activePass = passList.find((p) => p.status === "Approved");

  return (
    <div className="flex flex-col gap-6">
      {usingSample && (
        <div className="flex items-center gap-2">
          <SampleDataBadge />
          <p className="text-xs text-slate-400">No real gate passes yet — showing an example of what this will look like.</p>
        </div>
      )}

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
              <Pill tone={activePass.tripState === "Out" ? "Pending" : activePass.tripState === "Returned" ? "Resolved" : "Normal"}>
                {activePass.tripState}
              </Pill>
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
        {passList.length === 0 ? (
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
                    <td className="py-2.5 font-medium text-ink">{p.type}</td>
                    <td className="py-2.5 text-slate-500">{p.from} → {p.to}</td>
                    <td className="py-2.5"><Pill tone={p.status}>{p.status}</Pill></td>
                    <td className="py-2.5 pr-0 text-right text-slate-500">{p.tripState}</td>
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
    </div>
  );
}
