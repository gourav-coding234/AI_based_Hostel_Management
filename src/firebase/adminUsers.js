import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseConfig } from "./config";
import { db } from "./config";

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
  const secondaryApp = existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
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
export async function createUserAccount({ name, email, password, role, hostelResidence, linkedStudentId }) {
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
  if (role === "Parent" && linkedStudentId?.trim()) {
    profile.linkedStudentId = linkedStudentId.trim();
  }

  await setDoc(doc(db, "users", uid), profile);

  if (role === "Student") {
    await setDoc(doc(db, "students", uid), {
      name: profile.name,
      hostelResidence: profile.hostelResidence,
      wing: "",
      floor: "",
      room: "",
      bed: "",
      allottedOn: "",
      roommates: [],
      createdAt: serverTimestamp(),
    });
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
