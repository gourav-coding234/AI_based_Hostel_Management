export function publishReadStatus(key, error = "", source = key) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("hostel:firestore-read-status", { detail: { key, error, source } }));
}
