export function readErrorMessage(error, fallback = "Couldn't load this from the database. Please refresh.") {
  switch (error?.code) {
    case "resource-exhausted":
      return "Firebase rejected the request because the project reached a usage limit. Check Firestore Usage in Firebase Console.";
    case "permission-denied":
      return "Firebase denied this read. Check the signed-in user's role, record ownership, and Firestore rules.";
    case "failed-precondition":
      return "This Firestore query needs an index or valid database configuration. Check the browser console for the index link.";
    case "unavailable":
    case "network-request-failed":
      return "Firebase is unavailable right now. Check the internet connection and Firebase service status.";
    case "unauthenticated":
      return "Your Firebase session expired. Sign in again to load this data.";
    default:
      return error?.message || fallback;
  }
}
