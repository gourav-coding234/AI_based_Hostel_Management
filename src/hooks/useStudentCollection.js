import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Real-time hook for a collection filtered to one student's documents (fees,
 * attendance, gatePasses, complaints, ...) via `where("studentId","==",studentId)`.
 * This is the query-side half of "parents/students only see their own
 * data" — the Firestore security rules are what actually enforce it, this
 * hook is just the client asking for the right slice, kept live via
 * onSnapshot so a new complaint/request appears the moment it's written.
 *
 * Pass studentId = "" (not yet known / not linked) to skip fetching.
 */
export function useStudentCollection(collectionName, studentId, options = {}) {
  const { orderByField, orderByDirection = "desc" } = options;
  const [state, setState] = useState({ loading: Boolean(studentId), items: [], error: "" });

  useEffect(() => {
    if (!studentId) {
      setState({ loading: false, items: [], error: "" });
      return undefined;
    }

    setState((s) => ({ ...s, loading: true, error: "" }));

    const constraints = [where("studentId", "==", studentId)];
    if (orderByField) constraints.push(orderBy(orderByField, orderByDirection));
    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setState({ loading: false, items: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: "" });
      },
      (err) => {
        console.error(`Failed to load ${collectionName}:`, err);
        setState({ loading: false, items: [], error: "Couldn't load this right now." });
      }
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, studentId, orderByField, orderByDirection]);

  return state;
}
