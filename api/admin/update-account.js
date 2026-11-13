import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminServices() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("The secure account editor is not configured. Add the Firebase Admin credentials to the server environment.");
  }
  const app = getApps()[0] || initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
  return { auth: getAuth(app), db: getFirestore(app) };
}

function reply(res, status, body) {
  return res.status(status).json(body);
}

export default async function updateAccount(req, res) {
  if (req.method !== "POST") return reply(res, 405, { message: "Method not allowed." });
  const authorization = req.headers.authorization || "";
  const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!idToken) return reply(res, 401, { message: "Sign in with an administrator account to continue." });

  try {
    const { auth, db } = getAdminServices();
    let caller;
    try {
      caller = await auth.verifyIdToken(idToken);
    } catch {
      return reply(res, 401, { message: "Your session expired. Sign in again and retry." });
    }

    const callerProfile = await db.collection("users").doc(caller.uid).get();
    if (!callerProfile.exists || callerProfile.get("role") !== "Admin") {
      return reply(res, 403, { message: "Only an administrator can edit account credentials." });
    }

    const targetUid = String(req.body?.targetUid || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!targetUid) return reply(res, 400, { message: "Choose an account to edit." });
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
    if (changedProfileEmail) await targetProfileRef.update({ email });
    try {
      if (Object.keys(authChanges).length) await auth.updateUser(targetUid, authChanges);
    } catch (error) {
      if (changedProfileEmail) {
        try { await targetProfileRef.update({ email: oldEmail }); } catch (rollbackError) {
          console.error("Could not roll back account email in Firestore after Auth update failed:", rollbackError);
        }
      }
      throw error;
    }

    return reply(res, 200, { ok: true, email, passwordUpdated: Boolean(password) });
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
            : error?.message?.startsWith("The secure account editor")
              ? error.message
              : "The account could not be updated. Check the server configuration and try again.";
    return reply(res, 500, { message });
  }
}
