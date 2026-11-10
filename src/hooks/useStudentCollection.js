import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { getDemoStudentCollection, isDemoMode } from "../data/demoFixtures";
import { readErrorMessage } from "../firebase/readErrorMessage";
import { publishReadStatus } from "../firebase/readStatusEvents";

/**
 * Real-time hook for a collection filtered to one student's documents (fees,
 * attendance, gatePasses, complaints, ...) via `where("studentId","==",studentId)`.
 * This is the query-side half of "parents/students only see their own
 * data" — the Firestore security rules are what actually enforce it, this
 * hook is just the client asking for the right slice, kept live via
 * onSnapshot so a new complaint/request appears the moment it's written.
 * Optional ordering is performed client-side to avoid requiring a separate
 * composite index for every student collection plus its sort field.
 *
 * Pass studentId = "" (not yet known / not linked) to skip fetching.
 */
export function useStudentCollection(collectionName, studentId, options = {}) {
  const { orderByField, orderByDirection = "desc" } = options;
  const [state, setState] = useState({ loading: Boolean(studentId), items: [], error: "" });
  const demo = isDemoMode();

  useEffect(() => {
    if (demo) {
      setState({ loading: false, items: getDemoStudentCollection(collectionName, studentId || undefined), error: "" });
      return undefined;
    }
    if (!studentId) {
      setState({ loading: false, items: [], error: "" });
      return undefined;
    }

    setState((s) => ({ ...s, loading: true, error: "" }));

    // Student scoped compound queries (studentId + date/from/dueDate) need
    // one composite index per field. Query only by studentId and sort the
    // small, per-student result set locally so a missing index can never
    // silently make a valid attendance record look like no data.
    const constraints = [where("studentId", "==", studentId)];
    const q = query(collection(db, collectionName), ...constraints);

    const statusKey = `student-collection:${collectionName}:${studentId}`;
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        publishReadStatus(statusKey, "", collectionName);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (orderByField) {
          const sortValue = (value) => value?.toDate ? value.toDate().getTime() : value;
          const direction = orderByDirection === "asc" ? 1 : -1;
          items.sort((a, b) => {
            const left = sortValue(a[orderByField]);
            const right = sortValue(b[orderByField]);
            if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
            return String(left ?? "").localeCompare(String(right ?? "")) * direction;
          });
        }
        setState({ loading: false, items, error: "" });
      },
      (err) => {
        console.error(`Failed to load ${collectionName}:`, err);
        const message = readErrorMessage(err, "Couldn't load this right now.");
        publishReadStatus(statusKey, message, collectionName);
        setState({ loading: false, items: [], error: message });
      }
    );

    return () => { unsubscribe(); publishReadStatus(statusKey, "", collectionName); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, studentId, orderByField, orderByDirection, demo]);

  return state;
}
