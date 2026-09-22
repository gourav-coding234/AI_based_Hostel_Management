import { useMemo } from "react";
import { ROLES } from "../roles";
import { useCollections } from "./useCollection";

function tsToMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

// Pending-item queries per role — each becomes one notification if count > 0.
// Kept deliberately small: this reads real Firestore collections, not a
// separate "notifications" collection, so there's no unread/read tracking
// yet (every item is just "this exists and is pending right now").
const ROLE_WATCH = {
  [ROLES.ADMIN]: [
    { key: "complaints", name: "complaints", label: (n) => `${n} open complaint${n === 1 ? "" : "s"}`, to: "/dashboard/admin/complaints", filter: (d) => d.status !== "Resolved" },
    { key: "leaveRequests", name: "leaveRequests", label: (n) => `${n} leave request${n === 1 ? "" : "s"} pending`, to: "/dashboard/admin/leave", filter: (d) => d.status === "Pending" },
    { key: "gatePasses", name: "gatePasses", label: (n) => `${n} gate pass${n === 1 ? "" : "es"} pending`, to: "/dashboard/admin/gate-passes", filter: (d) => d.status === "Pending" },
  ],
  [ROLES.WARDEN]: [
    { key: "complaints", name: "complaints", label: (n) => `${n} open complaint${n === 1 ? "" : "s"}`, to: "/dashboard/warden/complaints", filter: (d) => d.status !== "Resolved" },
    { key: "leaveRequests", name: "leaveRequests", label: (n) => `${n} leave request${n === 1 ? "" : "s"} pending`, to: "/dashboard/warden/leave", filter: (d) => d.status === "Pending" },
    { key: "roomRequests", name: "roomRequests", label: (n) => `${n} room request${n === 1 ? "" : "s"} pending`, to: "/dashboard/warden/rooms", filter: (d) => d.status === "Pending" },
  ],
  [ROLES.SECURITY]: [
    { key: "incidents", name: "incidents", label: (n) => `${n} incident${n === 1 ? "" : "s"} open`, to: "/dashboard/security/incidents", filter: (d) => d.status !== "Resolved" },
  ],
  [ROLES.STUDENT]: [
    { key: "complaints", name: "complaints", label: (n) => `${n} of your complaints still open`, to: "/dashboard/student/complaints", filter: (d) => d.status !== "Resolved" },
  ],
  [ROLES.PARENT]: [],
};

/**
 * Returns a small, real, role-relevant notification list: the most recent
 * published notices, plus one line per pending-item category that has at
 * least one entry. Nothing here is fabricated — an empty database means an
 * empty (not fake) notification list.
 */
// Shared stable reference for roles with nothing to watch.
const EMPTY_WATCH = [];

const NOTICES_PATH = {
  [ROLES.ADMIN]: "/dashboard/admin/notices",
  [ROLES.WARDEN]: "/dashboard/warden/notices",
  [ROLES.SECURITY]: "/dashboard/security/notices",
  [ROLES.STUDENT]: "/dashboard/student/notices",
  [ROLES.PARENT]: "/dashboard/parent/notices",
};

export function useNotifications(role) {
  // ROLE_WATCH is a module-level constant, so the array identity is stable
  // per role — but the `|| []` fallback would allocate a fresh array on
  // every render and retrigger the memo below. Pinning it to one shared
  // empty array keeps the dependency stable.
  const watch = ROLE_WATCH[role] || EMPTY_WATCH;

  const spec = useMemo(() => {
    const next = {
      notices: { name: "notices", options: { orderByField: "date", limitCount: 5 } },
    };
    watch.forEach((w) => {
      next[w.key] = { name: w.name };
    });
    return next;
  }, [watch]);

  const { data, loading } = useCollections(spec);

  const items = useMemo(() => {
    const noticeItems = (data.notices || [])
      .slice()
      .sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt))
      .slice(0, 3)
      .map((n) => ({
        id: `notice-${n.id}`,
        title: n.title,
        subtitle: `Notice · ${n.date || ""}`,
        to: NOTICES_PATH[role] || "/dashboard",
      }));

    const pendingItems = watch
      .map((w) => {
        const count = (data[w.key] || []).filter(w.filter).length;
        if (count === 0) return null;
        return { id: `pending-${w.key}`, title: w.label(count), subtitle: "Needs attention", to: w.to };
      })
      .filter(Boolean);

    return [...pendingItems, ...noticeItems];
  }, [data, watch, role]);

  return { items, loading };
}
