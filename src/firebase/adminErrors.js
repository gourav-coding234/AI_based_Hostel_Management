/**
 * Convert a thrown Firebase Admin / Google API error into a safe, actionable
 * { status, code, message } so the UI says what to fix instead of a generic
 * "check the server logs". Never includes keys or raw stack traces.
 */
export function describeAdminError(error, fallback = "The request could not be completed.") {
  const raw = String(error?.message || "");
  const code = error?.adminCode || error?.code;

  if (typeof error?.adminCode === "string" && error.adminCode.startsWith("ADMIN_")) {
    return { status: 500, code: error.adminCode, message: raw };
  }
  // Google/gRPC: 7 PERMISSION_DENIED, 5 NOT_FOUND, 16 UNAUTHENTICATED, 9 FAILED_PRECONDITION
  if (code === 7 || /PERMISSION_DENIED|Missing or insufficient permissions|has not been used in project|API has not been enabled|SERVICE_DISABLED/i.test(raw)) {
    return { status: 500, code: "ADMIN_PERMISSION_DENIED", message: "The Firebase service account is not allowed to use Firestore. In Google Cloud Console, enable the Cloud Firestore API and give this service account the 'Cloud Datastore User' (or Firebase Admin SDK Administrator) role." };
  }
  if (code === 5 || /NOT_FOUND.*database|database \(default\) does not exist|The database .* does not exist/i.test(raw)) {
    return { status: 500, code: "ADMIN_DATABASE_NOT_FOUND", message: "Firestore database was not found for this project. Check FIREBASE_ADMIN_PROJECT_ID matches the project that has the database, and that Firestore is created." };
  }
  if (code === 16 || /UNAUTHENTICATED|invalid_grant|invalid_client|Getting metadata from plugin failed|Could not load the default credentials/i.test(raw)) {
    return { status: 500, code: "ADMIN_UNAUTHENTICATED", message: "Firebase rejected the service-account credentials. Generate a new private key in Firebase Console > Project settings > Service accounts and update the Vercel environment variables, then redeploy." };
  }
  if (code === 9 || /FAILED_PRECONDITION|requires an index/i.test(raw)) {
    return { status: 500, code: "ADMIN_INDEX_REQUIRED", message: "Firestore needs an index for this query. Deploy firestore.indexes.json (firebase deploy --only firestore:indexes)." };
  }
  if (/Cannot find (module|package)|ERR_MODULE_NOT_FOUND|firebase-admin/i.test(raw) && !/auth\//.test(String(code))) {
    return { status: 500, code: "ADMIN_SDK_MISSING", message: "The firebase-admin package failed to load on the server. Redeploy after running 'npm install' so it is bundled." };
  }
  if (/ENOTFOUND|ETIMEDOUT|ECONNRESET|fetch failed|DEADLINE_EXCEEDED|UNAVAILABLE/i.test(raw) || code === 14 || code === 4) {
    return { status: 503, code: "ADMIN_NETWORK", message: "The server could not reach Google services. Try again in a moment." };
  }
  if (/auth\/insufficient-permission|Caller does not have required permission|identitytoolkit/i.test(`${code} ${raw}`)) {
    return { status: 500, code: "ADMIN_AUTH_PERMISSION", message: "The service account is not allowed to manage sign-in users. In Google Cloud Console > IAM, give it the role 'Firebase Authentication Admin' (or 'Firebase Admin SDK Administrator Service Agent'), and make sure the Identity Toolkit API is enabled." };
  }
  // Short, non-secret reason (error code + first line) to make unknown failures diagnosable.
  const reason = `${code ? `${code}: ` : ""}${raw.split("\n")[0]}`.slice(0, 200);
  return { status: 500, code: "ADMIN_UNKNOWN", message: reason ? `${fallback} Reason: ${reason}` : fallback };
}
