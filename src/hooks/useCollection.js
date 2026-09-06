import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit as fbLimit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Real-time hook for a whole Firestore collection (used by Admin/Warden/
 * Security views that need to see every record, not just one student's).
 * Returns { data, loading, error, isEmpty } and NEVER falls back to mock
 * data — if the collection is empty or unreachable, `data` stays `[]` and
 * the page is responsible for rendering an <EmptyState /> / <ErrorState />.
 *
 * Uses onSnapshot so records written elsewhere (another tab, a CSV import,
 * a warden action) appear immediately without a manual refresh.
 *
 * options: { where: [[field, op, value]], orderByField, orderByDirection, limitCount }
 */
export function useCollection(collectionName, options = {}) {
  const { where: whereClauses = [], orderByField, orderByDirection = "desc", limitCount, skip = false } = options;
  const depsKey = JSON.stringify({ collectionName, whereClauses, orderByField, orderByDirection, limitCount, skip });

  const [state, setState] = useState({ loading: !skip, data: [], error: "" });

  useEffect(() => {
    if (skip) {
      setState({ loading: false, data: [], error: "" });
      return undefined;
    }

    setState((s) => ({ ...s, loading: true, error: "" }));

    const constraints = whereClauses.map(([field, op, value]) => where(field, op, value));
    if (orderByField) constraints.push(orderBy(orderByField, orderByDirection));
    if (limitCount) constraints.push(fbLimit(limitCount));

    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setState({ loading: false, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: "" });
      },
      (err) => {
        console.error(`Failed to load ${collectionName}:`, err);
        setState({ loading: false, data: [], error: "Couldn't load this from the database. Please refresh." });
      }
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  return { ...state, isEmpty: !state.loading && !state.error && state.data.length === 0 };
}

/**
 * Real-time hook for several collections at once — convenient for Overview
 * pages that need 3-5 collections to compute their stats. Not a single
 * combined query; just bundles loading/error state from parallel listeners.
 * spec: { key: { name, options } }
 */
export function useCollections(spec) {
  const keys = Object.keys(spec);
  const depsKey = JSON.stringify(spec);
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: Object.fromEntries(keys.map((k) => [k, []])),
  });

  useEffect(() => {
    const loadedFlags = Object.fromEntries(keys.map((k) => [k, false]));
    const dataRef = Object.fromEntries(keys.map((k) => [k, []]));
    let errored = false;

    setState((s) => ({ ...s, loading: true, error: "" }));

    const unsubscribers = keys.map((k) => {
      const { name, options = {} } = spec[k];
      const { where: whereClauses = [], orderByField, orderByDirection = "desc", limitCount } = options;
      const constraints = whereClauses.map(([field, op, value]) => where(field, op, value));
      if (orderByField) constraints.push(orderBy(orderByField, orderByDirection));
      if (limitCount) constraints.push(fbLimit(limitCount));
      const q = query(collection(db, name), ...constraints);

      return onSnapshot(
        q,
        (snap) => {
          dataRef[k] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          loadedFlags[k] = true;
          const allLoaded = keys.every((kk) => loadedFlags[kk]);
          setState({ loading: !allLoaded, error: errored ? "Couldn't load this from the database. Please refresh." : "", data: { ...dataRef } });
        },
        (err) => {
          console.error(`Failed to load ${name}:`, err);
          errored = true;
          loadedFlags[k] = true;
          setState((s) => ({ ...s, loading: false, error: "Couldn't load this from the database. Please refresh." }));
        }
      );
    });

    return () => unsubscribers.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  return state;
}
