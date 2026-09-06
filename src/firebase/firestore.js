import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as fbLimit,
  writeBatch,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
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
 * Updates fields on a user's own profile document (users/{uid}). Merges, so
 * it only touches the fields passed in and leaves role/email/hostelResidence
 * etc. untouched. Intended for self-service edits (name, DOB, photo, phone,
 * ...) — callers are responsible for only ever passing the signed-in user's
 * own uid. Enforcing that server-side is a Firestore security-rules concern,
 * separate from this client helper.
 */
export async function updateUserProfile(uid, data) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
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

/**
 * Adds one document to a collection with an auto-generated id, stamping
 * `createdAt`/`createdBy` so records written from the UI (a raised
 * complaint, a gate-pass request, an uploaded row, ...) are traceable.
 */
export async function addDocument(collectionName, data, createdBy) {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    ...(createdBy ? { createdBy } : {}),
  });
  return ref.id;
}

/** Merges fields onto an existing document. */
export async function updateDocument(collectionName, id, data) {
  await setDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Writes one entry to the `auditLogs` collection, read by the admin Audit
 * Log page. Fire-and-forget by design (callers .catch() this) — a logging
 * failure should never block or roll back the real action it's describing.
 */
export async function logAudit({ actor, action, target }) {
  await addDoc(collection(db, "auditLogs"), {
    actor: actor || "Unknown",
    action,
    target: target || "",
    createdAt: serverTimestamp(),
  });
}

/** Deletes a single document. */
export async function deleteDocument(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

/**
 * Bulk-writes many records into a collection in Firestore batches (max 500
 * writes per batch). Used by the CSV/Excel import flow — this is the only
 * path by which many records get written at once, and it always writes to
 * the real database, never to in-memory/frontend-only state.
 * Returns the number of documents written.
 */
export async function bulkAddDocuments(collectionName, records, createdBy) {
  const CHUNK = 450;
  let written = 0;

  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    for (const record of chunk) {
      const ref = doc(collection(db, collectionName));
      batch.set(ref, {
        ...record,
        createdAt: serverTimestamp(),
        importedBy: createdBy || null,
      });
    }
    await batch.commit();
    written += chunk.length;
  }

  return written;
}

/**
 * Fetches every existing value of one field in a collection — used by the
 * bulk importer to detect rows that would duplicate a record already in
 * Firestore (not just duplicates within the uploaded file itself).
 * Only pulls the one field, not full documents, to keep this cheap.
 */
export async function fetchExistingKeyValues(collectionName, fieldName) {
  const snap = await getDocs(collection(db, collectionName));
  const values = new Set();
  snap.forEach((d) => {
    const v = d.data()?.[fieldName];
    if (v !== undefined && v !== null && v !== "") values.add(String(v));
  });
  return values;
}

/**
 * The `students` collection is special: every reader (RoomBed, both
 * Overview pages, the Firestore rules' isOwnRecord check) expects the
 * document ID to be the student's real Firebase Auth UID, not an
 * auto-generated ID — a plain bulkAddDocuments() here would silently
 * create records nobody's dashboard ever reads. This resolves each row's
 * `email` to the matching `users` doc's UID first, then upserts
 * `students/{uid}` by ID (merge: true, so partial re-imports don't clobber
 * fields the row didn't include, e.g. a bed already allotted separately).
 * Rows whose email doesn't match any existing Student account are
 * reported back as failures rather than silently skipped or misfiled.
 */
export async function bulkUpsertStudentsByEmail(records, createdBy) {
  let written = 0;
  const failed = [];

  for (const record of records) {
    const { email, ...rest } = record;
    if (!email) {
      failed.push({ email: "", reason: "No email given to match against an existing Student account." });
      continue;
    }
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", email), where("role", "==", "Student"), fbLimit(1))
      );
      if (usersSnap.empty) {
        failed.push({ email, reason: "No Student account with this email exists yet — create the account first." });
        continue;
      }
      const uid = usersSnap.docs[0].id;
      await setDoc(
        doc(db, "students", uid),
        { ...rest, importedBy: createdBy || null, updatedAt: serverTimestamp() },
        { merge: true }
      );
      written += 1;
    } catch (err) {
      failed.push({ email, reason: err.message || "Failed to write this row." });
    }
  }

  return { written, failed };
}
