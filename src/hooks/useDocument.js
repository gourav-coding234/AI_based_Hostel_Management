import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Real-time single-document hook, e.g. useDocument("messMenu", "current").
 * Returns { data, loading, error } — data is null (not fake/placeholder
 * content) if the document doesn't exist yet.
 */
export function useDocument(collectionName, id) {
  const [state, setState] = useState({ loading: Boolean(id), data: null, error: "" });

  useEffect(() => {
    if (!id) {
      setState({ loading: false, data: null, error: "" });
      return undefined;
    }
    setState((s) => ({ ...s, loading: true, error: "" }));

    const unsubscribe = onSnapshot(
      doc(db, collectionName, id),
      (snap) => {
        setState({ loading: false, data: snap.exists() ? { id: snap.id, ...snap.data() } : null, error: "" });
      },
      (err) => {
        console.error(`Failed to load ${collectionName}/${id}:`, err);
        setState({ loading: false, data: null, error: "Couldn't load this right now." });
      }
    );

    return unsubscribe;
  }, [collectionName, id]);

  return state;
}
