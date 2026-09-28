import { useMemo, useState } from "react";
import { serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, StatCard, inputCls } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { QrIcon, CheckIcon, XIcon } from "../../../components/dashboard/warden/icons";
import { useCollection } from "../../../hooks/useCollection";
import { updateDocument } from "../../../firebase/firestore";

const statusFilters = ["All Statuses", "Pending", "Approved", "Rejected", "Completed"];
const validityFilters = ["Any date", "Active now", "Upcoming", "Expired"];

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Same "what does this pass's window mean right now" logic the Student
// page's pickActivePass already uses, just exposed per-pass here so it can
// back a filter dropdown instead of picking one card to show. A pass with
// unparseable/missing dates is left out of Active/Upcoming/Expired (it
// only ever shows under "Any date"), rather than being guessed into one.
function getValidity(pass, now) {
  const from = parseDate(pass.from);
  const to = parseDate(pass.to);
  if (!from && !to) return null;
  if (to && now > to) return "Expired";
  if (from && now < from) return "Upcoming";
  return "Active now";
}

export default function GatePasses() {
  const { user, profile } = useAuth();
  const passesQuery = useCollection("gatePasses", { orderByField: "from" });
  const passes = passesQuery.data;
  const wingFilters = ["All Wings", ...Array.from(new Set(passes.map((p) => p.wing).filter(Boolean)))];

  const [wingFilter, setWingFilter] = useState("All Wings");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [validityFilter, setValidityFilter] = useState("Any date");

  const filtered = useMemo(() => {
    const now = new Date();
    return passes.filter((p) => {
      const wingOk = wingFilter === "All Wings" || p.wing === wingFilter;
      const statusOk = statusFilter === "All Statuses" || p.status === statusFilter;
      const validityOk = validityFilter === "Any date" || getValidity(p, now) === validityFilter;
      return wingOk && statusOk && validityOk;
    });
  }, [passes, wingFilter, statusFilter, validityFilter]);

  const pendingCount = passes.filter((p) => p.status === "Pending").length;
  const outCount = passes.filter((p) => p.tripState === "Out").length;

  // Ids currently being written — guards against a double-click firing two
  // writes for the same pass before the first one's snapshot comes back,
  // and is what disables that row's buttons while the update is in flight.
  const [processingIds, setProcessingIds] = useState(() => new Set());

  async function decide(pass, nextStatus) {
    // The pass must still be Pending, and not already mid-update, for this
    // click to do anything — closes the window for a duplicate approval/
    // rejection from a repeated click, a second browser tab, or a stale
    // render. Firestore stays the single source of truth throughout: this
    // always updates the same gatePasses/{id} document, never creates a
    // new one.
    if (pass.status !== "Pending" || processingIds.has(pass.id)) return;

    setProcessingIds((prev) => new Set(prev).add(pass.id));
    const staffName = profile?.name || user?.email || "Warden";
    const payload =
      nextStatus === "Approved"
        ? { status: "Approved", approvedBy: staffName, approvedAt: serverTimestamp() }
        : { status: "Rejected", rejectedBy: staffName, rejectedAt: serverTimestamp() };

    try {
      await updateDocument("gatePasses", pass.id, payload);
    } catch (err) {
      console.error("Failed to update gate pass:", err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(pass.id);
        return next;
      });
    }
  }

  const columns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (p) => (
        <>
          <p className="font-medium text-ink">{p.studentName}</p>
          <p className="text-xs text-slate-400">{p.wing || "—"}, {p.room || "—"}</p>
        </>
      ),
    },
    {
      key: "type",
      label: "Type & reason",
      render: (p) => (
        <>
          <p>{p.type}</p>
          <p className="text-xs text-slate-400">{p.reason}</p>
        </>
      ),
    },
    { key: "from", label: "Window", sortable: true, render: (p) => `${p.from} → ${p.to}` },
    { key: "tripState", label: "Trip" },
    {
      key: "status",
      label: "Status / action",
      render: (p) => {
        const busy = processingIds.has(p.id);
        return (
          <div className="flex items-center gap-2">
            <Pill tone={p.status}>{p.status}</Pill>
            {p.status === "Pending" && (
              <>
                <Button variant="outline" className="px-2.5 py-1 text-xs" onClick={() => decide(p, "Approved")} disabled={busy}>
                  <CheckIcon />
                </Button>
                <Button variant="danger" className="px-2.5 py-1 text-xs" onClick={() => decide(p, "Rejected")} disabled={busy}>
                  <XIcon />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <QrIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Gate pass management</p>
            <p className="text-sm text-slate-500">Review, approve, and track outings for students in your wings.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<QrIcon />} label="Pending requests" value={pendingCount} sub="Awaiting your decision" tone={pendingCount > 0 ? "amber" : "teal"} />
        <StatCard icon={<CheckIcon />} label="Currently out" value={outCount} sub="Students off-campus on a pass" tone="navy" />
        <StatCard icon={<QrIcon />} label="Total this term" value={passes.length} sub="Gate passes recorded" tone="teal" />
      </div>

      <Card title="Gate pass requests">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <select className={`${inputCls} sm:w-48`} value={wingFilter} onChange={(e) => setWingFilter(e.target.value)}>
            {wingFilters.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className={`${inputCls} sm:w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={`${inputCls} sm:w-48`} value={validityFilter} onChange={(e) => setValidityFilter(e.target.value)}>
            {validityFilters.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={passesQuery.loading}
          searchKeys={["studentName", "type", "wing", "room"]}
          searchPlaceholder="Search gate passes…"
          emptyTitle="No gate passes yet"
          emptyDescription="Requests submitted by students will show up here."
          emptyIcon={<QrIcon />}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
