import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function services() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase Admin server credentials are not configured.");
  const app = getApps()[0] || initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
  return { auth: getAuth(app), db: getFirestore(app) };
}

const respond = (res, status, body) => res.status(status).json(body);

export default async function manageAccount(req, res) {
  if (req.method !== "POST") return respond(res, 405, { message: "Method not allowed." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) return respond(res, 401, { message: "Sign in as an administrator to continue." });
  try {
    const { auth, db } = services();
    let caller;
    try { caller = await auth.verifyIdToken(token); } catch { return respond(res, 401, { message: "Your session expired. Sign in again." }); }
    const callerDoc = await db.collection("users").doc(caller.uid).get();
    if (!callerDoc.exists || callerDoc.get("role") !== "Admin" || callerDoc.get("status") === "Inactive") return respond(res, 403, { message: "Only an active administrator can manage accounts." });

    const { action } = req.body || {};
    if (action === "create") {
      const name = String(req.body.name || "").trim();
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      const role = String(req.body.role || "");
      const roles = ["Admin", "Warden", "Security", "Parent", "Student"];
      if (!roles.includes(role)) return respond(res, 400, { message: "Choose a valid account role." });
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return respond(res, 400, { message: "Enter a name and valid email address." });
      if (password.length < 6 || password.length > 128) return respond(res, 400, { message: "Password must be between 6 and 128 characters." });
      const linkedStudentId = String(req.body.linkedStudentId || "").trim();
      if (role === "Parent") {
        if (!linkedStudentId) return respond(res, 400, { message: "Select the student's account for this parent." });
        if (!(await db.collection("students").doc(linkedStudentId).get()).exists) return respond(res, 400, { message: "The selected student profile was not found." });
      }
      // Authentication enforces uniqueness for active sign-in accounts. Also
      // check normalized Firestore profiles so a partially removed/stale
      // profile cannot silently create a second account with the same email.
      const matchingProfiles = await db.collection("users").where("email", "==", email).limit(10).get();
      if (matchingProfiles.docs.some((profileDoc) => profileDoc.get("status") !== "Inactive")) {
        return respond(res, 409, { message: "This email address is already registered." });
      }
      let academic = null;
      const registrationNo = String(req.body.registrationNo || req.body.regNo || "").trim();
      if (role === "Student") {
        if (registrationNo) {
          academic = (await db.collection("studentRegister").doc(registrationNo).get()).data() || null;
          if (!academic) {
            const byReg = await db.collection("studentRegister").where("regNo", "==", registrationNo).limit(1).get();
            academic = byReg.empty ? null : byReg.docs[0].data();
          }
        }
        if (!academic) {
          const byEmail = await db.collection("studentRegister").where("email", "==", email).limit(1).get();
          academic = byEmail.empty ? null : byEmail.docs[0].data();
        }
      }
      let created;
      try { created = await auth.createUser({ email, password, displayName: name, disabled: false }); }
      catch (error) {
        if (error?.code === "auth/email-already-exists") return respond(res, 409, { message: "This email address is already registered." });
        throw error;
      }
      const regNo = registrationNo || String(academic?.regNo || academic?.registrationNo || "").trim();
      const profile = {
        name, email, role, status: "Active", hostelResidence: String(req.body.hostelResidence || "").trim(),
        createdAt: FieldValue.serverTimestamp(), createdBy: caller.uid,
      };
      if (role === "Parent") profile.linkedStudentId = linkedStudentId;
      if (role === "Student") Object.assign(profile, {
        registrationNo: regNo, regNo,
        gender: req.body.gender || academic?.gender || "",
        branch: req.body.branch || academic?.branch || "",
        year: req.body.year || academic?.year || "",
      });
      try {
        const batch = db.batch();
        batch.set(db.collection("users").doc(created.uid), profile);
        if (role === "Student") batch.set(db.collection("students").doc(created.uid), {
          name, email, registrationNo: regNo, regNo,
          gender: profile.gender, branch: profile.branch, year: profile.year,
          phone: req.body.phone || academic?.phone || "",
          hostelResidence: profile.hostelResidence || academic?.hostelResidence || academic?.wing || "",
          wing: req.body.wing || academic?.wing || "", room: req.body.room || academic?.room || "",
          bed: req.body.bed || academic?.bed || "", floor: academic?.floor || "",
          allottedOn: academic?.allottedOn || "", roommates: [], createdAt: FieldValue.serverTimestamp(),
        });
        await batch.commit();
      } catch (error) {
        await auth.deleteUser(created.uid).catch((cleanupError) => console.error("Could not roll back new Auth user:", cleanupError));
        await db.collection("users").doc(created.uid).delete().catch(() => {});
        await db.collection("students").doc(created.uid).delete().catch(() => {});
        throw error;
      }
      return respond(res, 201, { ok: true, uid: created.uid, ...profile, createdAt: null });
    }

    const targetUid = String(req.body.targetUid || "").trim();
    if (!targetUid || targetUid === caller.uid) return respond(res, 400, { message: "Choose another account to manage." });
    const profileRef = db.collection("users").doc(targetUid);
    if (action === "delete") {
      await profileRef.delete();
      try { await auth.deleteUser(targetUid); }
      catch (error) {
        if (error?.code !== "auth/user-not-found") {
          return respond(res, 503, { message: "The profile was removed, but the sign-in account could not be deleted. Retry account removal." });
        }
      }
      return respond(res, 200, { ok: true, deleted: true });
    }
    if (action === "set-disabled") {
      const disabled = Boolean(req.body.disabled);
      const target = await auth.getUser(targetUid);
      await auth.updateUser(targetUid, { disabled });
      try {
        await profileRef.set({ status: disabled ? "Inactive" : "Active", statusUpdatedAt: FieldValue.serverTimestamp(), statusUpdatedBy: caller.uid }, { merge: true });
      } catch (error) {
        await auth.updateUser(targetUid, { disabled: target.disabled }).catch(() => {});
        throw error;
      }
      return respond(res, 200, { ok: true, disabled, status: disabled ? "Inactive" : "Active" });
    }
    return respond(res, 400, { message: "Unsupported account action." });
  } catch (error) {
    console.error("Admin account management failed:", error);
    const message = error?.code === "auth/invalid-email" ? "Enter a valid email address."
      : error?.code === "auth/weak-password" ? "Choose a stronger password with at least 6 characters."
        : error?.code === "auth/user-not-found" ? "That sign-in account no longer exists."
          : "The account could not be updated. Check the server configuration and try again.";
    return respond(res, 500, { message });
  }
}
