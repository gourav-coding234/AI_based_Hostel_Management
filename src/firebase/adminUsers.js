import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseConfig } from "./config";
import { db } from "./config";
import { getCollection, reconcileStudentRecordsForAccount } from "./firestore";

const SECONDARY_APP_NAME = "admin-user-creation";

/**
 * Creating a user with the Firebase client SDK automatically signs the
 * caller in as that new user — which would boot the admin out of their own
 * session. The standard client-only workaround is to run the creation on a
 * second, isolated Firebase App instance and immediately sign that instance
 * out, leaving the admin's primary session untouched.
 *
 * Note: this is a client-side convenience, not a hardened approach — for a
 * production rollout this account-creation step belongs in a Cloud Function
 * using the Firebase Admin SDK instead.
 */
function getSecondaryAuth() {
  const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  const appOptions = Object.fromEntries(Object.entries(firebaseConfig).filter(([, value]) => typeof value === "string" && value.trim() !== ""));
  const secondaryApp = existing ?? initializeApp(appOptions, SECONDARY_APP_NAME);
  return getAuth(secondaryApp);
}

/**
 * Creates one Firebase Auth account + matching Firestore `users/{uid}` profile.
 * Does not affect the currently signed-in admin.
 *
 * For a Student account, this also creates the matching `students/{uid}`
 * record (room/bed fields start blank — the warden fills those in via room
 * allotment). That document is what a Parent account's `linkedStudentId`
 * actually points to, so the link has something real on the other end from
 * the moment the student account exists.
 */
export async function createUserAccount({ name, email, password, role, hostelResidence, linkedStudentId, registrationNo, regNo, gender, branch, year, wing, room, bed, phone }) {
  let academic = null;
  if (role === "Student") {
    const explicitRegNo = String(registrationNo || regNo || "").trim();
    if (explicitRegNo) {
      academic = (await getCollection("studentRegister", { whereClauses: [["regNo", "==", explicitRegNo]], limitCount: 1 }))[0] || null;
      if (!academic) academic = (await getCollection("studentRegister", { whereClauses: [["registrationNo", "==", explicitRegNo]], limitCount: 1 }))[0] || null;
    }
    if (!academic && email) {
      academic = (await getCollection("studentRegister", { whereClauses: [["email", "==", email.trim().toLowerCase()]], limitCount: 1 }))[0] || null;
    }
  }
  const finalRegistrationNo = String(registrationNo || regNo || academic?.regNo || academic?.registrationNo || "").trim();
  const secondaryAuth = getSecondaryAuth();

  const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const uid = credential.user.uid;
  await signOut(secondaryAuth);

  const profile = {
    name: name?.trim() || "",
    email: email.trim(),
    role,
    hostelResidence: hostelResidence?.trim() || "",
    createdAt: serverTimestamp(),
  };
  if (role === "Student" && finalRegistrationNo) {
    profile.registrationNo = finalRegistrationNo;
    profile.regNo = finalRegistrationNo;
  }
  if (role === "Student") {
    profile.gender = gender || academic?.gender || "";
    profile.branch = branch || academic?.branch || "";
    profile.year = year || academic?.year || "";
  }
  if (role === "Parent" && linkedStudentId?.trim()) {
    profile.linkedStudentId = linkedStudentId.trim();
  }

  await setDoc(doc(db, "users", uid), profile);

  if (role === "Student") {
    await setDoc(doc(db, "students", uid), {
      name: profile.name,
      email: profile.email,
      registrationNo: finalRegistrationNo,
      regNo: finalRegistrationNo,
      gender: profile.gender,
      branch: profile.branch,
      year: profile.year,
      phone: phone || academic?.phone || "",
      hostelResidence: profile.hostelResidence || academic?.hostelResidence || academic?.wing || "",
      wing: wing || academic?.wing || "",
      floor: academic?.floor || "",
      room: room || academic?.room || "",
      bed: bed || academic?.bed || "",
      allottedOn: academic?.allottedOn || "",
      roommates: [],
      createdAt: serverTimestamp(),
    });
    if (finalRegistrationNo) await reconcileStudentRecordsForAccount(finalRegistrationNo, uid);
  }

  return { uid, ...profile };
}

export function friendlyCreateAccountError(error) {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return error?.message || "Couldn't create this account.";
  }
}
