import { useEffect, useRef, useState } from "react";
import { collection, doc, query, where, getDoc, getDocs, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { getDemoStudentCollection, isDemoMode } from "../data/demoFixtures";
import { readErrorMessage } from "../firebase/readErrorMessage";
import { publishReadStatus } from "../firebase/readStatusEvents";
import { dateKey } from "../utils/dateKey";

const studentDataCache = new Map();
const STUDENT_CACHE_MS = 20_000;
function sortStudentRecords(items, field, direction = "desc") {
  const key = field || "createdAt";
  const dir = direction === "asc" ? 1 : -1;
  const millis = (value) => value?.toMillis ? value.toMillis() : value?.toDate ? value.toDate().getTime() : Date.parse(value) || 0;
  return [...items].sort((a, b) => {
    const preferred = direction === "asc" ? key : "createdAt";
    const fallback = direction === "asc" ? "createdAt" : key;
    const leftValue = a[preferred] ?? a[fallback] ?? a.registrationDate ?? a.registeredAt ?? a.date ?? a.from ?? "";
    const rightValue = b[preferred] ?? b[fallback] ?? b.registrationDate ?? b.registeredAt ?? b.date ?? b.from ?? "";
    const left = millis(leftValue); const right = millis(rightValue);
    if (left || right) return (left - right) * dir;
    return String(leftValue).localeCompare(String(rightValue)) * dir;
  });
}
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
    // Current gate movement is stored as one document whose document ID is
    // the student UID (`inOutStatus/{studentId}`), unlike history collections
    // which are queried by a studentId field. Read that exact path so the
    // parent/student ownership rule can validate the document directly.
    if (collectionName === "inOutStatus") {
      const statusRef = doc(db, collectionName, studentId);
      const publishDocument = (snap) => {
        const items = snap.exists() ? [{ id: snap.id, ...snap.data() }] : [];
        if (items.length) studentDataCache.set(statusKey, { savedAt: Date.now(), items });
        else studentDataCache.delete(statusKey);
        setState({ loading: false, items, error: "" });
      };
      const publishError = (err) => {
        console.error(`Failed to load ${collectionName}:`, err);
        const message = readErrorMessage(err, "Couldn't load this right now.");
        publishReadStatus(statusKey, message, collectionName);
        setState({ loading: false, items: [], error: message });
      };
      if (live) {
        const unsubscribe = onSnapshot(statusRef, (snap) => {
          if (cancelled) return;
          publishReadStatus(statusKey, "", collectionName);
          publishDocument(snap);
        }, (err) => { if (!cancelled) publishError(err); });
        return () => { cancelled = true; unsubscribe(); publishReadStatus(statusKey, "", collectionName); };
      }
      getDoc(statusRef)
        .then((snap) => {
          if (cancelled) return;
          publishReadStatus(statusKey, "", collectionName);
          publishDocument(snap);
        })
        .catch((err) => { if (!cancelled) publishError(err); });
      return () => { cancelled = true; publishReadStatus(statusKey, "", collectionName); };
    }

    if (live) {
      const unsubscribe = onSnapshot(q, (snap) => {
        if (cancelled) return;
        publishReadStatus(statusKey, "", collectionName);
        const items = snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, ...(data.date ? { date: dateKey(data.date) || data.date } : {}) };
        });
        const sortedItems = sortStudentRecords(items, orderByField, orderByDirection);
        setState({ loading: false, items: sortedItems, error: "" });
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
        const sortedItems = sortStudentRecords(items, orderByField, orderByDirection);
        if (sortedItems.length) studentDataCache.set(statusKey, { savedAt: Date.now(), items: sortedItems });
        setState({ loading: false, items: sortedItems, error: "" });
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
