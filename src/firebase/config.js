import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function envValue(value) {
  return typeof value === "string" ? value.trim().replace(/^["']|["']$/g, "") : value;
}

export const firebaseConfig = {
  apiKey: envValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: envValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: envValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: envValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: envValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: envValue(import.meta.env.VITE_FIREBASE_APP_ID),
};

const REQUIRED_FIREBASE_KEYS = ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"];

/**
 * True only when every required Firebase key is present. Checked before the
 * app boots (see main.jsx) so a missing/blank `.env` shows a readable setup
 * screen instead of a blank page with a console error.
 */
export function isFirebaseConfigured() {
  return REQUIRED_FIREBASE_KEYS.every((key) => typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim() !== "");
}

/** Names of the env vars that are missing, for the setup screen. */
export function missingFirebaseKeys() {
  const ENV_NAMES = {
    apiKey: "VITE_FIREBASE_API_KEY",
    authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
    projectId: "VITE_FIREBASE_PROJECT_ID",
    messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
    appId: "VITE_FIREBASE_APP_ID",
  };
  return REQUIRED_FIREBASE_KEYS.filter((key) => typeof firebaseConfig[key] !== "string" || firebaseConfig[key].trim() === "").map((key) => ENV_NAMES[key]);
}

// Initialising with undefined keys throws deep inside the SDK and takes the
// whole render tree down with it. When config is absent we export nulls and
// let main.jsx render the setup screen instead — nothing that touches `db`
// or `auth` is mounted in that state.
const configured = isFirebaseConfigured();

const appOptions = { ...firebaseConfig };
if (!appOptions.storageBucket) delete appOptions.storageBucket;
const app = configured ? initializeApp(appOptions) : null;

export const auth = configured ? getAuth(app) : null;
export const db = configured ? getFirestore(app) : null;

export default app;
