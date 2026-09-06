import { useMemo } from "react";
import { Card, Pill } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import DataTable from "../../../components/ui/DataTable";
import { UsersIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";
import { updateDocument } from "../../../firebase/firestore";

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
}

export default function Wardens() {
  const { data, loading } = useCollections({
    wardens: { name: "users", options: { where: [["role", "==", "Warden"]] } },
    blocks: { name: "blocks" },
    students: { name: "students" },
  });
  const wardens = data.wardens;
  const blocks = data.blocks;
  const blockOptions = ["Unassigned", ...blocks.map((b) => b.name)];

  const studentCountByBlock = useMemo(() => {
    const counts = {};
    data.students.forEach((s) => {
      const key = s.hostelResidence || s.block;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [data.students]);

  async function reassign(id, block) {
    try {
      await updateDocument("users", id, { block });
    } catch (err) {
      console.error("Failed to reassign warden:", err);
    }
  }

  const columns = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "email",
      label: "Contact",
      render: (w) => (
        <>
          <p>{w.email}</p>
          <p className="text-xs text-slate-400">{w.phone || "—"}</p>
        </>
      ),
    },
    {
      key: "block",
      label: "Block",
      render: (w) => (
        <select
          value={w.block || "Unassigned"}
          onChange={(e) => reassign(w.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
        >
          {blockOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      ),
    },
    { key: "students", label: "Students", render: (w) => studentCountByBlock[w.block] || 0 },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (w) => {
        const joined = tsToDate(w.createdAt);
        return joined ? joined.toLocaleDateString("en-IN") : "—";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (w) => <Pill tone={w.status === "Inactive" ? "Pending" : "Approved"}>{w.status || "Active"}</Pill>,
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <UsersIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Warden roster</p>
            <p className="text-sm text-slate-500">Assign wardens to blocks and see their current workload.</p>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={wardens}
          loading={loading}
          searchKeys={["name", "email", "block"]}
          searchPlaceholder="Search wardens…"
          emptyTitle="No wardens added yet"
          emptyDescription="Create warden accounts from Manage Users to see them here."
          emptyIcon={<UsersIcon />}
          pageSize={12}
        />
      </Card>

      <Card title="Block coverage">
        {blocks.length === 0 ? (
          <EmptyState title="No blocks yet" description="Add blocks on the Blocks page or via Data Import." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {blocks.map((b) => (
              <div key={b.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-ink">{b.name}</p>
                <p className="text-xs text-slate-400">{b.type} hostel</p>
                <p className="mt-3 text-sm text-slate-600">Warden: <span className="font-medium text-ink">{b.warden || "Unassigned"}</span></p>
                <p className="text-xs text-slate-400">{b.occupiedBeds || 0}/{b.totalBeds || 0} beds occupied</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
