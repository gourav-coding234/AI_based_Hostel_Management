import { useCallback, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useCollection } from "./useCollection";

/**
 * The signed-in parent's own `parentNotifications` (fee reminders, leave
 * decisions), live. The query is always constrained to parentId == own uid,
 * which is exactly what the Firestore rule requires for a parent to read.
 *
 * markRead / markAllRead write ONLY `read` and `readAt` — the one update the
 * rules allow a parent to make on a notification (see firestore.rules).
 * Deliberately does not use updateDocument(), which would also stamp
 * `updatedAt` and be rejected by that narrow rule.
 */
export function useParentNotifications() {
  const { user } = useAuth();
  const uid = user?.uid || "";
  const query = useCollection("parentNotifications", {
    where: [["parentId", "==", uid]],
    skip: !uid,
  });
  const [markError, setMarkError] = useState("");

  const unreadCount = query.data.filter((n) => n.read !== true).length;

  const markRead = useCallback(async (id) => {
    setMarkError("");
    try {
      await updateDoc(doc(db, "parentNotifications", id), { read: true, readAt: serverTimestamp() });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
      setMarkError("Couldn't mark that as read. Please try again.");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setMarkError("");
    const unread = query.data.filter((n) => n.read !== true);
    if (unread.length === 0) return;
    try {
      // One update per document (not a batch) so each write is checked by the
      // rules on its own, with no shared per-request rule-lookup limit.
      await Promise.all(
        unread.map((n) => updateDoc(doc(db, "parentNotifications", n.id), { read: true, readAt: serverTimestamp() }))
      );
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
      setMarkError("Couldn't mark those as read. Please try again.");
    }
  }, [query.data]);

  return { ...query, unreadCount, markRead, markAllRead, markError };
}
