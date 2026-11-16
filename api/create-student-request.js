import { firebaseAdminServices } from "../src/firebase/adminServer.js";
import { describeAdminError } from "../src/firebase/adminErrors.js";
import { normalizeHostel } from "../src/utils/hostels.js";


const reply = (res, status, body) => res.status(status).json(body);

export default async function createStudentRequest(req, res) {
  if (req.method !== "POST") return reply(res, 405, { message: "Method not allowed." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) return reply(res, 401, { message: "Sign in as a student to submit this request." });
  try {
    const { auth, db, FieldValue } = await firebaseAdminServices();
    let caller;
    try { caller = await auth.verifyIdToken(token); } catch { return reply(res, 401, { message: "Your session expired. Sign in again." }); }
    const [userSnap, studentSnap] = await Promise.all([db.collection("users").doc(caller.uid).get(), db.collection("students").doc(caller.uid).get()]);
    if (!userSnap.exists || userSnap.get("role") !== "Student" || userSnap.get("status") === "Inactive") return reply(res, 403, { message: "Only an active student account can submit this request." });
    const body = req.body || {};
    const collectionName = body.type === "gatePass" ? "gatePasses" : body.type === "leave" ? "leaveRequests" : "";
    if (!collectionName) return reply(res, 400, { message: "Choose a valid request type." });
    const reason = String(body.reason || "").trim();
    const from = String(body.from || "").trim();
    const to = String(body.to || "").trim();
    if (!reason || reason.length > 2000 || !from || !to || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to)) || new Date(to) <= new Date(from)) return reply(res, 400, { message: "Enter a reason and a valid date range. The return/end must be after the start." });
    const profile = userSnap.data();
    const student = studentSnap.exists ? studentSnap.data() : {};
    const registrationNo = String(student.registrationNo || student.regNo || profile.registrationNo || profile.regNo || "").trim();
    if (!registrationNo) return reply(res, 400, { message: "Your registration number is missing. Ask the administrator to update your student profile." });
    const hostel = normalizeHostel(student.hostel || student.hostelType || student.hostelResidence || student.gender || profile.hostel || profile.hostelType || profile.hostelResidence || profile.gender);
    if (!hostel) return reply(res, 400, { message: "Your hostel assignment is missing. Ask the hostel office to update your profile before submitting a request." });
    const prefix = collectionName === "gatePasses" ? "GP" : "LV";
    const year = new Date().getFullYear();
    const counterRef = db.collection("counters").doc(`${prefix}-${year}`);
    const recordRef = db.collection(collectionName).doc();
    const code = await db.runTransaction(async (transaction) => {
      const counter = await transaction.get(counterRef);
      const next = (Number(counter.data()?.value) || 0) + 1;
      const readableCode = `${prefix}-${year}-${String(next).padStart(4, "0")}`;
      transaction.set(counterRef, { value: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      transaction.create(recordRef, {
        code: readableCode, studentId: caller.uid, registrationNo,
        studentName: profile.name || caller.name || caller.email || "Student",
        hostel,
        block: student.block || student.wing || student.hostelResidence || profile.hostelResidence || "",
        wing: student.wing || student.block || student.hostelResidence || profile.hostelResidence || "",
        room: student.room || "", type: String(body.requestType || "Personal").trim().slice(0, 80),
        reason, from, to, status: "Pending",
        ...(collectionName === "gatePasses" ? { tripState: "Not started" } : { parentNotified: false }),
        createdAt: FieldValue.serverTimestamp(),
      });
      return readableCode;
    });
    return reply(res, 201, { ok: true, id: recordRef.id, code });
  } catch (error) {
    console.error("Student request creation failed:", error);
    const info = describeAdminError(error, "The request could not be saved. Check your connection and try again.");
    return reply(res, info.status, { code: info.code, message: info.message });
  }
}
