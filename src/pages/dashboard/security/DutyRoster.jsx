import { Card, Pill } from "../../../components/dashboard/student/ui";
import { CalendarClockIcon } from "../../../components/dashboard/security/icons";
import { dutyRoster } from "../../../data/securityMock";
import { useAuth } from "../../../context/AuthContext";

export default function SecurityDutyRoster() {
  const { profile } = useAuth();
  const myName = profile?.name;

  const byGate = dutyRoster.reduce((acc, shift) => {
    (acc[shift.gate] ??= []).push(shift);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <CalendarClockIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Today's duty roster</p>
            <p className="text-sm text-slate-500">Shift assignments across both gates.</p>
          </div>
        </div>
      </Card>

      {Object.entries(byGate).map(([gate, shifts]) => (
        <Card key={gate} title={gate}>
          <div className="flex flex-col gap-3">
            {shifts.map((s, i) => {
              const isYou = s.guard === "You" || (myName && s.guard === myName);
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                    isYou ? "border-teal-300 bg-teal-500/5" : "border-slate-100"
                  }`}
                >
                  <div>
                    <p className="font-medium text-ink">{s.shift}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{s.day}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isYou && <Pill tone="Approved">Your shift</Pill>}
                    <span className="text-sm text-slate-600">{s.guard}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
