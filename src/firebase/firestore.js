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
  runTransaction,
} from "firebase/firestore";
import { db } from "./config";
import { computeFeeStatus } from "../utils/fees";

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
 * Warden/Security "Take Attendance": writes one `attendance` doc per
 * student for one date — the same collection Admin Data Import and the
 * Student/Parent attendance pages already read, never a second store.
 *
 * `existingIdByStudentId` (a Map<studentId, attendanceDocId>) is built by
 * the caller from the attendance docs already loaded for that date,
 * however they originally got there (a warden's earlier save, an Admin
 * CSV import, ...). When a student already has a doc for this date, that
 * doc is updated in place; otherwise one is created. This is what makes
 * "save" idempotent — marking the same date again always corrects the
 * same records instead of creating duplicates.
 */
export async function saveAttendanceForDate(records, existingIdByStudentId, markedBy) {
  const CHUNK = 450;
  let written = 0;

  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    for (const r of chunk) {
      const existingId = existingIdByStudentId.get(r.studentId);
      // New records get a deterministic id (studentId_date), so two staff
      // (e.g. Warden + Security) creating the same student/date at the same
      // moment write ONE document instead of two. Existing records —
      // including older auto-id ones — are updated in place by their id.
      const ref = existingId ? doc(db, "attendance", existingId) : doc(db, "attendance", `${r.studentId}_${r.date}`);
      batch.set(
        ref,
        {
          studentId: r.studentId,
          studentName: r.studentName,
          wing: r.wing || "",
          room: r.room || "",
          bed: r.bed || "",
          date: r.date,
          status: r.status,
          markedBy: markedBy?.uid || null,
          markedByName: markedBy?.name || "",
          markedAt: serverTimestamp(),
        },
        { merge: true }
      );
      written += 1;
    }
    await batch.commit();
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

/**
 * Resolves one row's `uid` (preferred) or `email` to an existing Student
 * account's UID — shared lookup used by bulkUpsertHostelAssignments so a
 * row is only ever matched against a real, existing Student account.
 * Never creates a `users` doc or Auth credential itself.
 */
async function resolveStudentUid(uid, email) {
  if (uid) {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists() || userSnap.data()?.role !== "Student") {
      return { uid: null, reason: "No Student account with this UID exists." };
    }
    return { uid, reason: "" };
  }
  const usersSnap = await getDocs(
    query(collection(db, "users"), where("email", "==", email), where("role", "==", "Student"), fbLimit(1))
  );
  if (usersSnap.empty) {
    return { uid: null, reason: "No Student account with this email exists." };
  }
  return { uid: usersSnap.docs[0].id, reason: "" };
}

/**
 * Warden Student Directory CSV upload: updates ONLY the hostel-assignment
 * fields (wing, room, bed) on an existing `students/{uid}` doc — the exact
 * same fields RoomAllotment's allot()/vacate() write, so both pages stay in
 * sync against one underlying record instead of a second room/bed store.
 *
 * Deliberately narrow:
 *  - Resolves each row to an existing Student account by `uid` (preferred)
 *    or `email` (see bulkUpsertStudentsByEmail for the same email-matching
 *    logic); a row that doesn't resolve is reported as a failure, never
 *    used to create a new account.
 *  - Never writes role, email, password, or anything under `users/{uid}` —
 *    only ever calls setDoc on `students/{uid}` with wing/room/bed.
 *  - merge: true, and a field is only included in the write when the row
 *    actually supplied it, so a partial row (e.g. wing-only) never blanks
 *    out an existing room/bed, and unrelated profile fields are untouched.
 *
 * records: [{ uid?, email?, wing?, room?, bed? }] — already validated
 * (required identifier, valid room/bed, no in-file duplicates, no bed
 * clashes) by the caller before this ever runs.
 */
export async function bulkUpsertHostelAssignments(records, createdBy) {
  let written = 0;
  const failed = [];

  for (const record of records) {
    const { uid, email, wing, room, bed } = record;
    const identifier = uid || email || "";
    if (!uid && !email) {
      failed.push({ identifier: "", reason: "No Student UID or email given to identify the student." });
      continue;
    }

    try {
      const resolved = await resolveStudentUid(uid, email);
      if (!resolved.uid) {
        failed.push({ identifier, reason: resolved.reason });
        continue;
      }

      const update = { importedBy: createdBy || null, updatedAt: serverTimestamp() };
      if (wing) update.wing = wing;
      if (room) update.room = room;
      if (bed) update.bed = bed;
      if (room || bed) update.allottedOn = new Date().toISOString().slice(0, 10);

      await setDoc(doc(db, "students", resolved.uid), update, { merge: true });
      written += 1;
    } catch (err) {
      failed.push({ identifier, reason: err.message || "Failed to write this row." });
    }
  }

  return { written, failed };
}

function inrText(n) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}

/**
 * Records a payment against an EXISTING fees/{feeId} document, inside a
 * transaction so the new paid amount / status are computed from the
 * document's current values (never a stale table row), a second warden or
 * admin recording at the same moment can't overwrite each other, and it
 * can only ever update — never create — a fee record. Remaining is always
 * total - paid; status comes from the shared computeFeeStatus().
 * Throws Error("INVALID_AMOUNT") if amount <= 0 or exceeds what's owed.
 */
export async function recordFeePayment(feeId, amount, actorName) {
  const ref = doc(db, "fees", feeId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("FEE_NOT_FOUND");
    const fee = snap.data();
    const total = Math.max(Number(fee.total) || 0, 0);
    const paid = Math.max(Number(fee.paid) || 0, 0);
    const pay = Number(amount);
    if (!(pay > 0) || pay > Math.max(total - paid, 0)) throw new Error("INVALID_AMOUNT");

    const newPaid = paid + pay;
    const status = computeFeeStatus({ total, paid: newPaid, dueDate: fee.dueDate });
    tx.update(ref, {
      paid: newPaid,
      status,
      lastPaymentAt: new Date().toISOString(),
      updatedBy: actorName,
      updatedByRole: "Warden",
      updatedAt: serverTimestamp(),
    });
    return { paid: newPaid, remaining: total - newPaid, status };
  });
}

/**
 * Creates a persistent "Fee Reminder" record in `parentNotifications` for
 * each given parent account (resolved by the caller from
 * users/{parentUid}.linkedStudentId), then marks the fee reminderSent —
 * all in ONE transaction, so reminderSent is only ever set when the
 * notification documents really exist.
 *
 * Duplicate protection: the notification id is deterministic
 * (feeId_parentId_YYYY-MM-DD), so repeated clicks / two tabs resolve to
 * the same document — the second attempt finds it and creates nothing.
 * (Firestore rules require the same id shape.) A reminder can be sent
 * again on a later day.
 *
 * Returns { created, alreadySent }.
 */
export async function sendFeeReminder({ feeId, parentIds, actor }) {
  const today = new Date().toISOString().slice(0, 10);
  const feeRef = doc(db, "fees", feeId);
  return runTransaction(db, async (tx) => {
    const feeSnap = await tx.get(feeRef);
    if (!feeSnap.exists()) throw new Error("FEE_NOT_FOUND");
    const fee = feeSnap.data();
    const total = Math.max(Number(fee.total) || 0, 0);
    const paid = Math.max(Number(fee.paid) || 0, 0);
    const amountDue = Math.max(total - paid, 0);
    if (amountDue <= 0) throw new Error("NOTHING_DUE");

    const status = computeFeeStatus({ total, paid, dueDate: fee.dueDate });
    const dueText = fee.dueDate ? ` The due date${status === "Overdue" ? " was" : " is"} ${fee.dueDate}.` : "";
    const title = `Fee reminder: ${inrText(amountDue)} ${status === "Overdue" ? "overdue" : "pending"}`;
    const message =
      `${fee.studentName || "Your child"} has ${inrText(amountDue)} outstanding on the hostel fee ` +
      `(${inrText(paid)} paid of ${inrText(total)}).${dueText} Please clear the balance at the hostel office.`;

    const refs = parentIds.map((pid) => doc(db, "parentNotifications", `${feeId}_${pid}_${today}`));
    const snaps = [];
    for (const r of refs) snaps.push(await tx.get(r));

    let created = 0;
    refs.forEach((ref, i) => {
      if (snaps[i].exists()) return;
      tx.set(ref, {
        parentId: parentIds[i],
        studentId: fee.studentId,
        studentName: fee.studentName || "",
        type: "Fee Reminder",
        title,
        message,
        feeId,
        amountDue,
        dueDate: fee.dueDate || "",
        priority: status === "Overdue" ? "Urgent" : "General",
        date: today,
        createdBy: actor.uid,
        createdByName: actor.name,
        createdByRole: "Warden",
        createdAt: serverTimestamp(),
        read: false,
      });
      created += 1;
    });

    tx.update(feeRef, {
      reminderSent: true,
      reminderSentAt: new Date().toISOString(),
      updatedBy: actor.name,
      updatedByRole: "Warden",
      updatedAt: serverTimestamp(),
    });
    return { created, alreadySent: parentIds.length - created };
  });
}

// ---------------------------------------------------------------------------
// Inventory (actual hostel stock, `inventory`) and student requests for it
// (`inventoryRequests`) are separate collections. These helpers run in
// transactions so quantities are always computed from the document's current
// values and can never go negative, and so request decisions/fulfilment can't
// be applied twice.
// ---------------------------------------------------------------------------

const AUTO_INVENTORY_STATUSES = ["In Stock", "Low Stock", "Out of Stock"];

/** Legacy imported records only have item/location/quantity(/condition). */
export function normalizeInventory(d = {}) {
  const quantity = Math.max(Number(d.quantity) || 0, 0);
  const damaged = Math.max(Number(d.damaged) || 0, 0);
  const available =
    d.available === undefined || d.available === null
      ? Math.max(quantity - damaged, 0)
      : Math.max(Number(d.available) || 0, 0);
  return { quantity, damaged, available };
}

function autoInventoryStatus({ quantity, available }) {
  if (available <= 0) return "Out of Stock";
  if (quantity > 0 && available <= quantity * 0.2) return "Low Stock";
  return "In Stock";
}

function inventorySlug(text) {
  return String(text || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "na";
}

/** Deterministic id: one record per item + location + room/block. */
export function inventoryDocId({ item, location, roomBlock }) {
  return `inv_${inventorySlug(item)}__${inventorySlug(location)}__${inventorySlug(roomBlock)}`;
}

/** Creates a stock record; refuses (DUPLICATE_ITEM) if that item/location/room already exists. */
export async function addInventoryItem(data, actor) {
  const quantity = Math.floor(Number(data.quantity));
  const damaged = Math.floor(Number(data.damaged) || 0);
  if (!(quantity >= 0) || !(damaged >= 0) || damaged > quantity) throw new Error("INVALID_QUANTITY");
  const item = String(data.item || "").trim();
  if (!item) throw new Error("ITEM_REQUIRED");
  const location = String(data.location || "").trim();
  const roomBlock = String(data.roomBlock || "").trim();
  const ref = doc(db, "inventory", inventoryDocId({ item, location, roomBlock }));
  const available = quantity - damaged;
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error("DUPLICATE_ITEM");
    tx.set(ref, {
      item,
      category: String(data.category || "").trim(),
      quantity,
      available,
      damaged,
      location,
      roomBlock,
      status: data.status || autoInventoryStatus({ quantity, available }),
      createdBy: actor.uid,
      createdAt: serverTimestamp(),
      updatedBy: actor.name,
      updatedByUid: actor.uid,
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  });
}

/**
 * change: { type: "quantity", quantity } — sets the new TOTAL; available moves by the same delta
 *         { type: "damaged", count }      — moves `count` units from available to damaged
 *         { type: "details", category, location, roomBlock, status }
 */
export async function updateInventoryItem(id, change, actor) {
  const ref = doc(db, "inventory", id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("ITEM_NOT_FOUND");
    const cur = snap.data();
    let { quantity, damaged, available } = normalizeInventory(cur);
    const extra = {};

    if (change.type === "quantity") {
      const newQty = Math.floor(Number(change.quantity));
      if (!(newQty >= 0)) throw new Error("INVALID_QUANTITY");
      available += newQty - quantity;
      quantity = newQty;
      if (available < 0) throw new Error("NEGATIVE_STOCK");
    } else if (change.type === "damaged") {
      const n = Math.floor(Number(change.count));
      if (!(n > 0) || n > available) throw new Error("INVALID_QUANTITY");
      available -= n;
      damaged += n;
    } else if (change.type === "details") {
      extra.category = String(change.category || "").trim();
      extra.location = String(change.location || "").trim();
      extra.roomBlock = String(change.roomBlock || "").trim();
      if (change.status) extra.status = change.status;
    } else {
      throw new Error("UNKNOWN_CHANGE");
    }

    if (change.type !== "details" && (!cur.status || AUTO_INVENTORY_STATUSES.includes(cur.status))) {
      extra.status = autoInventoryStatus({ quantity, available });
    }
    tx.update(ref, {
      quantity,
      available,
      damaged,
      ...extra,
      updatedBy: actor.name,
      updatedByUid: actor.uid,
      updatedAt: serverTimestamp(),
    });
    return { quantity, available, damaged };
  });
}

/** Pending -> Approved/Rejected exactly once (ALREADY_DECIDED if it isn't Pending any more). */
export async function decideInventoryRequest(requestId, nextStatus, actor) {
  if (!["Approved", "Rejected"].includes(nextStatus)) throw new Error("UNKNOWN_STATUS");
  const ref = doc(db, "inventoryRequests", requestId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("REQUEST_NOT_FOUND");
    if (snap.data().status !== "Pending") throw new Error("ALREADY_DECIDED");
    tx.update(ref, {
      status: nextStatus,
      decidedBy: actor.name,
      decidedByUid: actor.uid,
      decidedAt: serverTimestamp(),
      updatedBy: actor.name,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Approved -> Fulfilled. If `inventoryId` is given, the requested quantity
 * is issued from that stock record's `available` in the same transaction
 * (INSUFFICIENT_STOCK if there isn't enough, so stock can't go negative).
 * With no inventoryId the request is just marked fulfilled (no stock change).
 */
export async function fulfillInventoryRequest(requestId, inventoryId, actor) {
  const reqRef = doc(db, "inventoryRequests", requestId);
  const invRef = inventoryId ? doc(db, "inventory", inventoryId) : null;
  return runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(reqRef);
    const invSnap = invRef ? await tx.get(invRef) : null;
    if (!reqSnap.exists()) throw new Error("REQUEST_NOT_FOUND");
    if (reqSnap.data().status !== "Approved") throw new Error("NOT_APPROVED");

    if (invRef) {
      if (!invSnap.exists()) throw new Error("ITEM_NOT_FOUND");
      const qty = Math.max(Math.floor(Number(reqSnap.data().quantity)) || 1, 1);
      const cur = invSnap.data();
      const n = normalizeInventory(cur);
      if (n.available < qty) throw new Error("INSUFFICIENT_STOCK");
      const available = n.available - qty;
      tx.update(invRef, {
        quantity: n.quantity,
        damaged: n.damaged,
        available,
        ...(!cur.status || AUTO_INVENTORY_STATUSES.includes(cur.status)
          ? { status: autoInventoryStatus({ quantity: n.quantity, available }) }
          : {}),
        updatedBy: actor.name,
        updatedByUid: actor.uid,
        updatedAt: serverTimestamp(),
      });
    }
    tx.update(reqRef, {
      status: "Fulfilled",
      fulfilledBy: actor.name,
      fulfilledByUid: actor.uid,
      fulfilledAt: serverTimestamp(),
      inventoryId: inventoryId || null,
      stockAdjusted: Boolean(inventoryId),
      updatedBy: actor.name,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Security gate-scan movement recorder — the ONLY path (besides the Warden/
 * Admin decision flow) that ever changes a gatePasses/{id} doc's
 * tripState/status. Runs as a transaction so the pass's current state is
 * re-read straight from Firestore at the moment of writing (never trusted
 * from a scanned QR payload or a cached client list) and the OUT/IN
 * transition is validated and applied atomically — two scans of the same
 * pass in quick succession (a slow camera + a retry tap, two guards at
 * different gates, ...) can't both log the same direction, and an IN can
 * never be recorded before a matching OUT.
 *
 * expectedStudentId, when given (from a decoded QR payload), is checked
 * against the pass's own studentId — the QR's claim is never trusted on
 * its own, only used to flag a mismatch against the real document.
 *
 * direction: "Out" | "In"
 * Throws Error with one of these messages:
 *   PASS_NOT_FOUND, STUDENT_MISMATCH, NOT_APPROVED, ALREADY_OUT,
 *   ALREADY_RETURNED, EXPIRED, NOT_OUT_YET
 * Returns the pass's new state: { id, ...pass fields, tripState, status }
 */
export async function recordGateMovement(passId, direction, guard, expectedStudentId) {
  const passRef = doc(db, "gatePasses", passId);
  const logRef = doc(collection(db, "gateLogs"));
  const now = new Date();

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(passRef);
    if (!snap.exists()) throw new Error("PASS_NOT_FOUND");
    const pass = snap.data();

    if (expectedStudentId && pass.studentId && pass.studentId !== expectedStudentId) {
      throw new Error("STUDENT_MISMATCH");
    }
    if (pass.status !== "Approved") throw new Error("NOT_APPROVED");

    if (direction === "Out") {
      if (pass.tripState === "Out") throw new Error("ALREADY_OUT");
      if (pass.tripState === "Returned") throw new Error("ALREADY_RETURNED");
      const to = pass.to ? new Date(pass.to) : null;
      if (to && !Number.isNaN(to.getTime()) && now > to) throw new Error("EXPIRED");
    } else {
      if (pass.tripState !== "Out") throw new Error("NOT_OUT_YET");
    }

    const nextTripState = direction === "Out" ? "Out" : "Returned";
    const passUpdate = { tripState: nextTripState };
    // A pass that has been out and is now returned is done — this is the
    // only place "Completed" ever gets set, so the status filter on the
    // admin/warden GatePasses pages actually has something to match.
    if (nextTripState === "Returned") passUpdate.status = "Completed";
    tx.set(passRef, { ...passUpdate, updatedAt: serverTimestamp() }, { merge: true });

    tx.set(logRef, {
      studentId: pass.studentId,
      studentName: pass.studentName || "",
      room: pass.room || "",
      passId,
      direction,
      // `time` stays a human-readable display string; `timeSort` is a real
      // sortable ISO timestamp — Firestore orderBy must use timeSort, never
      // the locale string, or ordering silently breaks once entries span
      // more than one month (locale month names don't sort correctly).
      time: now.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }),
      timeSort: now.toISOString(),
      guard,
      scannedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return { id: passId, ...pass, ...passUpdate };
  });
}

/**
 * Warden decision on a leave request: Pending -> Approved/Rejected exactly
 * once, in a transaction, on the SAME leaveRequests/{id} document. For each
 * parent account linked to the student (resolved by the caller from
 * users/{parentUid}.linkedStudentId) it also writes a persistent
 * `parentNotifications` record, and only then sets parentNotified = true —
 * so the flag reflects a notification that really exists. With no linked
 * parent nothing is written and parentNotified is left as it was.
 */
export async function decideLeaveRequest(leaveId, nextStatus, parentIds, actor) {
  if (!["Approved", "Rejected"].includes(nextStatus)) throw new Error("UNKNOWN_STATUS");
  const leaveRef = doc(db, "leaveRequests", leaveId);
  const today = new Date().toISOString().slice(0, 10);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(leaveRef);
    if (!snap.exists()) throw new Error("REQUEST_NOT_FOUND");
    const leave = snap.data();
    if (leave.status !== "Pending") throw new Error("ALREADY_DECIDED");

    const refs = parentIds.map((pid) => doc(db, "parentNotifications", `leave_${leaveId}_${pid}_${nextStatus}`));
    const existing = [];
    for (const r of refs) existing.push(await tx.get(r));

    const verb = nextStatus === "Approved" ? "approved" : "rejected";
    refs.forEach((ref, i) => {
      if (existing[i].exists()) return;
      tx.set(ref, {
        parentId: parentIds[i],
        studentId: leave.studentId,
        studentName: leave.studentName || "",
        type: "Leave Update",
        title: `Leave request ${verb}`,
        message: `${leave.studentName || "Your child"}'s ${leave.type || ""} leave request (${leave.from} to ${leave.to}) was ${verb} by the warden.`,
        leaveId,
        leaveStatus: nextStatus,
        priority: "General",
        date: today,
        createdBy: actor.uid,
        createdByName: actor.name,
        createdByRole: "Warden",
        createdAt: serverTimestamp(),
        read: false,
      });
    });

    tx.update(leaveRef, {
      status: nextStatus,
      ...(nextStatus === "Approved"
        ? { approvedBy: actor.name, approvedAt: serverTimestamp() }
        : { rejectedBy: actor.name, rejectedAt: serverTimestamp() }),
      ...(parentIds.length > 0 ? { parentNotified: true } : {}),
      updatedAt: serverTimestamp(),
    });
    return { notified: parentIds.length };
  });
}

// ---------------------------------------------------------------------------
// Security leave-exit recording (`leaveLogs`).
//
// One leaveLogs document per leaveRequest, with the SAME id as the leave
// request — that deterministic id is what makes a duplicate impossible (two
// guards tapping "Mark Left" at once resolve to one document). Security never
// writes to leaveRequests: the Warden's Approved status stays untouched.
// ---------------------------------------------------------------------------

function localDateKey(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Security confirms an approved-leave student physically left the hostel.
 * Re-reads the leave request inside the transaction (never trusts the table
 * row) and requires status === "Approved". Throws:
 *   REQUEST_NOT_FOUND, NOT_APPROVED, ALREADY_LEFT
 */
export async function markLeaveLeft(leaveRequestId, actor) {
  const leaveRef = doc(db, "leaveRequests", leaveRequestId);
  const logRef = doc(db, "leaveLogs", leaveRequestId);
  return runTransaction(db, async (tx) => {
    const leaveSnap = await tx.get(leaveRef);
    const logSnap = await tx.get(logRef);
    if (!leaveSnap.exists()) throw new Error("REQUEST_NOT_FOUND");
    const leave = leaveSnap.data();
    if (leave.status !== "Approved") throw new Error("NOT_APPROVED");
    if (logSnap.exists()) throw new Error("ALREADY_LEFT");

    tx.set(logRef, {
      leaveRequestId,
      studentId: leave.studentId || "",
      studentName: leave.studentName || "",
      block: leave.wing || "",
      room: leave.room || "",
      leaveType: leave.type || "",
      from: leave.from || "",
      to: leave.to || "",
      leftAt: serverTimestamp(),
      leftDate: localDateKey(),
      recordedBy: actor.name,
      recordedByUid: actor.uid,
      status: "Left",
    });
  });
}

/**
 * Security confirms the student physically came back. Only moves an existing
 * Left log to Returned; the timestamp is the real server time of this action.
 * Throws: LOG_NOT_FOUND, NOT_LEFT_YET (never left, or already returned)
 */
export async function markLeaveReturned(leaveRequestId, actor) {
  const logRef = doc(db, "leaveLogs", leaveRequestId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(logRef);
    if (!snap.exists()) throw new Error("LOG_NOT_FOUND");
    if (snap.data().status !== "Left") throw new Error("NOT_LEFT_YET");
    tx.update(logRef, {
      status: "Returned",
      returnedAt: serverTimestamp(),
      returnedBy: actor.name,
      returnedByUid: actor.uid,
    });
  });
}
