import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit as fbLimit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { getDemoCollection, isDemoMode } from "../data/demoFixtures";
import { readErrorMessage } from "../firebase/readErrorMessage";
import { publishReadStatus } from "../firebase/readStatusEvents";

/**
 * Real-time hook for a whole Firestore collection (used by Admin/Warden/
 * Security views that need to see every record, not just one student's).
 * Returns { data, loading, error, isEmpty }. Normal mode reads only Firestore;
 * the explicitly enabled `?demo=1` presentation mode supplies labeled local
 * samples. In normal mode, an empty or unreachable collection stays empty and
 * the page can render an <EmptyState /> / <ErrorState />.
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
  const demo = isDemoMode();

  useEffect(() => {
    if (skip) {
      setState({ loading: false, data: [], error: "" });
      return undefined;
    }

    if (demo) {
      setState({ loading: false, data: getDemoCollection(collectionName, { where: whereClauses, orderByField, orderByDirection, limitCount }), error: "" });
      return undefined;
    }

    setState((s) => ({ ...s, loading: true, error: "" }));

    const constraints = whereClauses.map(([field, op, value]) => where(field, op, value));
    if (orderByField) constraints.push(orderBy(orderByField, orderByDirection));
    if (limitCount) constraints.push(fbLimit(limitCount));

    const q = query(collection(db, collectionName), ...constraints);

    const statusKey = `collection:${collectionName}:${depsKey}`;
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        publishReadStatus(statusKey, "", collectionName);
        setState({ loading: false, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: "" });
      },
      (err) => {
        console.error(`Failed to load ${collectionName}:`, err);
        const message = readErrorMessage(err);
        publishReadStatus(statusKey, message, collectionName);
        setState({ loading: false, data: [], error: message });
      }
    );

    return () => { unsubscribe(); publishReadStatus(statusKey, "", collectionName); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, demo]);

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
  const demo = isDemoMode();

  useEffect(() => {
    if (demo) {
      const data = Object.fromEntries(keys.map((k) => {
        const { name, options = {} } = spec[k];
        return [k, getDemoCollection(name, options)];
      }));
      setState({ loading: false, error: "", data });
      return undefined;
    }

    const loadedFlags = Object.fromEntries(keys.map((k) => [k, false]));
    const dataRef = Object.fromEntries(keys.map((k) => [k, []]));
    let errored = false;
    let errorMessage = "";

    setState((s) => ({ ...s, loading: true, error: "" }));

    const statusKeys = [];
    const unsubscribers = keys.map((k) => {
      const { name, options = {} } = spec[k];
      const statusKey = `collections:${name}:${k}:${depsKey}`;
      statusKeys.push(statusKey);
      const { where: whereClauses = [], orderByField, orderByDirection = "desc", limitCount } = options;
      const constraints = whereClauses.map(([field, op, value]) => where(field, op, value));
      if (orderByField) constraints.push(orderBy(orderByField, orderByDirection));
      if (limitCount) constraints.push(fbLimit(limitCount));
      const q = query(collection(db, name), ...constraints);

      return onSnapshot(
        q,
        (snap) => {
          publishReadStatus(statusKey, "", name);
          dataRef[k] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          loadedFlags[k] = true;
          const allLoaded = keys.every((kk) => loadedFlags[kk]);
          setState({ loading: !allLoaded, error: errored ? errorMessage : "", data: { ...dataRef } });
        },
        (err) => {
          console.error(`Failed to load ${name}:`, err);
          errored = true;
          loadedFlags[k] = true;
          const message = readErrorMessage(err);
          errorMessage = message;
          publishReadStatus(statusKey, message, name);
          setState((s) => ({ ...s, loading: false, error: message }));
        }
      );
    });

    return () => {
      unsubscribers.forEach((u) => u());
      statusKeys.forEach((key, index) => publishReadStatus(key, "", spec[keys[index]].name));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, demo]);

  return state;
}
