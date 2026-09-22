import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * True only when every required Firebase key is present. Checked before the
 * app boots (see main.jsx) so a missing/blank `.env` shows a readable setup
 * screen instead of a blank page with a console error.
 */
export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((v) => typeof v === "string" && v.trim() !== "");
}

/** Names of the env vars that are missing, for the setup screen. */
export function missingFirebaseKeys() {
  const ENV_NAMES = {
    apiKey: "VITE_FIREBASE_API_KEY",
    authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
    projectId: "VITE_FIREBASE_PROJECT_ID",
    storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
    appId: "VITE_FIREBASE_APP_ID",
  };
  return Object.entries(firebaseConfig)
    .filter(([, v]) => typeof v !== "string" || v.trim() === "")
    .map(([k]) => ENV_NAMES[k]);
}

// Initialising with undefined keys throws deep inside the SDK and takes the
// whole render tree down with it. When config is absent we export nulls and
// let main.jsx render the setup screen instead — nothing that touches `db`
// or `auth` is mounted in that state.
const configured = isFirebaseConfigured();

const app = configured ? initializeApp(firebaseConfig) : null;

export const auth = configured ? getAuth(app) : null;
export const db = configured ? getFirestore(app) : null;

export default app;
