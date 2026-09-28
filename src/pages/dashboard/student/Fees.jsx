import { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, ProgressBar, Pill } from "../../../components/dashboard/student/ui";
import { AsyncSection } from "../../../components/ui/DataState";
import { WalletIcon } from "../../../components/dashboard/student/icons";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { computeFeeStatus } from "../../../utils/fees";

function inr(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

// Group label used for fee records that don't carry a semester/academicYear
// field — every fee record posted before this feature existed falls here,
// so nothing about them breaks.
const UNGROUPED_LABEL = "Other fees";

export default function Fees() {
  const { user } = useAuth();
  const studentId = user?.uid || "";
  // Fee records are one document per billing period, with `total` and
  // `paid` set directly on each doc — matching the admin/warden Fees pages
  // and the CSV import schema exactly, rather than a separate list of
  // payment line-items. This is a live listener (onSnapshot under the
  // hood), so a fee the office posts later appears here on its own.
  const feesQuery = useStudentCollection("fees", studentId, { orderByField: "dueDate" });

  // Defense-in-depth: the query above already scopes reads to
  // `where("studentId","==",studentId)`, and Firestore rules separately
  // only allow a student to read a fee document where studentId matches
  // their own auth uid. This filter guarantees that even if a returned
  // document were ever missing that constraint, another student's — or
  // another room/hostel resident's — fee record is dropped before it can
  // render. Status is also recomputed the same way Admin/Warden do, from
  // total/paid/dueDate, rather than trusting a stored `status` field that
  // can go stale the moment a due date passes.
  const records = useMemo(
    () =>
      feesQuery.items
        .filter((f) => f.studentId === studentId)
        .map((f) => ({
          ...f,
          remaining: Math.max((Number(f.total) || 0) - (Number(f.paid) || 0), 0),
          status: computeFeeStatus(f),
        })),
    [feesQuery.items, studentId]
  );

  const total = records.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const paid = records.reduce((sum, f) => sum + (Number(f.paid) || 0), 0);
  const remaining = Math.max(total - paid, 0);
  const pct = total ? Math.round((paid / total) * 100) : 0;
  const nextDue = records.find((f) => f.remaining > 0);

  // Group by semester (and academic year, when present) so a student with
  // several billing periods can tell them apart. The set of groups is
  // whatever values actually appear in the data — never a fixed list — and
  // records with neither field (every record today, until the office
  // starts setting one) simply fall into one group, rendering exactly like
  // the original single table.
  const groups = useMemo(() => {
    const map = new Map();
    records.forEach((f) => {
      const label = f.semester
        ? f.academicYear
          ? `${f.semester} · ${f.academicYear}`
          : f.semester
        : UNGROUPED_LABEL;
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(f);
    });
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [records]);

  const showGroupLabels = groups.length > 1 || (groups.length === 1 && groups[0].label !== UNGROUPED_LABEL);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
            <WalletIcon />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-slate-500">Total hostel & mess fee</p>
              <p className="font-display text-lg font-semibold text-ink">{total ? inr(total) : "—"}</p>
            </div>
            {total ? (
              <>
                <div className="mt-3">
                  <ProgressBar value={paid} max={total} tone={remaining > 0 ? "amber" : "teal"} />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                  <span>{pct}% paid</span>
                  <span>{inr(paid)} paid · {inr(remaining)} remaining</span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No fee record has been posted for you yet. Contact the fees office.</p>
            )}
          </div>
        </div>
      </Card>

      {total > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total fee</p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{inr(total)}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount paid</p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-teal-600">{inr(paid)}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending</p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-amber-600">{inr(remaining)}</p>
            {nextDue?.dueDate && (
              <p className="mt-1 text-xs text-slate-400">
                Due by {nextDue.dueDate}
                {nextDue.semester ? ` · ${nextDue.semester}` : ""}
              </p>
            )}
          </Card>
        </div>
      )}

      <Card title="Fee records">
        <AsyncSection
          loading={feesQuery.loading}
          error={feesQuery.error}
          isEmpty={records.length === 0}
          emptyTitle="No fee records yet"
          emptyDescription="Fee periods the office posts against your account will show up here."
          emptyIcon={<WalletIcon />}
        >
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.label}>
                {showGroupLabels && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</p>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-2 font-medium">Due date</th>
                        <th className="pb-2 font-medium">Total</th>
                        <th className="pb-2 font-medium">Paid</th>
                        <th className="pb-2 font-medium">Remaining</th>
                        <th className="pb-2 pr-0 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((f) => (
                        <tr key={f.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="py-2.5 text-slate-500">{f.dueDate || "—"}</td>
                          <td className="py-2.5 font-medium text-ink">{inr(f.total)}</td>
                          <td className="py-2.5 text-teal-700">{inr(f.paid)}</td>
                          <td className="py-2.5 text-amber-700">{inr(f.remaining)}</td>
                          <td className="py-2.5 pr-0 text-right"><Pill tone={f.status}>{f.status}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </AsyncSection>
      </Card>
    </div>
  );
}
