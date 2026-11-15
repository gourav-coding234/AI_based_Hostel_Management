import { firebaseAdminServices } from "../../src/firebase/adminServer.js";


const reply = (res, status, body) => res.status(status).json(body);
const code = (status, message) => Object.assign(new Error(message), { status });
function scheduledTime(value) {
  const text = String(value || "").trim();
  // datetime-local values are campus local time (Asia/Kolkata), without an
  // offset. Vercel runs in UTC, so attach the campus offset before parsing.
  const campusLocal = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?$/.exec(text);
  return campusLocal ? Date.parse(`${campusLocal[1]}:${campusLocal[2] || "00"}+05:30`) : Date.parse(text);
}

export default async function recordMovement(req, res) {
  if (req.method !== "POST") return reply(res, 405, { message: "Method not allowed." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) return reply(res, 401, { code: "UNAUTHENTICATED", message: "Sign in again to record movement." });
  try {
    const { auth, db, FieldValue } = await firebaseAdminServices();
    let caller;
    try { caller = await auth.verifyIdToken(token); } catch { return reply(res, 401, { code: "UNAUTHENTICATED", message: "Your session expired. Sign in again." }); }
    const actorSnap = await db.collection("users").doc(caller.uid).get();
    const actor = actorSnap.data();
    if (!actorSnap.exists || actor?.status === "Inactive" || !["Security", "Admin", "Warden"].includes(actor?.role)) {
      return reply(res, 403, { code: "FORBIDDEN", message: "Only active security staff can record hostel movement." });
    }
    const { direction, passId = "", studentId = "", manual = false } = req.body || {};
    const reason = String(req.body?.reason || "").trim();
    if (!["In", "Out"].includes(direction) || (!manual && !passId) || (manual && !studentId)) return reply(res, 400, { code: "INVALID_REQUEST", message: "Choose a valid student and movement." });
    if (reason.length > 1000) return reply(res, 400, { code: "INVALID_REASON", message: "Keep the movement reason under 1,000 characters." });

    const now = new Date();
    const result = await db.runTransaction(async (tx) => {
      const passRef = manual ? null : db.collection("gatePasses").doc(passId);
      const studentKey = manual ? studentId : "";
      const passSnap = passRef ? await tx.get(passRef) : null;
      if (passRef && !passSnap.exists) throw code(404, "PASS_NOT_FOUND");
      const pass = passSnap?.data() || {};
      const actualStudentId = manual ? studentKey : pass.studentId;
      if (!actualStudentId) throw code(400, "STUDENT_NOT_FOUND");
      const statusRef = db.collection("inOutStatus").doc(actualStudentId);
      const studentRef = db.collection("students").doc(actualStudentId);
      const [statusSnap, studentSnap] = await Promise.all([tx.get(statusRef), tx.get(studentRef)]);
      const student = studentSnap.data() || {};
      const movement = statusSnap.data()?.status || "IN";
      if (manual) {
        if (!reason) throw code(400, direction === "In" ? "ENTRY_REASON_REQUIRED" : "REASON_REQUIRED");
        if ((direction === "Out" && movement === "OUT") || (direction === "In" && movement !== "OUT")) throw code(409, direction === "Out" ? "ALREADY_OUT" : "NOT_OUT_YET");
      } else {
        if (direction === "Out") {
          if (pass.status === "Pending") throw code(409, "NOT_APPROVED");
          if (pass.status === "Rejected") throw code(409, "PASS_REJECTED");
          if (pass.status === "Expired") throw code(409, "EXPIRED");
          if (pass.status !== "Approved" || ["Out", "Returned"].includes(pass.tripState)) throw code(409, "PASS_ALREADY_USED");
          if (movement === "OUT") throw code(409, "ALREADY_OUT");
          const end = scheduledTime(pass.to);
          if (Number.isFinite(end) && now.getTime() > end) throw code(409, "EXPIRED");
        } else {
          if (pass.status !== "Out" && pass.status !== "journey_started" && pass.tripState !== "Out") throw code(409, "NOT_OUT_YET");
          const end = scheduledTime(pass.to);
          if (Number.isFinite(end) && Math.floor(now.getTime() / 60000) !== Math.floor(end / 60000) && !reason) throw code(400, "ENTRY_REASON_REQUIRED");
        }
      }
      const regNo = pass.registrationNo || pass.regNo || student.registrationNo || student.regNo || "";
      const name = pass.studentName || student.name || "Student";
      const wing = pass.wing || student.wing || student.block || student.hostelResidence || "";
      const type = direction.toUpperCase();
      const timestamp = FieldValue.serverTimestamp();
      const logRef = db.collection("inOutLogs").doc();
      const log = {
        studentId: actualStudentId, registrationNo: regNo, studentName: name,
        room: pass.room || student.room || "", wing, gender: pass.gender || student.gender || "Unspecified",
        ...(passId ? { gatePassId: passId } : {}), type, direction, method: manual ? "manual" : "scan",
        reason, guardId: caller.uid, guard: actor.name || caller.name || caller.email || "Security",
        time: now.toLocaleString("en-IN"), timeSort: now.toISOString(), scannedAt: timestamp, createdAt: timestamp,
      };
      tx.set(statusRef, {
        studentId: actualStudentId, registrationNo: regNo, status: type,
        ...(reason ? { reason } : {}),
        ...(direction === "Out" ? { exitTime: timestamp } : { entryTime: timestamp, returnedAt: timestamp }), updatedAt: timestamp,
      }, { merge: true });
      if (passRef) tx.update(passRef, direction === "Out"
        ? { status: "Out", tripState: "Out", exitTime: timestamp, scannedBy: actor.name || "Security", scannedByUid: caller.uid, updatedAt: timestamp }
        : { status: "Completed", tripState: "Returned", entryTime: timestamp, returnedAt: timestamp, returnedByUid: caller.uid, ...(reason ? { entryReason: reason } : {}), updatedAt: timestamp });
      tx.create(logRef, log);
      return { ok: true, logId: logRef.id, status: type, registrationNo: regNo };
    });
    return reply(res, 200, result);
  } catch (error) {
    console.error("Security movement failed:", error);
    const status = error.status || 500;
    const messages = {
      PASS_NOT_FOUND: "This pass could not be found. Refresh and try again.",
      NOT_APPROVED: "Pass not approved yet.", PASS_REJECTED: "This pass was rejected and cannot be used.", PASS_ALREADY_USED: "This pass has already been used.",
      EXPIRED: "This pass has expired.", ENTRY_REASON_REQUIRED: "Enter a reason for this early or late entry.",
      REASON_REQUIRED: "Enter a reason for a manual movement.", ALREADY_OUT: "This student is already marked out.",
      NOT_OUT_YET: "This student is not currently marked out.", STUDENT_NOT_FOUND: "Student record could not be found.",
    };
    return reply(res, status, { code: error.message || "MOVEMENT_FAILED", message: messages[error.message] || (status === 500 ? "Movement could not be saved. Check server configuration and try again." : "Movement was rejected.") });
  }
}
