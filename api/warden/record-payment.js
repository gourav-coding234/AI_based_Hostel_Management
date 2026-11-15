import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function services() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Secure payment processing is not configured on the server.");
  const app = getApps()[0] || initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
  return { auth: getAuth(app), db: getFirestore(app) };
}

function normalizeHostel(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("girl") || text.includes("female")) return "Girls Hostel";
  if (text.includes("boy") || text.includes("male")) return "Boys Hostel";
  return "";
}

function respond(res, status, body) { return res.status(status).json(body); }

export default async function recordPayment(req, res) {
  if (req.method !== "POST") return respond(res, 405, { message: "Method not allowed." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) return respond(res, 401, { message: "Sign in again before recording a payment." });
  try {
    const { auth, db } = services();
    let caller;
    try { caller = await auth.verifyIdToken(token); }
    catch { return respond(res, 401, { message: "Your session expired. Sign in again." }); }

    const callerRef = db.collection("users").doc(caller.uid);
    const callerSnap = await callerRef.get();
    const callerProfile = callerSnap.data() || {};
    if (!callerSnap.exists || callerProfile.role !== "Warden" || callerProfile.status === "Inactive") {
      return respond(res, 403, { message: "Only an active warden can record hostel payments." });
    }
    const hostel = normalizeHostel(callerProfile.hostel || callerProfile.assignedHostel || callerProfile.wardenHostel);
    if (!hostel) return respond(res, 403, { message: "Your account needs a Boys Hostel or Girls Hostel assignment before recording payments." });

    const feeId = String(req.body?.feeId || "").trim();
    const paymentId = String(req.body?.paymentId || "").trim();
    const amount = Number(req.body?.amount);
    const paymentDate = String(req.body?.paymentDate || "");
    if (!feeId || !/^[A-Za-z0-9_-]{10,80}$/.test(paymentId) || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      return respond(res, 400, { message: "Enter a valid fee record, payment amount, date, and payment ID." });
    }
    const feeRef = db.collection("fees").doc(feeId);
    const paymentRef = db.collection("payments").doc(paymentId);
    const outcome = await db.runTransaction(async (tx) => {
      const [feeSnap, paymentSnap] = await Promise.all([tx.get(feeRef), tx.get(paymentRef)]);
      if (paymentSnap.exists) return { duplicate: true, paymentId };
      if (!feeSnap.exists) throw new Error("FEE_NOT_FOUND");
      const fee = feeSnap.data();
      const studentId = String(fee.studentId || fee.studentUid || fee.uid || "");
      if (!studentId) throw new Error("STUDENT_LINK_MISSING");
      const studentRef = db.collection("students").doc(studentId);
      const studentSnap = await tx.get(studentRef);
      const student = studentSnap.data() || {};
      const recordHostel = normalizeHostel(fee.hostel || fee.hostelType || student.hostel || student.hostelType || student.gender);
      if (recordHostel !== hostel) throw new Error("WARDEN_HOSTEL_MISMATCH");

      const total = Math.max(Number(fee.total) || 0, 0);
      const paid = Math.max(Number(fee.paid) || 0, 0);
      if (amount > total - paid) throw new Error("INVALID_AMOUNT");
      const newPaid = paid + amount;
      const pending = Math.max(total - newPaid, 0);
      const dueDate = String(fee.dueDate || "");
      const status = pending <= 0 ? "Paid" : dueDate && new Date(dueDate) < new Date() ? "Overdue" : newPaid > 0 ? "Partial" : "Pending";
      const now = FieldValue.serverTimestamp();
      tx.update(feeRef, {
        paid: newPaid, status, lastPaymentAt: now, lastPaymentId: paymentId,
        updatedBy: callerProfile.name || caller.email || "Warden", updatedByRole: "Warden",
        updatedByUid: caller.uid, updatedAt: now,
      });
      tx.create(paymentRef, {
        feeId, studentId, studentName: fee.studentName || student.name || "",
        studentCode: fee.studentCode || student.studentCode || student.registrationNo || student.regNo || "",
        registrationNo: fee.registrationNo || fee.regNo || student.registrationNo || student.regNo || "",
        hostel, block: fee.block || fee.wing || student.wing || student.block || "", room: fee.room || student.room || "",
        amount, paymentDate, paymentMethod: String(req.body?.paymentMethod || "Cash"),
        transactionId: String(req.body?.transactionId || "").trim(), remarks: String(req.body?.remarks || "").trim(),
        receivedBy: callerProfile.name || caller.email || "Warden", receivedByUid: caller.uid,
        receivedByRole: "Warden", createdAt: now,
      });
      return { paymentId, paid: newPaid, remaining: pending, status };
    });
    return respond(res, 200, { ok: true, ...outcome });
  } catch (error) {
    console.error("Warden payment recording failed:", error);
    const messages = {
      FEE_NOT_FOUND: [404, "That fee record no longer exists."],
      STUDENT_LINK_MISSING: [400, "This fee record is missing its student account link."],
      WARDEN_HOSTEL_MISMATCH: [403, "This fee record does not belong to your assigned hostel."],
      INVALID_AMOUNT: [400, "The payment amount is greater than the outstanding balance."],
    };
    const [status, message] = messages[error.message] || [500, error.message?.includes("not configured") ? error.message : "The payment could not be saved. Please try again."];
    return respond(res, status, { code: error.message, message });
  }
}
