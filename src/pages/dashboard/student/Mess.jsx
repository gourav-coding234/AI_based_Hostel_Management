import { useMemo } from "react";
import { Card, Button } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import { UtensilsIcon } from "../../../components/dashboard/student/icons";
import { useCollection } from "../../../hooks/useCollection";
import { downloadTextFile } from "../../../utils/csv";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const NOT_POSTED = "Not posted";
const NOT_LISTED = "Not listed";

function toCsv(headers, rows) {
  const lines = [headers.map((h) => h.label).join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(h.value(row) ?? "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

const timetableCsvHeaders = [
  { label: "Day", value: (r) => r.day },
  { label: "Breakfast", value: (r) => r.breakfast },
  { label: "Lunch", value: (r) => r.lunch },
  { label: "Dinner", value: (r) => r.dinner },
];

export default function Mess() {
  // messMenu stores one document per weekday (doc id = weekday name, e.g.
  // "Monday"), the same collection the warden's weekly-menu editor writes
  // to. This page only ever reads it in real time — students have no way
  // to create, update, or delete messMenu records from here, and Firestore
  // rules separately restrict writes on this collection to staff.
  const menuQuery = useCollection("messMenu");

  const menuByDay = useMemo(
    () => Object.fromEntries(menuQuery.data.map((d) => [d.id, d])),
    [menuQuery.data]
  );

  // Only weekdays that actually have a posted document get real meals;
  // a missing day is never filled in with placeholder food, just marked
  // as not posted.
  const timetable = useMemo(
    () =>
      DAYS.map((day) => {
        const doc = menuByDay[day];
        return {
          day,
          posted: Boolean(doc),
          breakfast: doc ? doc.breakfast || NOT_LISTED : NOT_POSTED,
          lunch: doc ? doc.lunch || NOT_LISTED : NOT_POSTED,
          dinner: doc ? doc.dinner || NOT_LISTED : NOT_POSTED,
        };
      }),
    [menuByDay]
  );

  const hasAnyMenu = menuQuery.data.length > 0;

  function downloadTimetable() {
    downloadTextFile(toCsv(timetableCsvHeaders, timetable), "mess-timetable.csv");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card
        title="Weekly mess timetable"
        subtitle="View-only — published by the mess staff"
        action={
          <Button variant="outline" onClick={downloadTimetable} disabled={!hasAnyMenu} className="px-3 py-1.5 text-xs">
            Download timetable
          </Button>
        }
      >
        {menuQuery.loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
        ) : !hasAnyMenu ? (
          <EmptyState
            icon={<UtensilsIcon />}
            title="Menu not posted yet"
            description="The mess staff hasn't published the weekly menu yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Day</th>
                  <th className="pb-2 font-medium">Breakfast</th>
                  <th className="pb-2 font-medium">Lunch</th>
                  <th className="pb-2 pr-0 font-medium">Dinner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetable.map((row) => (
                  <tr key={row.day} className="transition-colors hover:bg-slate-50/70">
                    <td className="py-2.5 font-medium text-ink">{row.day}</td>
                    <td className={`py-2.5 ${row.posted ? "text-slate-500" : "text-slate-300"}`}>{row.breakfast}</td>
                    <td className={`py-2.5 ${row.posted ? "text-slate-500" : "text-slate-300"}`}>{row.lunch}</td>
                    <td className={`py-2.5 pr-0 ${row.posted ? "text-slate-500" : "text-slate-300"}`}>{row.dinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
