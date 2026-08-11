import { doc, getDoc, deleteDoc, collection, query, where, getDocs, orderBy, limit as fbLimit } from "firebase/firestore";
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
 * Deletes a user's profile document from the `users` collection.
 *
 * Note (client-SDK limitation): this removes the Firestore profile — which
 * is what every route/role check in this app reads — so the account
 * immediately loses access everywhere. It does NOT delete the underlying
 * Firebase Auth credential; the client SDK can only delete the currently
 * signed-in user, never an arbitrary other user. Fully deleting the Auth
 * account requires the Firebase Admin SDK in a Cloud Function.
 */
export async function deleteUserProfile(uid) {
  await deleteDoc(doc(db, "users", uid));
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
