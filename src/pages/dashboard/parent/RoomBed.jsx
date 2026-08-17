import { Card, Pill } from "../../../components/dashboard/student/ui";
import { BedIcon } from "../../../components/dashboard/parent/icons";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";

export default function ParentRoomBed() {
  const linked = useLinkedStudent();
  const { studentRecord } = linked;

  const status = <LinkedStudentStatus {...linked} />;
  if (status) return status;

  if (!studentRecord?.room) {
    return (
      <Card>
        <p className="text-sm text-slate-500">
          Your child hasn't been allotted a room yet. This will fill in as soon as the warden completes room
          allotment.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Room allocation">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <BedIcon />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                {studentRecord.room} · {studentRecord.bed}
              </p>
              <p className="text-sm text-slate-500">{studentRecord.wing}{studentRecord.floor ? `, ${studentRecord.floor}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone="Allotted">Allotted</Pill>
            {studentRecord.allottedOn && <span className="text-xs text-slate-400">Since {studentRecord.allottedOn}</span>}
          </div>
        </div>
        {studentRecord.roommates?.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Roommates</p>
            <div className="flex flex-wrap gap-2">
              {studentRecord.roommates.map((r) => (
                <span key={r.name} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {r.name} · {r.bed}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <p className="text-sm text-slate-500">
          Room and bed changes are requested and reviewed between your child and the wing warden. If you have a
          concern about the current allocation, the fastest way to reach the warden is via the Emergency Contacts tab.
        </p>
      </Card>
    </div>
  );
}
