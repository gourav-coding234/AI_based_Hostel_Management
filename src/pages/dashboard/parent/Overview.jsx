import { Link } from "react-router-dom";
import { Card, Pill, ProgressBar } from "../../../components/dashboard/student/ui";
import { HomeIcon, BedIcon, WalletIcon, CheckSquareIcon, QrIcon, ArrowRightIcon } from "../../../components/dashboard/parent/icons";
import { myChild } from "../../../data/parentMock";
import { feeSummary, attendanceLog, initialGatePasses, notices } from "../../../data/studentMock";

function initials(name) {
  return name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function inr(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ParentOverview() {
  const attendancePct = Math.round(
    (attendanceLog.filter((r) => r.status === "Present").length / attendanceLog.length) * 100
  );
  const feeRemaining = feeSummary.total - feeSummary.paid;
  const activePass = initialGatePasses.find((p) => p.status === "Approved");

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-navy-950 text-white">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-500/20 font-display text-xl font-semibold text-teal-200 ring-4 ring-white/10">
            {initials(myChild.name)}
          </span>
          <div>
            <p className="text-sm text-slate-300">Keeping an eye on</p>
            <h2 className="font-display text-xl font-semibold">{myChild.name}</h2>
            <p className="mt-0.5 text-sm text-slate-300">{myChild.studentId} · {myChild.course}</p>
            <p className="mt-0.5 text-xs text-slate-400">{myChild.wing} · {myChild.room}, {myChild.bed}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/dashboard/parent/attendance" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <CheckSquareIcon />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold text-ink">{attendancePct}%</p>
          <p className="mt-0.5 text-sm text-slate-500">Attendance overall</p>
        </Link>
        <Link to="/dashboard/parent/fees" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
            <WalletIcon />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold text-ink">{inr(feeRemaining)}</p>
          <p className="mt-0.5 text-sm text-slate-500">Fee remaining</p>
          <p className="text-xs text-slate-400">Due {feeSummary.dueDate}</p>
        </Link>
        <Link to="/dashboard/parent/gate-pass" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
            <QrIcon />
          </span>
          <p className="mt-4 font-display text-lg font-semibold text-ink">{activePass ? "Active" : "None"}</p>
          <p className="mt-0.5 text-sm text-slate-500">Gate pass status</p>
        </Link>
        <Link to="/dashboard/parent/room" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <BedIcon />
          </span>
          <p className="mt-4 font-display text-lg font-semibold text-ink">{myChild.room}</p>
          <p className="mt-0.5 text-sm text-slate-500">{myChild.bed} · {myChild.wing}</p>
        </Link>
      </div>

      <Card title="Fee status">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-500">{inr(feeSummary.paid)} paid of {inr(feeSummary.total)}</span>
          <span className="font-semibold text-ink">{Math.round((feeSummary.paid / feeSummary.total) * 100)}%</span>
        </div>
        <ProgressBar value={feeSummary.paid} max={feeSummary.total} tone={feeRemaining > 0 ? "amber" : "teal"} />
      </Card>

      <Card title="Recent notices" action={
        <Link to="/dashboard/parent/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
          View all <ArrowRightIcon />
        </Link>
      }>
        <ul className="flex flex-col divide-y divide-slate-100">
          {notices.slice(0, 3).map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{n.postedBy} · {n.date}</p>
              </div>
              <Pill tone={n.priority}>{n.priority}</Pill>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
