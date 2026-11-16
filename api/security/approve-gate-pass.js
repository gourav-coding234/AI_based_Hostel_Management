import { firebaseAdminServices } from "../../src/firebase/adminServer.js";
import { describeAdminError } from "../../src/firebase/adminErrors.js";

const reply = (res, status, body) => res.status(status).json(body);

export default async function approveGatePass(req, res) {
  if (req.method !== "POST") return reply(res, 405, { message: "Method not allowed." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) return reply(res, 401, { message: "Sign in again to approve gate passes." });

  try {
    const { auth, db, FieldValue } = await firebaseAdminServices();
    let caller;
    try { caller = await auth.verifyIdToken(token); }
    catch { return reply(res, 401, { message: "Your session expired. Sign in again." }); }

    const actorSnap = await db.collection("users").doc(caller.uid).get();
    const actor = actorSnap.data();
    if (!actorSnap.exists || actor?.status === "Inactive" || !["Security", "Admin"].includes(actor?.role)) {
      return reply(res, 403, { message: "Only active security staff can approve gate passes." });
    }

    const passId = String(req.body?.passId || "").trim();
    if (!passId) return reply(res, 400, { message: "Choose a gate pass to approve." });
    const passRef = db.collection("gatePasses").doc(passId);
    const result = await db.runTransaction(async (tx) => {
      const passSnap = await tx.get(passRef);
      if (!passSnap.exists) throw Object.assign(new Error("PASS_NOT_FOUND"), { status: 404 });
      if (passSnap.get("status") !== "Pending") throw Object.assign(new Error("PASS_ALREADY_DECIDED"), { status: 409 });
      tx.update(passRef, {
        status: "Approved",
        approvedBy: actor.name || caller.name || caller.email || "Security",
        approvedByUid: caller.uid,
        approvedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { ok: true, id: passId, status: "Approved" };
    });
    return reply(res, 200, result);
  } catch (error) {
    if (error.message === "PASS_NOT_FOUND") return reply(res, 404, { message: "This gate pass no longer exists. Refresh and try again." });
    if (error.message === "PASS_ALREADY_DECIDED") return reply(res, 409, { message: "This gate pass was already decided. Refresh the list." });
    console.error("Gate pass approval failed:", error);
    const info = describeAdminError(error, "Gate pass could not be approved. Check the server configuration and try again.");
    return reply(res, info.status, { message: info.message, code: info.code });
  }
}
