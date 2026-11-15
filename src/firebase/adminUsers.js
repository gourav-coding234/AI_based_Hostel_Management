import { reconcileStudentRecordsForAccount } from "./firestore";
import { publishDataChange } from "./dataChangeEvents";

async function managedAccountRequest(user, payload) {
  if (!user) throw new Error("Your administrator session has expired. Sign in again.");
  const token = await user.getIdToken();
  const response = await fetch("/api/admin/manage-account", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "The account could not be updated.");
  return result;
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
export async function createUserAccount(account, user) {
  const result = await managedAccountRequest(user, { action: "create", ...account });
  publishDataChange("users");
  if (account.role === "Student") {
    publishDataChange("students");
    const registrationNo = String(account.registrationNo || account.regNo || result.registrationNo || "").trim();
    if (registrationNo) {
      try { await reconcileStudentRecordsForAccount(registrationNo, result.uid); }
      catch (error) { console.warn("Could not reconcile older student records yet:", error); }
    }
  }
  return { uid: result.uid, ...result };
}

/** Update another account through the server-side Firebase Admin API. */
export async function updateManagedUserAccount({ user, targetUid, email, password }) {
  return managedAccountRequest(user, { action: "update", targetUid, email, password }).then((result) => {
    publishDataChange("users");
    return result;
  });
}

export async function deleteManagedUserAccount(user, targetUid) {
  const result = await managedAccountRequest(user, { action: "delete", targetUid });
  publishDataChange("users");
  return result;
}

export async function setManagedUserDisabled(user, targetUid, disabled) {
  const result = await managedAccountRequest(user, { action: "set-disabled", targetUid, disabled });
  publishDataChange("users");
  return result;
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
