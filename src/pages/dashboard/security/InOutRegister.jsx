import { useMemo, useState } from "react";
import { Card, Pill } from "../../../components/dashboard/student/ui";
import { initialInOutLog } from "../../../data/securityMock";

const FILTERS = ["All", "In", "Out"];

export default function SecurityInOutRegister() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    return initialInOutLog.filter((l) => {
      if (filter !== "All" && l.direction !== filter) return false;
      if (search && !l.student.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filter, search]);

  return (
    <div className="flex flex-col gap-6">
      <Card title="In / Out register">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f
                    ? "border-navy-950 bg-navy-950 text-white"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name…"
            className="w-full max-w-xs rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Student</th>
                <th className="pb-2 font-medium">Room</th>
                <th className="pb-2 font-medium">Pass ID</th>
                <th className="pb-2 font-medium">Direction</th>
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 pr-0 text-right font-medium">Logged by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 font-medium text-ink">{l.student}</td>
                  <td className="py-2.5 text-slate-500">{l.room}</td>
                  <td className="py-2.5 text-slate-400">{l.passId}</td>
                  <td className="py-2.5">
                    <Pill tone={l.direction === "Out" ? "Pending" : "Approved"}>{l.direction}</Pill>
                  </td>
                  <td className="py-2.5 text-slate-500">{l.time}</td>
                  <td className="py-2.5 pr-0 text-right text-slate-500">{l.guard}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">No entries match this filter.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
