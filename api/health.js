import { firebaseAdminServices, readAdminCredentials, privateKeyParses } from "../src/firebase/adminServer.js";
import { describeAdminError } from "../src/firebase/adminErrors.js";

/** GET /api/health — shows whether the server can reach Firebase Admin.
 * Reports only presence/shape of settings, never their values. */
export default async function health(req, res) {
  const { projectId, clientEmail, privateKey, missing } = readAdminCredentials();
  const report = {
    ok: false,
    env: {
      projectId: projectId || null,
      clientEmailSet: Boolean(clientEmail),
      clientEmailLooksValid: /@.+\.iam\.gserviceaccount\.com$/.test(clientEmail || ""),
      privateKeySet: Boolean(privateKey),
      privateKeyLooksValid: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+-----END [A-Z ]*PRIVATE KEY-----/.test(privateKey || ""),
      privateKeyParses: privateKey ? await privateKeyParses(privateKey) : false,
      usingServiceAccountJson: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
      missing,
    },
    // Names only (never values) so a misspelled variable name is easy to spot.
    seenEnvNames: Object.keys(process.env).filter((name) => /FIREBASE|SERVICE_ACCOUNT/i.test(name)).sort(),
    nodeVersion: process.version,
    vercelEnvironment: process.env.VERCEL_ENV || null,
    checks: { adminInit: false, auth: false, firestore: false },
  };
  try {
    const { auth, db } = await firebaseAdminServices();
    report.checks.adminInit = true;
    await auth.listUsers(1);
    report.checks.auth = true;
    await db.collection("users").limit(1).get();
    report.checks.firestore = true;
    report.ok = true;
    return res.status(200).json(report);
  } catch (error) {
    const info = describeAdminError(error);
    return res.status(503).json({ ...report, error: { code: info.code, message: info.message } });
  }
}
