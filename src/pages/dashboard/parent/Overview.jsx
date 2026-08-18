import { Link } from "react-router-dom";
import { Card, Pill, ProgressBar } from "../../../components/dashboard/student/ui";
import { BedIcon, WalletIcon, CheckSquareIcon, QrIcon, ArrowRightIcon } from "../../../components/dashboard/parent/icons";
import LinkedStudentStatus from "../../../components/dashboard/parent/LinkedStudentStatus";
import SampleDataBadge from "../../../components/dashboard/parent/SampleDataBadge";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { notices } from "../../../data/studentMock";
import { demoTotalFee, demoFeePayments, demoAttendance, demoGatePasses, demoRoomRecord } from "../../../data/parentDemoFallback";

function initials(name) {
  const source = (name || "?").trim();
  return source.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

export default function ParentOverview() {
  const linked = useLinkedStudent();
  const { studentUser, studentRecord, linkedStudentId } = linked;

  const fees = useStudentCollection("fees", linkedStudentId, { orderByField: "date" });
  const attendance = useStudentCollection("attendance", linkedStudentId, { orderByField: "date" });
  const gatePasses = useStudentCollection("gatePasses", linkedStudentId, { orderByField: "from" });

  const status = <LinkedStudentStatus {...linked} />;
  if (status) return status;

  // Real data always wins. Sample data only fills in a section that's
  // genuinely empty so far — never overrides anything real.
  const usingSampleFees = !studentRecord?.totalFee && fees.items.length === 0;
  const usingSampleAttendance = attendance.items.length === 0;
  const usingSampleGatePasses = gatePasses.items.length === 0;
  const usingSampleRoom = !studentRecord?.room;

  const feePayments = fees.items.length ? fees.items : usingSampleFees ? demoFeePayments : fees.items;
  const totalFee = studentRecord?.totalFee || (usingSampleFees ? demoTotalFee : 0);
  const attendanceLog = attendance.items.length ? attendance.items : usingSampleAttendance ? demoAttendance : attendance.items;
  const passList = gatePasses.items.length ? gatePasses.items : usingSampleGatePasses ? demoGatePasses : gatePasses.items;
  const room = studentRecord?.room ? studentRecord : usingSampleRoom ? demoRoomRecord : studentRecord;

  const paid = feePayments.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const feeRemaining = Math.max(totalFee - paid, 0);
  const presentCount = attendanceLog.filter((a) => a.status === "Present").length;
  const attendancePct = attendanceLog.length ? Math.round((presentCount / attendanceLog.length) * 100) : null;
  const activePass = passList.find((p) => p.status === "Approved");

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-navy-950 text-white">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-500/20 font-display text-xl font-semibold text-teal-200 ring-4 ring-white/10">
            {initials(studentUser?.name)}
          </span>
          <div>
            <p className="text-sm text-slate-300">Keeping an eye on</p>
            <h2 className="font-display text-xl font-semibold">{studentUser?.name || studentUser?.email}</h2>
            <p className="mt-0.5 text-sm text-slate-300">{studentUser?.email}</p>
            {room?.room ? (
              <p className="mt-0.5 text-xs text-slate-400">
                {room.wing} · {room.room}, {room.bed}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-400">Room not yet allotted</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/dashboard/parent/attendance" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <CheckSquareIcon />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold text-ink">{attendancePct === null ? "—" : `${attendancePct}%`}</p>
          <p className="mt-0.5 text-sm text-slate-500">Attendance overall</p>
        </Link>
        <Link to="/dashboard/parent/fees" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
            <WalletIcon />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold text-ink">{totalFee ? inr(feeRemaining) : "—"}</p>
          <p className="mt-0.5 text-sm text-slate-500">Fee remaining</p>
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
          <p className="mt-4 font-display text-lg font-semibold text-ink">{room?.room || "—"}</p>
          <p className="mt-0.5 text-sm text-slate-500">{room?.bed || "Not allotted"} {room?.wing ? `· ${room.wing}` : ""}</p>
        </Link>
      </div>

      <Card title="Fee status" action={usingSampleFees && totalFee ? <SampleDataBadge /> : null}>
        {totalFee ? (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">{inr(paid)} paid of {inr(totalFee)}</span>
              <span className="font-semibold text-ink">{Math.round((paid / totalFee) * 100)}%</span>
            </div>
            <ProgressBar value={paid} max={totalFee} tone={feeRemaining > 0 ? "amber" : "teal"} />
          </>
        ) : (
          <p className="text-sm text-slate-400">No fee record has been posted for your child yet.</p>
        )}
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
