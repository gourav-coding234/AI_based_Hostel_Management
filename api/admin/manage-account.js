import { firebaseAdminServices } from "../../src/firebase/adminServer.js";
import { describeAdminError } from "../../src/firebase/adminErrors.js";

const respond = (res, status, body) => res.status(status).json(body);
const normalizeHostel = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (text.includes("girl") || text.includes("female")) return "Girls Hostel";
  if (text.includes("boy") || text.includes("male")) return "Boys Hostel";
  return "";
};

export default async function manageAccount(req, res) {
  if (req.method !== "POST") return respond(res, 405, { message: "Method not allowed." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!token) return respond(res, 401, { message: "Sign in as an administrator to continue." });
  try {
    const { auth, db, FieldValue } = await firebaseAdminServices();
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
      const assignedHostel = normalizeHostel(req.body.hostel || req.body.hostelResidence);
      if (role === "Warden" && !assignedHostel) return respond(res, 400, { message: "Choose Boys Hostel or Girls Hostel for this warden." });
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
      let previousStudentRecord = null;
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
        const regNo = registrationNo || String(academic?.regNo || academic?.registrationNo || "").trim();
        if (!regNo) return respond(res, 400, { message: "A registration number is required for every student account." });

        // A registration ID belongs to the student, not to a particular
        // email/login. Deleting an account can leave its student profile in
        // Firestore. Only reject the ID if a usable Student login still owns it.
        const [usersByRegistration, usersByReg, studentsByRegistration, studentsByReg] = await Promise.all([
          db.collection("users").where("registrationNo", "==", regNo).limit(10).get(),
          db.collection("users").where("regNo", "==", regNo).limit(10).get(),
          db.collection("students").where("registrationNo", "==", regNo).limit(10).get(),
          db.collection("students").where("regNo", "==", regNo).limit(10).get(),
        ]);
        const previousRecords = new Map();
        [...studentsByRegistration.docs, ...studentsByReg.docs].forEach((entry) => previousRecords.set(entry.id, entry));
        if (previousRecords.size > 1) {
          return respond(res, 409, { message: "More than one old student profile uses this registration number. Please resolve the duplicate profiles first." });
        }
        previousStudentRecord = [...previousRecords.values()][0] || null;

        const accounts = new Map();
        [...usersByRegistration.docs, ...usersByReg.docs].forEach((entry) => accounts.set(entry.id, entry));
        if (previousStudentRecord && !accounts.has(previousStudentRecord.id)) {
          const linkedAccount = await db.collection("users").doc(previousStudentRecord.id).get();
          if (linkedAccount.exists) accounts.set(linkedAccount.id, linkedAccount);
        }
        for (const account of accounts.values()) {
          if (account.get("role") !== "Student" || account.get("status") === "Inactive") continue;
          try {
            const authAccount = await auth.getUser(account.id);
            if (!authAccount.disabled) {
              return respond(res, 409, { message: "That registration number already belongs to an active student account." });
            }
          } catch (error) {
            if (error?.code !== "auth/user-not-found") throw error;
            // The old login was deleted; its Firestore profile can be reused.
          }
        }
        req.body.registrationNo = regNo;
      }
      let gender = String(req.body.gender || academic?.gender || "").trim();
      let studentHostel = "";
      if (role === "Student") {
        const normalizedGender = gender.toLowerCase();
        if (!/^(male|m|boy|boys|female|f|girl|girls)$/.test(normalizedGender)) return respond(res, 400, { message: "Choose the student's gender so their hostel can be assigned correctly." });
        const code = /^(f|female|girl|girls)$/.test(normalizedGender) ? "G" : "B";
        gender = code === "G" ? "Female" : "Male";
        studentHostel = code === "G" ? "Girls Hostel" : "Boys Hostel";
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
      if (role === "Warden") Object.assign(profile, { hostel: assignedHostel, assignedHostel });
      if (role === "Parent") profile.linkedStudentId = linkedStudentId;
      if (role === "Student") Object.assign(profile, {
        studentCode: regNo, hostel: studentHostel, hostelType: studentHostel,
        registrationNo: regNo, regNo,
        gender,
        branch: req.body.branch || academic?.branch || "",
        year: req.body.year || academic?.year || "",
      });
      try {
        const batch = db.batch();
        batch.set(db.collection("users").doc(created.uid), profile);
        if (role === "Student") batch.set(db.collection("students").doc(created.uid), {
          ...(previousStudentRecord?.data() || {}),
          name, email, studentCode: regNo, hostel: studentHostel, hostelType: studentHostel, registrationNo: regNo, regNo,
          gender: profile.gender, branch: profile.branch, year: profile.year,
          phone: req.body.phone || previousStudentRecord?.get("phone") || academic?.phone || "",
          hostelResidence: profile.hostelResidence || previousStudentRecord?.get("hostelResidence") || academic?.hostelResidence || academic?.wing || "",
          wing: req.body.wing || previousStudentRecord?.get("wing") || academic?.wing || "",
          room: req.body.room || previousStudentRecord?.get("room") || academic?.room || "",
          bed: req.body.bed || previousStudentRecord?.get("bed") || academic?.bed || "",
          floor: previousStudentRecord?.get("floor") || academic?.floor || "",
          allottedOn: previousStudentRecord?.get("allottedOn") || academic?.allottedOn || "",
          roommates: previousStudentRecord?.get("roommates") || [],
          createdAt: previousStudentRecord?.get("createdAt") || FieldValue.serverTimestamp(),
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
    const known = {
      "auth/invalid-email": "Enter a valid email address.",
      "auth/invalid-password": "Choose a stronger password with at least 6 characters.",
      "auth/weak-password": "Choose a stronger password with at least 6 characters.",
      "auth/user-not-found": "That sign-in account no longer exists.",
      "auth/email-already-exists": "This email address is already registered.",
    }[error?.code];
    if (known) return respond(res, error.code === "auth/email-already-exists" ? 409 : 400, { message: known });
    const info = describeAdminError(error, "The account could not be saved. Open /api/health on this site to see which server setting is wrong.");
    return respond(res, info.status, { code: info.code, message: info.message });
  }
}
