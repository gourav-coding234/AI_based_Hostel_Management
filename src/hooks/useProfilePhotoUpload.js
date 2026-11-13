import { useState } from "react";
import { fileToResizedJpegBlob } from "../utils/image";
import { saveLocalProfilePhoto } from "../utils/localProfilePhotos";

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("The browser could not prepare this photo. Please try another image."));
    reader.readAsDataURL(blob);
  });
}

function confirmImageCanDisplay(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0
      ? resolve()
      : reject(new Error("The selected photo could not be opened. Please choose another image."));
    image.onerror = () => reject(new Error("The selected photo could not be opened. Please choose another image."));
    image.src = dataUrl;
  });
}

export function useProfilePhotoUpload(user, setLocalProfilePhoto, onUploaded) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  async function upload(file, imageOptions = {}) {
    if (!file) return "";
    setError("");
    setProgress(0);
    setStage("Preparing photo");
    setUploading(true);
    try {
      const blob = await fileToResizedJpegBlob(file, imageOptions);
      const photoURL = await blobToDataUrl(blob);
      await confirmImageCanDisplay(photoURL);
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
