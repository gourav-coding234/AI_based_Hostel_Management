const PROFILE_PHOTO_KEY_PREFIX = "gce-hostel:profile-photo:v1:";

function storageKey(uid) {
  return `${PROFILE_PHOTO_KEY_PREFIX}${uid}`;
}

/** Returns null when this account has no local photo override. */
export function getLocalProfilePhoto(uid) {
  if (!uid || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey(uid));
  } catch {
    return null;
  }
}

/** Store the compressed image only in this browser, scoped to the signed-in account. */
export function saveLocalProfilePhoto(uid, photoURL) {
  if (!uid) throw new Error("Your account is not ready. Refresh and try again.");
  try {
    window.localStorage.setItem(storageKey(uid), photoURL || "");
  } catch (error) {
    if (error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      throw new Error("This browser is out of photo storage. Remove some site data and try again.");
    }
    throw new Error("This browser could not save the photo. Check that site storage is enabled and try again.");
  }
}
