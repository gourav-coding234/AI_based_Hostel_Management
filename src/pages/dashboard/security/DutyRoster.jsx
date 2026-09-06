import { Card, Pill } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { CalendarClockIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { useAuth } from "../../../context/AuthContext";

export default function SecurityDutyRoster() {
  const { profile } = useAuth();
  const myName = profile?.name;
  const rosterQuery = useCollection("dutyRoster", { orderByField: "date" });
  const dutyRoster = rosterQuery.data;

  const byGate = dutyRoster.reduce((acc, shift) => {
    const key = shift.gate || "Unassigned gate";
    (acc[key] ??= []).push(shift);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <CalendarClockIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Duty roster</p>
            <p className="text-sm text-slate-500">Shift assignments across gates.</p>
          </div>
        </div>
      </Card>

      {rosterQuery.loading ? (
        <Card><p className="py-8 text-center text-sm text-slate-400">Loading…</p></Card>
      ) : dutyRoster.length === 0 ? (
        <Card>
          <EmptyState icon={<CalendarClockIcon />} title="No roster published yet" description="The admin office hasn't added shift assignments yet." />
        </Card>
      ) : (
        Object.entries(byGate).map(([gate, shifts]) => (
          <Card key={gate} title={gate}>
            <div className="flex flex-col gap-3">
              {shifts.map((s) => {
                const isYou = myName && s.guardName === myName;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                      isYou ? "border-teal-300 bg-teal-500/5" : "border-slate-100 hover:bg-slate-50/70"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-ink">{s.shift}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{s.date || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isYou && <Pill tone="Approved">Your shift</Pill>}
                      <span className="text-sm text-slate-600">{s.guardName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
