import { firebaseAdminServices } from "../../src/firebase/adminServer.js";
import { normalizeHostel } from "../../src/utils/hostels.js";
import { describeAdminError } from "../../src/firebase/adminErrors.js";

const CATEGORIES = ["Food/Mess", "Cleanliness", "Maintenance", "Security", "Warden/Staff", "Facilities", "Other"];
const respond = (res, status, body) => res.status(status).json(body);


function hostelFor(student = {}) {
  return normalizeHostel(student.hostel) || normalizeHostel(student.hostelType) ||
    normalizeHostel(student.gender) || normalizeHostel(student.hostelResidence);
}

export default async function studentFeedback(req, res) {
  if (!["GET", "POST"].includes(req.method)) return respond(res, 405, { message: "Method not allowed." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) return respond(res, 401, { message: "Sign in as a student to continue." });
  try {
    const { auth, db, FieldValue } = await firebaseAdminServices();
    let caller;
    try { caller = await auth.verifyIdToken(token); } catch { return respond(res, 401, { message: "Your session expired. Sign in again." }); }
    const userRef = db.collection("users").doc(caller.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists || userSnap.get("role") !== "Student" || userSnap.get("status") === "Inactive") {
      return respond(res, 403, { message: "Only an active student account can use feedback." });
    }
    const studentSnap = await db.collection("students").doc(caller.uid).get();
    const student = studentSnap.data() || {};
    const registrationId = String(student.registrationNo || student.regNo || userSnap.get("registrationNo") || "").trim();
    if (!registrationId) return respond(res, 409, { message: "Your student profile has no Registration ID. Contact the administrator." });
    const collection = db.collection("feedback");

    if (req.method === "GET") {
      const snap = await collection.where("studentId", "==", caller.uid).get();
      const records = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      return respond(res, 200, { records });
    }

    const category = String(req.body?.category || "").trim();
    const comment = String(req.body?.comment || "").trim();
    const rating = Number(req.body?.rating);
    const anonymous = Boolean(req.body?.anonymous);
    if (!CATEGORIES.includes(category)) return respond(res, 400, { message: "Choose a valid feedback category." });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return respond(res, 400, { message: "Choose a rating from 1 to 5 stars." });
    if (comment.length < 5 || comment.length > 1000) return respond(res, 400, { message: "Comment must be between 5 and 1,000 characters." });
    const date = new Date().toISOString().slice(0, 10);
    const id = `${caller.uid}_${date}_${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const ref = collection.doc(id);
    await db.runTransaction(async (tx) => {
      const prior = await tx.get(ref);
      if (prior.exists) throw Object.assign(new Error("You already submitted feedback for this category today."), { status: 409 });
      tx.create(ref, {
        studentId: caller.uid,
        registrationNo: registrationId,
        ...(anonymous ? {} : { studentName: student.name || userSnap.get("name") || caller.name || "Student" }),
        hostel: hostelFor({ ...userSnap.data(), ...student }),
        category, rating, comment, anonymous,
        // Keep legacy admin fields populated during transition.
        subject: category, message: comment,
        sentiment: "Neutral", status: "Submitted", date,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    return respond(res, 201, { ok: true, id, message: "Feedback submitted." });
  } catch (error) {
    if (error.status === 409) return respond(res, 409, { message: error.message });
    console.error("Student feedback request failed:", error);
    const info = describeAdminError(error, "Feedback could not be saved. Please try again.");
    return respond(res, info.status, { code: info.code, message: info.message });
  }
}
