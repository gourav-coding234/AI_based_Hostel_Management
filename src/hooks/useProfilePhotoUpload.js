import { useState } from "react";
import { fileToProfilePhotoDataUrl } from "../utils/image";
import { saveLocalProfilePhoto } from "../utils/localProfilePhotos";

export function useProfilePhotoUpload(user, setLocalProfilePhoto, onUploaded) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  async function upload(file, imageOptions = {}) {
    if (!file) return "";
    if (!user?.uid) {
      setError("Your account is not ready. Refresh and try again.");
      return "";
    }
    setError("");
    setProgress(0);
    setStage("Preparing photo");
    setUploading(true);
    try {
      const photoURL = await fileToProfilePhotoDataUrl(file, imageOptions);
      setStage("Saving to this browser");
      saveLocalProfilePhoto(user?.uid, photoURL);
      if (localStorage.getItem(`gce-hostel:profile-photo:v1:${user.uid}`) !== photoURL) {
        throw new Error("The photo was not saved by this browser. Check that site storage is enabled, then try again.");
      }
      setProgress(100);
      setLocalProfilePhoto?.(photoURL);
      onUploaded?.(photoURL);
      return photoURL;
    } catch (cause) {
      console.error("Could not save profile photo in this browser:", cause);
      setError(cause?.message || "Could not save this photo. Please try again.");
      return "";
    } finally {
      setUploading(false);
      setStage("");
    }
  }

  async function remove() {
    setError("");
    setProgress(0);
    setStage("Removing photo");
    setUploading(true);
    try {
      // Keep an empty local override so an older Firebase photo URL does not reappear.
      saveLocalProfilePhoto(user?.uid, "");
      setLocalProfilePhoto?.("");
      onUploaded?.("");
      return true;
    } catch (cause) {
      console.error("Could not remove local profile photo:", cause);
      setError(cause?.message || "Could not remove this photo. Please try again.");
      return false;
    } finally {
      setUploading(false);
      setStage("");
    }
  }

  return { upload, remove, uploading, progress, stage, error, clearError: () => setError("") };
}
