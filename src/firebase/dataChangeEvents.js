/** Notify dashboard snapshots that a successful write may have made cached data stale. */
export function publishDataChange(collectionName) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("hostel:firestore-data-changed", {
    detail: { collection: collectionName },
  }));
}
