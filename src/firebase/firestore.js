import { doc, getDoc, collection, query, where, getDocs, orderBy, limit as fbLimit } from "firebase/firestore";
import { db } from "./config";

/**
 * Fetches a user's profile document from the `users` collection.
 * Shape: { name, email, role, hostelResidence, linkedStudentId }
 */
export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Generic single-document fetch, e.g. getDocument("students", "s27")
 */
export async function getDocument(collectionName, id) {
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Generic collection fetch with optional where/orderBy/limit.
 * options: { whereClauses: [[field, op, value]], orderByField, orderByDirection, limitCount }
 */
export async function getCollection(collectionName, options = {}) {
  const { whereClauses = [], orderByField, orderByDirection = "desc", limitCount } = options;
  const constraints = whereClauses.map(([field, op, value]) => where(field, op, value));
  if (orderByField) constraints.push(orderBy(orderByField, orderByDirection));
  if (limitCount) constraints.push(fbLimit(limitCount));

  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
