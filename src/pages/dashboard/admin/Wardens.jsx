import { useState } from "react";
import { Card, Pill, Button } from "../../../components/dashboard/student/ui";
import { UsersIcon } from "../../../components/dashboard/admin/icons";
import { wardens as wardensSeed, blocks } from "../../../data/adminMock";

const blockOptions = ["Unassigned", ...blocks.map((b) => b.name)];

export default function Wardens() {
  const [wardens, setWardens] = useState(wardensSeed);

  function reassign(id, block) {
    setWardens((list) => list.map((w) => (w.id === id ? { ...w, block } : w)));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <UsersIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Warden roster</p>
              <p className="text-sm text-slate-500">Assign wardens to blocks and see their current workload.</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Changes here are for review — reassignment isn't wired to Firestore yet.</p>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Contact</th>
                <th className="pb-2 pr-4 font-medium">Block</th>
                <th className="pb-2 pr-4 font-medium">Students</th>
                <th className="pb-2 pr-4 font-medium">Joined</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {wardens.map((w) => (
                <tr key={w.id}>
                  <td className="py-3 pr-4 font-medium text-ink">{w.name}</td>
                  <td className="py-3 pr-4 text-slate-500">
                    <p>{w.email}</p>
                    <p className="text-xs text-slate-400">{w.phone}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={w.block}
                      onChange={(e) => reassign(w.id, e.target.value)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                    >
                      {blockOptions.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{w.studentsManaged}</td>
                  <td className="py-3 pr-4 text-slate-500">{w.joined}</td>
                  <td className="py-3">
                    <Pill tone={w.status === "Active" ? "Approved" : "Pending"}>{w.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Block coverage">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {blocks.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-ink">{b.name}</p>
              <p className="text-xs text-slate-400">{b.type} hostel</p>
              <p className="mt-3 text-sm text-slate-600">Warden: <span className="font-medium text-ink">{b.warden}</span></p>
              <p className="text-xs text-slate-400">{b.occupiedBeds}/{b.totalBeds} beds occupied</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
