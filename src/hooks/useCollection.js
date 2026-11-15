import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit as fbLimit, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { getDemoCollection, isDemoMode } from "../data/demoFixtures";
import { readErrorMessage } from "../firebase/readErrorMessage";
import { publishReadStatus } from "../firebase/readStatusEvents";

const overviewCache = new Map();
// Keep the last successful query result for the lifetime of the app. When a
// dashboard page is revisited, render its known data immediately while the
// Firestore listener reconnects and refreshes it in the background.
const queryResultCache = new Map();
const QUERY_CACHE_LIMIT = 60;

function sortableMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortRecords(records, field, direction = "desc") {
  const dir = direction === "asc" ? 1 : -1;
  return [...records].sort((a, b) => {
    const preferred = direction === "asc" ? field : "createdAt";
    const fallback = direction === "asc" ? "createdAt" : field;
    const av = a[preferred] ?? a[fallback] ?? a.registrationDate ?? a.registeredAt ?? a.date ?? a.from ?? "";
    const bv = b[preferred] ?? b[fallback] ?? b.registrationDate ?? b.registeredAt ?? b.date ?? b.from ?? "";
    const left = sortableMillis(av);
    const right = sortableMillis(bv);
    if (left || right) return (left - right) * dir || String(b.id).localeCompare(String(a.id));
    return String(av).localeCompare(String(bv)) * dir || String(b.id).localeCompare(String(a.id));
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("hostel:firestore-data-changed", () => {
    overviewCache.clear();
    queryResultCache.clear();
  });
}

function readQueryCache(key) {
  const entry = queryResultCache.get(key);
  if (!entry) return null;
  // Refresh insertion order so active/recent pages survive cache eviction.
  queryResultCache.delete(key);
  queryResultCache.set(key, entry);
  return entry.state;
}

function writeQueryCache(key, state) {
  queryResultCache.delete(key);
  queryResultCache.set(key, { state, savedAt: Date.now() });
  while (queryResultCache.size > QUERY_CACHE_LIMIT) {
    queryResultCache.delete(queryResultCache.keys().next().value);
  }
}

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
  const uid = auth?.currentUser?.uid || "";
  const depsKey = JSON.stringify({ collectionName, whereClauses, orderByField, orderByDirection, limitCount, skip, uid });
  const cachedState = readQueryCache(`query:${depsKey}`);

  const [state, setState] = useState(() => cachedState || { loading: !skip, data: [], error: "" });
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

    const cached = readQueryCache(`query:${depsKey}`);
    setState(cached || { loading: true, data: [], error: "" });

    const constraints = whereClauses.map(([field, op, value]) => where(field, op, value));
    if (orderByField) constraints.push(orderBy(orderByField, orderByDirection));
    if (limitCount) constraints.push(fbLimit(limitCount));

    const q = query(collection(db, collectionName), ...constraints);

    const statusKey = `collection:${collectionName}:${depsKey}`;
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        publishReadStatus(statusKey, "", collectionName);
        const nextState = { loading: false, data: sortRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })), orderByField || "createdAt", orderByField ? orderByDirection : "desc"), error: "" };
        writeQueryCache(`query:${depsKey}`, nextState);
        setState(nextState);
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
export function useCollections(spec, { live = true, maxDocs = 100, cacheMs = 0 } = {}) {
  const keys = Object.keys(spec);
  const observedCollections = JSON.stringify(keys.map((key) => spec[key].name).sort());
  const [refreshVersion, setRefreshVersion] = useState(0);
  const depsKey = JSON.stringify({ spec, live, maxDocs, uid: auth?.currentUser?.uid || "", refreshVersion });
  const cachedLiveState = live ? readQueryCache(`collections:${depsKey}`) : null;
  const [state, setState] = useState({
    ...(cachedLiveState || {
      loading: true,
      error: "",
      data: Object.fromEntries(keys.map((k) => [k, []])),
    }),
  });
  const demo = isDemoMode();

  useEffect(() => {
    if (live || demo || typeof window === "undefined") return undefined;
    const collections = new Set(JSON.parse(observedCollections));
    function refreshChangedCollection(event) {
      const changed = event.detail?.collection;
      if (!changed || collections.has(changed)) setRefreshVersion((version) => version + 1);
    }
    window.addEventListener("hostel:firestore-data-changed", refreshChangedCollection);
    return () => window.removeEventListener("hostel:firestore-data-changed", refreshChangedCollection);
  }, [live, demo, observedCollections]);

  useEffect(() => {
    if (demo) {
      const data = Object.fromEntries(keys.map((k) => {
        const { name, options = {} } = spec[k];
        return [k, getDemoCollection(name, options)];
      }));
      setState({ loading: false, error: "", data });
      return undefined;
    }

    if (!live) {
      let cancelled = false;
      const cacheKey = `overview:${depsKey}`;
      const cached = overviewCache.get(cacheKey);
      if (cached && Date.now() - cached.savedAt < cacheMs) {
        setState(cached.state);
        return undefined;
      }

      setState((s) => ({ ...s, loading: true, error: "" }));
      const statusKeys = [];
      Promise.all(keys.map(async (k) => {
        const { name, options = {} } = spec[k];
        const statusKey = `overview:${name}:${k}:${depsKey}`;
        statusKeys.push(statusKey);
        const { where: whereClauses = [], orderByField, orderByDirection = "desc", limitCount } = options;
        const constraints = whereClauses.map(([field, op, value]) => where(field, op, value));
        if (orderByField) constraints.push(orderBy(orderByField, orderByDirection));
        constraints.push(fbLimit(Math.min(limitCount || maxDocs, maxDocs)));
        try {
          const snap = await getDocs(query(collection(db, name), ...constraints));
          publishReadStatus(statusKey, "", name);
          return { key: k, records: sortRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })), orderByField || "createdAt", orderByField ? orderByDirection : "desc"), error: "" };
        } catch (err) {
          console.error(`Failed to load ${name}:`, err);
          const message = readErrorMessage(err);
          publishReadStatus(statusKey, message, name);
          return { key: k, records: [], error: message };
        }
      })).then((results) => {
        if (cancelled) return;
        const data = Object.fromEntries(keys.map((k) => [k, []]));
        let error = "";
        results.forEach(({ key, records, error: itemError }) => {
          data[key] = records;
          if (!error && itemError) error = itemError;
        });
        const nextState = { loading: false, error, data };
        overviewCache.set(cacheKey, { savedAt: Date.now(), state: nextState });
        setState(nextState);
      });

      return () => {
        cancelled = true;
        statusKeys.forEach((key, index) => publishReadStatus(key, "", spec[keys[index]].name));
      };
    }

    const loadedFlags = Object.fromEntries(keys.map((k) => [k, false]));
    const dataRef = Object.fromEntries(keys.map((k) => [k, []]));
    let errored = false;
    let errorMessage = "";

    const cached = readQueryCache(`collections:${depsKey}`);
    if (cached) {
      Object.assign(dataRef, cached.data);
      keys.forEach((k) => { loadedFlags[k] = true; });
      setState(cached);
    } else {
      setState((s) => ({ ...s, loading: true, error: "" }));
    }

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
          dataRef[k] = sortRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })), orderByField || "createdAt", orderByField ? orderByDirection : "desc");
          loadedFlags[k] = true;
          const allLoaded = keys.every((kk) => loadedFlags[kk]);
          const nextState = { loading: !allLoaded, error: errored ? errorMessage : "", data: { ...dataRef } };
          if (allLoaded) writeQueryCache(`collections:${depsKey}`, nextState);
          setState(nextState);
        },
        (err) => {
          console.error(`Failed to load ${name}:`, err);
          errored = true;
          loadedFlags[k] = true;
          const message = readErrorMessage(err);
          errorMessage = message;
          publishReadStatus(statusKey, message, name);
          const nextState = { loading: false, error: message, data: { ...dataRef } };
          writeQueryCache(`collections:${depsKey}`, nextState);
          setState(nextState);
        }
      );
    });

    return () => {
      unsubscribers.forEach((u) => u());
      statusKeys.forEach((key, index) => publishReadStatus(key, "", spec[keys[index]].name));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, demo, live, maxDocs, cacheMs]);

  return state;
}
