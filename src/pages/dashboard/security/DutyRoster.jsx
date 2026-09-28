import { useMemo } from "react";
import { Card, Pill } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { CalendarClockIcon } from "../../../components/dashboard/security/icons";
import { useCollection } from "../../../hooks/useCollection";
import { useAuth } from "../../../context/AuthContext";

export default function SecurityDutyRoster() {
  const { profile } = useAuth();
  const myName = String(profile?.name || "").trim().toLowerCase();
  // No orderBy: it would drop shifts with no date. Grouped/sorted below.
  const rosterQuery = useCollection("dutyRoster");
  const dutyRoster = rosterQuery.data;

  // Local calendar day, matching how dates are typed into the roster import.
  const today = useMemo(() => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }, []);

  // Today first, then upcoming (soonest first), then past (most recent
  // first); shifts with no date go last so they are never hidden.
  const timing = (s) => (!s.date ? "undated" : s.date === today ? "today" : s.date > today ? "upcoming" : "past");
  const rank = { today: 0, upcoming: 1, past: 2, undated: 3 };
  const ordered = useMemo(
    () =>
      [...dutyRoster].sort((a, b) => {
        const ta = timing(a);
        const tb = timing(b);
        if (ta !== tb) return rank[ta] - rank[tb];
        const da = String(a.date || "");
        const db = String(b.date || "");
        return ta === "past" ? db.localeCompare(da) : da.localeCompare(db);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dutyRoster, today]
  );

  const byGate = ordered.reduce((acc, shift) => {
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
                const isYou = Boolean(myName) && String(s.guardName || "").trim().toLowerCase() === myName;
                const when = timing(s);
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                      isYou ? "border-teal-300 bg-teal-500/5" : "border-slate-100 hover:bg-slate-50/70"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-ink">{s.shift}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{s.date || "—"}{when === "today" ? " · Today" : when === "past" ? " · Past" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isYou && <Pill tone={when === "past" ? "Completed" : "Approved"}>{when === "past" ? "Your past shift" : when === "upcoming" ? "Your upcoming shift" : "Your shift"}</Pill>}
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
