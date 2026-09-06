import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, StatCard, Button, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import {
  BedIcon,
  WalletIcon,
  CheckSquareIcon,
  WrenchIcon,
  MegaphoneIcon,
  QrIcon,
  UtensilsIcon,
  ArrowRightIcon,
  AlertIcon,
} from "../../../components/dashboard/student/icons";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { useCollection } from "../../../hooks/useCollection";
import { useDocument } from "../../../hooks/useDocument";
import { addDocument } from "../../../firebase/firestore";

export default function Overview() {
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const studentId = user?.uid || "";
  const { data: studentRecord } = useDocument("students", studentId);

  // Fee records are one document per billing period, with `total`/`paid`
  // set directly on each doc (matching the admin/warden Fees pages and the
  // CSV import schema) — not a list of `amount` line items, and not
  // ordered by a `date` field the schema doesn't have.
  const fees = useStudentCollection("fees", studentId, { orderByField: "dueDate" });
  const attendance = useStudentCollection("attendance", studentId, { orderByField: "date" });
  const complaints = useStudentCollection("complaints", studentId, { orderByField: "date" });
  const gatePasses = useStudentCollection("gatePasses", studentId, { orderByField: "from" });
  const notices = useCollection("notices", { orderByField: "date", limitCount: 3 });

  const myAllocation = profile?.room
    ? profile
    : { status: "Waiting", room: "—", bed: "—", wing: "Not allotted", floor: "" };

  const feeTotal = fees.items.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const feePaid = fees.items.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const feeRemaining = Math.max(feeTotal - feePaid, 0);
  const nextDueFee = fees.items.find((f) => (Number(f.total) || 0) > (Number(f.paid) || 0));

  const weekAvgAttendance = attendance.items.length
    ? Math.round((attendance.items.filter((a) => a.status === "Present").length / attendance.items.length) * 100)
    : null;

  const openComplaints = complaints.items.filter((c) => c.status !== "Resolved").length;
  const activePass = gatePasses.items.find((p) => p.status === "Approved");

  const [sosSending, setSosSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosNote, setSosNote] = useState("");
  const [showSosForm, setShowSosForm] = useState(false);

  async function raiseSos(e) {
    e?.preventDefault();
    setSosSending(true);
    try {
      const now = new Date();
      await addDocument("sosAlerts", {
        studentId,
        studentName: profile?.name || user?.email,
        block: profile?.hostelResidence || studentRecord?.wing || "",
        room: studentRecord?.room || "",
        note: sosNote.trim() || "SOS raised from dashboard — no additional details given.",
        status: "Active",
        time: now.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }),
        timeSort: now.toISOString(),
      });
      setSosSent(true);
      setSosNote("");
      setShowSosForm(false);
      setTimeout(() => setSosSent(false), 6000);
    } catch (err) {
      console.error("Failed to raise SOS alert:", err);
    } finally {
      setSosSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-300">Welcome back,</p>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{displayName}</h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm text-slate-300">
              <span>{myAllocation.room}</span>
              <span className="text-slate-500">·</span>
              <span>{myAllocation.bed}</span>
              <span className="text-slate-500">·</span>
              <span>{myAllocation.wing}, {myAllocation.floor}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard/student/complaints">
              <Button variant="outline" className="border-white/20 text-white hover:border-teal-300 hover:text-teal-300">
                Raise a complaint
              </Button>
            </Link>
            <Link to="/dashboard/student/gate-pass">
              <Button className="bg-teal-500 shadow-teal-900/30 hover:bg-teal-400">Request gate pass</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card className={sosSent ? "border-teal-300 bg-teal-50" : "border-rose-200"}>
        {sosSent ? (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600">
              <AlertIcon />
            </span>
            <p className="text-sm font-medium text-teal-800">
              Your SOS alert has been sent to the warden and security desk. Stay where you are if it's safe to do so.
            </p>
          </div>
        ) : showSosForm ? (
          <form onSubmit={raiseSos} className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-ink">What's happening? (optional, but helps security respond faster)</p>
            <textarea
              className={`${inputCls} min-h-[70px] resize-none`}
              placeholder="e.g. Medical emergency in Room B-204…"
              value={sosNote}
              onChange={(e) => setSosNote(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={sosSending} className="bg-rose-600 hover:bg-rose-500">
                {sosSending ? "Sending…" : "Send SOS now"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowSosForm(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                <AlertIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">In an emergency?</p>
                <p className="text-xs text-slate-500">This alerts the warden and security desk immediately with your room location.</p>
              </div>
            </div>
            <Button onClick={() => setShowSosForm(true)} className="w-full bg-rose-600 hover:bg-rose-500 sm:w-auto">
              Raise SOS
            </Button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BedIcon />}
          label="Room & bed status"
          value={myAllocation.status}
          sub={`${myAllocation.room} · ${myAllocation.bed}`}
          tone="teal"
        />
        <StatCard
          icon={<WalletIcon />}
          label="Fees remaining"
          value={`₹${feeRemaining.toLocaleString("en-IN")}`}
          sub={feeTotal ? (nextDueFee?.dueDate ? `Due ${nextDueFee.dueDate}` : "") : "No fee record yet"}
          tone="amber"
        />
        <StatCard
          icon={<CheckSquareIcon />}
          label="Attendance this week"
          value={weekAvgAttendance === null ? "—" : `${weekAvgAttendance}%`}
          sub={attendance.items.length ? "Dinner roll call, avg." : "No records yet"}
          tone="teal"
        />
        <StatCard
          icon={<WrenchIcon />}
          label="Open complaints"
          value={openComplaints}
          sub={`${complaints.items.length} total filed`}
          tone={openComplaints > 0 ? "rose" : "teal"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Recent notices" className="lg:col-span-2" action={
          <Link to="/dashboard/student/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            View all <ArrowRightIcon />
          </Link>
        }>
          {notices.loading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading notices…</p>
          ) : notices.isEmpty ? (
            <EmptyState icon={<MegaphoneIcon />} title="No notices yet" description="Notices from the warden or admin will show up here." />
          ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {notices.data.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{n.postedBy} · {n.date}</p>
                </div>
                <Pill tone={n.priority}>{n.priority}</Pill>
              </li>
            ))}
          </ul>
          )}
        </Card>

        <Card title="Active gate pass">
          {activePass ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <QrIcon />
                </span>
                <Pill tone={activePass.status}>{activePass.status}</Pill>
              </div>
              <p className="text-sm font-medium text-ink">{activePass.type}</p>
              <p className="text-xs text-slate-500">{activePass.from} → {activePass.to}</p>
              <Link to="/dashboard/student/gate-pass">
                <Button variant="outline" className="w-full">View QR pass</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <QrIcon />
              </span>
              <p className="text-sm text-slate-400">No active gate pass right now.</p>
              <Link to="/dashboard/student/gate-pass">
                <Button variant="outline">Request one</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/dashboard/student/mess" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 transition-transform duration-200 group-hover:scale-105">
            <UtensilsIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Report a mess issue</p>
            <p className="truncate text-xs text-slate-400">Food, utensils or quality</p>
          </div>
        </Link>
        <Link to="/dashboard/student/inventory" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 transition-transform duration-200 group-hover:scale-105">
            <BedIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Request extra furniture</p>
            <p className="truncate text-xs text-slate-400">Submit an inventory request</p>
          </div>
        </Link>
        <Link to="/dashboard/student/fees" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900 transition-transform duration-200 group-hover:scale-105">
            <WalletIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Pay pending fees</p>
            <p className="truncate text-xs text-slate-400">₹{feeRemaining.toLocaleString("en-IN")} remaining</p>
          </div>
        </Link>
      </div>

      <Card className="bg-slate-50/60">
        <span className="flex items-center gap-2 text-sm text-slate-400">
          <MegaphoneIcon />
          Warden and admin notices, fee reminders, and mess updates all surface here automatically.
        </span>
      </Card>
    </div>
  );
}
