import { firebaseAdminServices } from "../../src/firebase/adminServer.js";
import { describeAdminError } from "../../src/firebase/adminErrors.js";


function reply(res, status, body) {
  return res.status(status).json(body);
}

export default async function updateAccount(req, res) {
  if (req.method !== "POST") return reply(res, 405, { message: "Method not allowed." });
  const authorization = req.headers.authorization || "";
  const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!idToken) return reply(res, 401, { message: "Sign in with an administrator account to continue." });

  try {
    const { auth, db } = await firebaseAdminServices("The secure account editor is not configured. Add the Firebase Admin credentials to the server environment.");
    let caller;
    try {
      caller = await auth.verifyIdToken(idToken);
    } catch {
      return reply(res, 401, { message: "Your session expired. Sign in again and retry." });
    }

    const callerProfile = await db.collection("users").doc(caller.uid).get();
    if (!callerProfile.exists || callerProfile.get("role") !== "Admin" || callerProfile.get("status") === "Inactive") {
      return reply(res, 403, { message: "Only an active administrator can edit account credentials." });
    }

    const targetUid = String(req.body?.targetUid || "").trim();
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!targetUid) return reply(res, 400, { message: "Choose an account to edit." });
    if (!name || name.length > 120) return reply(res, 400, { message: "Enter a name up to 120 characters." });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply(res, 400, { message: "Enter a valid email address." });
    }
    if (password && (password.length < 6 || password.length > 128)) {
      return reply(res, 400, { message: "A new password must be between 6 and 128 characters." });
    }

    const targetProfileRef = db.collection("users").doc(targetUid);
    const targetProfile = await targetProfileRef.get();
    if (!targetProfile.exists) return reply(res, 404, { message: "That account profile no longer exists." });
    const targetAuth = await auth.getUser(targetUid);
    const oldEmail = targetAuth.email || targetProfile.get("email") || "";
    const profileEmail = String(targetProfile.get("email") || "").toLowerCase();
    const authChanges = {};
    if (email !== oldEmail.toLowerCase()) authChanges.email = email;
    if (password) authChanges.password = password;

    const changedProfileEmail = email !== profileEmail;
    const profileChanges = { name };
    if (changedProfileEmail) profileChanges.email = email;
    if (email !== oldEmail.toLowerCase()) {
      const duplicate = await db.collection("users").where("email", "==", email).limit(10).get();
      if (duplicate.docs.some((entry) => entry.id !== targetUid && entry.get("status") !== "Inactive")) {
        return reply(res, 409, { message: "That email is already used by another account." });
      }
    }
    await targetProfileRef.update(profileChanges);
    try {
      authChanges.displayName = name;
      await auth.updateUser(targetUid, authChanges);
    } catch (error) {
      try {
        await targetProfileRef.update({ name: targetProfile.get("name") || "", email: profileEmail });
      } catch (rollbackError) {
          console.error("Could not roll back account email in Firestore after Auth update failed:", rollbackError);
      }
      throw error;
    }

    if (targetProfile.get("role") === "Student") {
      const studentRef = db.collection("students").doc(targetUid);
      const studentSnap = await studentRef.get();
      if (studentSnap.exists) await studentRef.update({ name, email });
    }

    return reply(res, 200, { ok: true, name, email, passwordUpdated: Boolean(password) });
  } catch (error) {
    console.error("Admin account update failed:", error);
    const message = error?.code === "auth/email-already-exists"
      ? "That email is already used by another account."
      : error?.code === "auth/invalid-email"
        ? "Enter a valid email address."
        : error?.code === "auth/user-not-found"
          ? "The sign-in account was not found."
          : error?.code === "auth/weak-password"
            ? "Choose a stronger password with at least 6 characters."
            : "";
    if (message) return reply(res, 400, { message });
    const info = describeAdminError(error, "The account could not be updated. Open /api/health on this site to see which server setting is wrong.");
    return reply(res, info.status, { code: info.code, message: info.message });
  }
}
