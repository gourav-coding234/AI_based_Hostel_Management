import { firebaseAdminServices } from "../../src/firebase/adminServer.js";
import { normalizeHostel } from "../../src/utils/hostels.js";
import { describeAdminError } from "../../src/firebase/adminErrors.js";


const respond = (res, status, body) => res.status(status).json(body);
const clean = (value) => String(value ?? "").trim();

async function findStudent(db, identifier) {
  const id = clean(identifier);
  if (!id) return null;
  const direct = await db.collection("students").doc(id).get();
  if (direct.exists) return { id: direct.id, ...direct.data() };
  for (const field of ["registrationNo", "regNo", "studentCode"]) {
    const match = await db.collection("students").where(field, "==", id).limit(1).get();
    if (!match.empty) return { id: match.docs[0].id, ...match.docs[0].data() };
  }
  return null;
}

function applies(notice, hostel) {
  const target = clean(notice.target).toLowerCase();
  if (!target || ["both", "all", "all hostels", "institute-wide", "general"].includes(target)) return true;
  const normalized = normalizeHostel(notice.target);
  // Old wing-targeted notices cannot be assigned safely now that locations
  // are grouped only by hostel. Keep them visible as general announcements.
  return !normalized || normalized === hostel;
}

export default async function studentNotices(req, res) {
  if (req.method !== "GET") return respond(res, 405, { message: "Method not allowed." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) return respond(res, 401, { message: "Sign in to view notices." });
  try {
    const { auth, db } = await firebaseAdminServices();
    let caller;
    try { caller = await auth.verifyIdToken(token); } catch { return respond(res, 401, { message: "Your session expired. Sign in again." }); }
    const userSnap = await db.collection("users").doc(caller.uid).get();
    const user = userSnap.data() || {};
    if (!userSnap.exists || user.status === "Inactive" || !["Student", "Parent"].includes(user.role)) {
      return respond(res, 403, { message: "An active student or parent account is required to view these notices." });
    }

    let student;
    if (user.role === "Student") {
      student = await findStudent(db, caller.uid);
      if (!student) student = await findStudent(db, user.registrationNo || user.regNo || user.studentCode);
      student = { ...user, ...(student || {}) };
    } else {
      const linkedId = clean(user.linkedStudentId || user.registrationNo || user.regNo);
      student = await findStudent(db, linkedId);
      if (!student && linkedId) {
        const roster = await db.collection("studentRegister").doc(linkedId).get();
        if (roster.exists) student = await findStudent(db, roster.get("registrationNo") || roster.get("regNo") || linkedId);
      }
      if (!student) return respond(res, 409, { message: "Your parent account is not linked to a current student profile. Contact the hostel office." });
    }
    const hostel = normalizeHostel(student.hostel) || normalizeHostel(student.hostelType) ||
      normalizeHostel(student.gender) || normalizeHostel(student.hostelResidence);
    if (!hostel) return respond(res, 409, { message: "The student's hostel assignment is missing. Contact the hostel office." });

    const snapshot = await db.collection("notices").get();
    const notices = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((notice) => applies(notice, hostel))
      .sort((a, b) => {
        const dateValue = (value) => {
          if (typeof value?.toMillis === "function") return value.toMillis();
          if (typeof value?.seconds === "number") return value.seconds * 1000;
          if (typeof value === "string") return Date.parse(value) || 0;
          return 0;
        };
        return dateValue(b.date) - dateValue(a.date) || dateValue(b.createdAt) - dateValue(a.createdAt);
      });
    return respond(res, 200, { notices });
  } catch (error) {
    console.error("Student/parent notices request failed:", error);
    const info = describeAdminError(error, "Notices could not be loaded. Please try again.");
    return respond(res, info.status, { code: info.code, message: info.message });
  }
}
