import { useMemo, useState } from "react";
import { Card, Pill } from "../../../components/dashboard/student/ui";
import DataTable from "../../../components/ui/DataTable";
import { UsersIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";
import { updateDocument } from "../../../firebase/firestore";
import { HOSTELS, hostelForStudent, wardenHostel } from "../../../utils/hostels";

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
}

export default function Wardens() {
  const { data, loading } = useCollections({
    wardens: { name: "users", options: { where: [["role", "==", "Warden"]] } },
    students: { name: "students" },
  });
  const wardens = data.wardens;
  const hostelOptions = ["Unassigned", ...HOSTELS];
  const [assignments, setAssignments] = useState({});
  const [savingWardenId, setSavingWardenId] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");

  const studentCountByHostel = useMemo(() => {
    const counts = {};
    data.students.forEach((s) => {
      const key = hostelForStudent(s);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [data.students]);

  async function reassign(id, hostel) {
    const previous = assignments[id];
    setAssignments((current) => ({ ...current, [id]: hostel }));
    setSavingWardenId(id);
    setAssignmentMessage("");
    try {
      await updateDocument("users", id, { hostel: hostel === "Unassigned" ? "" : hostel });
    } catch (err) {
      console.error("Failed to reassign warden:", err);
      setAssignments((current) => {
        const next = { ...current };
        if (previous === undefined) delete next[id];
        else next[id] = previous;
        return next;
      });
      setAssignmentMessage(err?.code === "permission-denied"
        ? "Firebase denied the assignment. Check that you are signed in as Admin and have published the current Firestore rules."
        : "The hostel assignment could not be saved. Check the connection and try again.");
    } finally {
      setSavingWardenId("");
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
      key: "hostel",
      label: "Assigned hostel",
      render: (w) => (
        <div>
          <select
            value={assignments[w.id] ?? (wardenHostel(w) || "Unassigned")}
            disabled={savingWardenId === w.id}
            onChange={(e) => reassign(w.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 disabled:opacity-60"
          >
            {hostelOptions.map((hostel) => (
              <option key={hostel} value={hostel}>{hostel}</option>
            ))}
          </select>
          {savingWardenId === w.id && <p className="mt-1 text-xs text-slate-500">Saving…</p>}
        </div>
      ),
    },
    { key: "students", label: "Students", render: (w) => studentCountByHostel[wardenHostel({ ...w, hostel: assignments[w.id] ?? w.hostel })] || 0 },
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
            <p className="text-sm text-slate-500">Assign each warden to the Boys Hostel or Girls Hostel.</p>
          </div>
        </div>
      </Card>

      <Card>
        {assignmentMessage && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{assignmentMessage}</p>}
        <DataTable
          columns={columns}
          rows={wardens}
          loading={loading}
          searchKeys={["name", "email", "hostel"]}
          searchPlaceholder="Search wardens…"
          emptyTitle="No wardens added yet"
          emptyDescription="Create warden accounts from Manage Users to see them here."
          emptyIcon={<UsersIcon />}
          pageSize={12}
        />
      </Card>

    </div>
  );
}
