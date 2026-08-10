import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./config";

/**
 * Signs a user in with email + password.
 * Throws the raw Firebase error on failure — callers should catch and
 * map error.code to a friendly message.
 */
export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOut() {
  return firebaseSignOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Turns a Firebase Auth error code into a message a user can act on.
 */
export function friendlyAuthError(error) {
  switch (error?.code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact the hostel office.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Couldn't sign you in. Please try again.";
  }
}
