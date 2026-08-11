import { useMemo, useState } from "react";
import { Card, EmptyState, inputCls } from "../../../components/dashboard/student/ui";
import { UsersIcon, SearchIcon } from "../../../components/dashboard/warden/icons";
import { studentDirectory } from "../../../data/wardenMock";

export default function StudentDirectory() {
  const [query, setQuery] = useState("");
  const [wingFilter, setWingFilter] = useState("All");

  const wings = ["All", ...new Set(studentDirectory.map((s) => s.wing))];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return studentDirectory.filter((s) => {
      const matchesQuery =
        !q || s.name.toLowerCase().includes(q) || s.room.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
      const matchesWing = wingFilter === "All" || s.wing === wingFilter;
      return matchesQuery && matchesWing;
    });
  }, [query, wingFilter]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
              <UsersIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Student directory</p>
              <p className="text-sm text-slate-500">{studentDirectory.length} residents across the hostel</p>
            </div>
          </div>
          <div className="flex flex-1 gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                className={`${inputCls} pl-9`}
                placeholder="Search by name, room, or ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select className={inputCls} value={wingFilter} onChange={(e) => setWingFilter(e.target.value)}>
              {wings.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<UsersIcon />} title="No students match your search" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Room</th>
                  <th className="pb-2 font-medium">Wing</th>
                  <th className="pb-2 font-medium">Year / Branch</th>
                  <th className="pb-2 font-medium">Phone</th>
                  <th className="pb-2 pr-0 font-medium">Parent phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 font-medium text-ink">{s.name}</td>
                    <td className="py-2.5 text-slate-500">{s.room}</td>
                    <td className="py-2.5 text-slate-500">{s.wing}</td>
                    <td className="py-2.5 text-slate-500">{s.year} · {s.branch}</td>
                    <td className="py-2.5 text-slate-500">{s.phone}</td>
                    <td className="py-2.5 pr-0 text-slate-500">{s.parentPhone}</td>
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
