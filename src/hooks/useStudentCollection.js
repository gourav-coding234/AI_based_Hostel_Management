import { useEffect, useState } from "react";
import { getCollection } from "../firebase/firestore";

/**
 * Fetches a collection filtered to one student's documents (fees,
 * attendance, gatePasses, complaints, ...) via `where("studentId","==",studentId)`.
 * This is the query-side half of "parents only see their own child's data" —
 * the Firestore security rules are what actually enforce it, this hook is
 * just the client asking for the right slice.
 *
 * Pass studentId = "" (not yet known / not linked) to skip fetching.
 */
export function useStudentCollection(collectionName, studentId, options = {}) {
  const { orderByField, orderByDirection = "desc", limitCount } = options;
  const [state, setState] = useState({ loading: Boolean(studentId), items: [], error: "" });

  useEffect(() => {
    let cancelled = false;

    if (!studentId) {
      setState({ loading: false, items: [], error: "" });
      return undefined;
    }

    setState((s) => ({ ...s, loading: true, error: "" }));

    getCollection(collectionName, {
      whereClauses: [["studentId", "==", studentId]],
      orderByField,
      orderByDirection,
      limitCount,
    })
      .then((items) => {
        if (cancelled) return;
        setState({ loading: false, items, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`Failed to load ${collectionName}:`, err);
        setState({ loading: false, items: [], error: "Couldn't load this right now." });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, studentId, orderByField, orderByDirection, limitCount]);

  return state;
}
