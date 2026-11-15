/** Load Firebase Admin inside each request so deployment import failures can
 * be returned as JSON instead of crashing the Vercel function at startup. */
export async function firebaseAdminServices(missingCredentialsMessage = "Firebase Admin server credentials are not configured.") {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error(missingCredentialsMessage);

  const [appSdk, authSdk, firestoreSdk] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/auth"),
    import("firebase-admin/firestore"),
  ]);
  const app = appSdk.getApps()[0] || appSdk.initializeApp({
    credential: appSdk.cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
  return {
    auth: authSdk.getAuth(app),
    db: firestoreSdk.getFirestore(app),
    FieldValue: firestoreSdk.FieldValue,
  };
}
