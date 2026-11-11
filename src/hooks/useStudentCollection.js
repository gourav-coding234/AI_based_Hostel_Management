import { useEffect, useRef, useState } from "react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { getDemoStudentCollection, isDemoMode } from "../data/demoFixtures";
import { readErrorMessage } from "../firebase/readErrorMessage";
import { publishReadStatus } from "../firebase/readStatusEvents";
import { dateKey } from "../utils/dateKey";

const studentDataCache = new Map();
const STUDENT_CACHE_MS = 20_000;
export function clearStudentCollectionCache(studentId = "") {
  for (const key of studentDataCache.keys()) {
    if (!studentId || key.endsWith(`:${studentId}`)) studentDataCache.delete(key);
  }
}

/**
 * Hook for a collection filtered to one student's documents (fees,
 * attendance, gatePasses, complaints, ...) via `where("studentId","==",studentId)`.
 * This is the query-side half of "parents/students only see their own
 * data" — the Firestore security rules are what actually enforce it, this
 * hook is just the client asking for the right slice. Dashboard reads are
 * one-shot and briefly cached to avoid repeat reads while moving between pages.
 * Optional ordering is performed client-side to avoid requiring a separate
 * composite index for every student collection plus its sort field.
 *
 * Pass studentId = "" (not yet known / not linked) to skip fetching.
 */
export function useStudentCollection(collectionName, studentId, options = {}) {
  const { orderByField, orderByDirection = "desc", live = false } = options;
  const [state, setState] = useState({ loading: Boolean(studentId), items: [], error: "" });
  const demo = isDemoMode();
  const previousStudentId = useRef("");

  useEffect(() => {
    if (demo) {
      setState({ loading: false, items: getDemoStudentCollection(collectionName, studentId || undefined), error: "" });
      return undefined;
    }
    if (!studentId) {
      previousStudentId.current = "";
      setState({ loading: false, items: [], error: "" });
      return undefined;
    }

    if (previousStudentId.current !== studentId) {
      clearStudentCollectionCache(studentId);
      previousStudentId.current = studentId;
    }
    setState((s) => ({ ...s, loading: true, error: "" }));

    // Student scoped compound queries (studentId + date/from/dueDate) need
    // one composite index per field. Query only by studentId and sort the
    // small, per-student result set locally so a missing index can never
    // silently make a valid attendance record look like no data.
    const constraints = [where("studentId", "==", studentId)];
    const q = query(collection(db, collectionName), ...constraints);

    const statusKey = `student-collection:${auth?.currentUser?.uid || ""}:${collectionName}:${studentId}`;
    const cached = studentDataCache.get(statusKey);
    if (!live && cached && Date.now() - cached.savedAt < STUDENT_CACHE_MS) {
      setState({ loading: false, items: cached.items, error: "" });
      return undefined;
    }

    let cancelled = false;
    if (live) {
      const unsubscribe = onSnapshot(q, (snap) => {
        if (cancelled) return;
        publishReadStatus(statusKey, "", collectionName);
        const items = snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, ...(data.date ? { date: dateKey(data.date) || data.date } : {}) };
        });
        if (orderByField) {
          const sortValue = (value) => value?.toDate ? value.toDate().getTime() : value;
          const direction = orderByDirection === "asc" ? 1 : -1;
          items.sort((a, b) => {
            const left = sortValue(a[orderByField]); const right = sortValue(b[orderByField]);
            if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
            return String(left ?? "").localeCompare(String(right ?? "")) * direction;
          });
        }
        setState({ loading: false, items, error: "" });
      }, (err) => {
        if (cancelled) return;
        console.error(`Failed to load ${collectionName}:`, err);
        const message = readErrorMessage(err, "Couldn't load this right now.");
        publishReadStatus(statusKey, message, collectionName);
        setState({ loading: false, items: [], error: message });
      });
      return () => { cancelled = true; unsubscribe(); publishReadStatus(statusKey, "", collectionName); };
    }
    getDocs(q)
      .then((snap) => {
        if (cancelled) return;
        publishReadStatus(statusKey, "", collectionName);
        const items = snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, ...(data.date ? { date: dateKey(data.date) || data.date } : {}) };
        });
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
        if (items.length) studentDataCache.set(statusKey, { savedAt: Date.now(), items });
        setState({ loading: false, items, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`Failed to load ${collectionName}:`, err);
        const message = readErrorMessage(err, "Couldn't load this right now.");
        publishReadStatus(statusKey, message, collectionName);
        setState({ loading: false, items: [], error: message });
      });

    return () => { cancelled = true; publishReadStatus(statusKey, "", collectionName); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, studentId, orderByField, orderByDirection, demo, live]);

  return state;
}
