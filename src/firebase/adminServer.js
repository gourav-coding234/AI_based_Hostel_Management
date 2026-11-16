import { readFileSync } from "node:fs";

/** Load Firebase Admin inside each request so deployment import failures can
 * be returned as JSON instead of crashing the Vercel function at startup.
 *
 * Credentials are read from either:
 *   - FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY
 *   - FIREBASE_SERVICE_ACCOUNT_JSON (the whole service-account file, raw or base64)
 *
 * The private key is normalised because pasting it into a hosting dashboard
 * very often mangles it (wrapping quotes, literal "\n", CRLF, stray spaces).
 */

const MISSING_DEFAULT = "Firebase Admin server credentials are not configured.";

function stripWrappingQuotes(value) {
  return String(value ?? "").trim().replace(/^(["'`])([\s\S]*)\1$/, "$2").trim();
}

/** Turn whatever was pasted into a valid PEM private key. */
export function normalizePrivateKey(raw) {
  let key = stripWrappingQuotes(raw);
  if (!key) return "";
  // Whole JSON value pasted by mistake: {"private_key": "..."}
  if (key.startsWith("{")) {
    try { key = String(JSON.parse(key).private_key || key); } catch { /* keep as is */ }
  }
  key = key.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n?/g, "\n");
  // Newlines were replaced by spaces: rebuild the PEM body.
  // Header/footer lines were left out when copying: add them back.
  if (!/-----BEGIN/.test(key) && /^[A-Za-z0-9+/=\s]{200,}$/.test(key)) {
    key = `-----BEGIN PRIVATE KEY-----\n${key.replace(/\s+/g, "")}\n-----END PRIVATE KEY-----`;
  }
  const match = key.match(/-----BEGIN ([A-Z ]*PRIVATE KEY)-----([\s\S]*?)-----END \1-----/);
  if (match) {
    const body = match[2].replace(/\s+/g, "");
    const lines = body.match(/.{1,64}/g) || [];
    key = `-----BEGIN ${match[1]}-----\n${lines.join("\n")}\n-----END ${match[1]}-----\n`;
  }
  return key;
}

function readServiceAccountJson() {
  // Local development: point at the downloaded key file instead of pasting it.
  const filePath = stripWrappingQuotes(process.env.FIREBASE_SERVICE_ACCOUNT_FILE);
  if (filePath) {
    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8"));
      if (parsed?.client_email && parsed?.private_key) return parsed;
    } catch (error) {
      throw adminError("ADMIN_CREDENTIALS_INVALID", `FIREBASE_SERVICE_ACCOUNT_FILE could not be read (${error?.code || "invalid JSON"}). Check the path: ${filePath}`);
    }
    throw adminError("ADMIN_CREDENTIALS_INVALID", "FIREBASE_SERVICE_ACCOUNT_FILE does not look like a Firebase service-account key file.");
  }
  const raw = stripWrappingQuotes(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!raw) return null;
  const candidates = [raw];
  try { candidates.push(Buffer.from(raw, "base64").toString("utf8")); } catch { /* ignore */ }
  for (const text of candidates) {
    try {
      const parsed = JSON.parse(text);
      if (parsed?.client_email && parsed?.private_key) return parsed;
    } catch { /* try next */ }
  }
  throw adminError("ADMIN_CREDENTIALS_INVALID", "FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid service-account JSON.");
}

export function adminError(code, message) {
  return Object.assign(new Error(message), { adminCode: code });
}

/** True when Node can actually parse the key (catches typos/corruption). */
export async function privateKeyParses(pem) {
  try {
    const { createPrivateKey } = await import("node:crypto");
    createPrivateKey(pem);
    return true;
  } catch { return false; }
}

/** Resolve credentials and report which variables are missing, without secrets. */
export function readAdminCredentials() {
  const json = readServiceAccountJson();
  const projectId = stripWrappingQuotes(json?.project_id || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID);
  const clientEmail = stripWrappingQuotes(json?.client_email || process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(json?.private_key || process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  const missing = [];
  if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
  return { projectId, clientEmail, privateKey, missing };
}

export async function firebaseAdminServices(missingCredentialsMessage = MISSING_DEFAULT) {
  const { projectId, clientEmail, privateKey, missing } = readAdminCredentials();
  if (missing.length) {
    // Names only, never values, so the screen itself shows what the server can see.
    const seen = Object.keys(process.env).filter((name) => /FIREBASE|SERVICE_ACCOUNT/i.test(name) && !name.startsWith("VITE_")).sort();
    const where = process.env.VERCEL_ENV ? `Vercel (${process.env.VERCEL_ENV})` : "your computer (local server)";
    throw adminError("ADMIN_CREDENTIALS_MISSING", `${missingCredentialsMessage} Missing: ${missing.join(", ")}. This request ran on ${where}. Server-side variables it can see: ${seen.length ? seen.join(", ") : "none"}.`);
  }
  if (!/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(privateKey) || !/-----END [A-Z ]*PRIVATE KEY-----/.test(privateKey)) {
    throw adminError("ADMIN_CREDENTIALS_INVALID", "FIREBASE_ADMIN_PRIVATE_KEY is not a valid PEM key. Paste the full private_key value from the service-account JSON file.");
  }

  if (!(await privateKeyParses(privateKey))) {
    throw adminError("ADMIN_CREDENTIALS_INVALID", "FIREBASE_ADMIN_PRIVATE_KEY is damaged (part of it was changed or cut off while copying). Download a fresh key file and use FIREBASE_SERVICE_ACCOUNT_JSON with the base64 of the whole file instead.");
  }

  const reasonOf = (error) => `${error?.code ? `${error.code}: ` : ""}${String(error?.message || error).split("\n")[0]}`.slice(0, 220);
  let appSdk, authSdk, firestoreSdk;
  try {
    [appSdk, authSdk, firestoreSdk] = await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/auth"),
      import("firebase-admin/firestore"),
    ]);
  } catch (error) {
    throw adminError("ADMIN_SDK_LOAD_FAILED", `The firebase-admin package failed to load on the server (Node ${process.version}). Reason: ${reasonOf(error)}`);
  }
  let app = appSdk.getApps()[0];
  if (!app) {
    try {
      app = appSdk.initializeApp({ credential: appSdk.cert({ projectId, clientEmail, privateKey }), projectId });
    } catch (error) {
      throw adminError("ADMIN_CREDENTIALS_INVALID", `Firebase Admin rejected the credentials: ${String(error?.message || error).split("\n")[0].slice(0, 160)}`);
    }
  }
  try {
    return {
      auth: authSdk.getAuth(app),
      db: firestoreSdk.getFirestore(app),
      FieldValue: firestoreSdk.FieldValue,
      projectId,
    };
  } catch (error) {
    throw adminError("ADMIN_SERVICES_FAILED", `Firebase Admin started but its Auth/Firestore services failed. Reason: ${reasonOf(error)}`);
  }
}
