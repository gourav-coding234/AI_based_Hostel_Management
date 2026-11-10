import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { getDemoDocument, isDemoMode } from "../data/demoFixtures";
import { readErrorMessage } from "../firebase/readErrorMessage";
import { publishReadStatus } from "../firebase/readStatusEvents";

/**
 * Real-time single-document hook, e.g. useDocument("messMenu", "current").
 * Returns { data, loading, error } — in normal mode, data is null if the
 * document doesn't exist. The labeled presentation demo can supply a sample.
 */
export function useDocument(collectionName, id) {
  const [state, setState] = useState({ loading: Boolean(id), data: null, error: "" });
  const demo = isDemoMode();

  useEffect(() => {
    if (demo) {
      setState({ loading: false, data: getDemoDocument(collectionName, id), error: "" });
      return undefined;
    }
    if (!id) {
      setState({ loading: false, data: null, error: "" });
      return undefined;
    }
    setState((s) => ({ ...s, loading: true, error: "" }));

    const statusKey = `document:${collectionName}:${id}`;
    const unsubscribe = onSnapshot(
      doc(db, collectionName, id),
      (snap) => {
        publishReadStatus(statusKey, "", `${collectionName}/${id}`);
        setState({ loading: false, data: snap.exists() ? { id: snap.id, ...snap.data() } : null, error: "" });
      },
      (err) => {
        console.error(`Failed to load ${collectionName}/${id}:`, err);
        const message = readErrorMessage(err, "Couldn't load this right now.");
        publishReadStatus(statusKey, message, `${collectionName}/${id}`);
        setState({ loading: false, data: null, error: message });
      }
    );

    return () => { unsubscribe(); publishReadStatus(statusKey, "", `${collectionName}/${id}`); };
  }, [collectionName, id, demo]);

  return state;
}
