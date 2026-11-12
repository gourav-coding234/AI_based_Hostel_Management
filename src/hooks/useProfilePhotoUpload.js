import { useState } from "react";
import { removeProfilePhoto, uploadProfilePhoto } from "../firebase/firestore";

export function useProfilePhotoUpload(user, refreshProfile, onUploaded, role = "") {
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
      const url = await uploadProfilePhoto(user?.uid, file, setProgress, role, setStage, imageOptions);
      onUploaded?.(url);
      await refreshProfile?.();
      return url;
    } catch (cause) {
      console.error("Profile photo upload failed:", cause);
      const code = cause?.code || cause?.cause?.code;
      if (code === "storage/unauthorized") {
        setError("Firebase Storage denied the photo. Deploy the profile photo Storage rules, then try again.");
      } else if (code === "permission-denied") {
        setError("Firebase denied saving your profile photo. Check the Firestore rule that allows you to update photoURL on your own profile.");
      } else if (code === "storage/bucket-not-found" || code === "storage/no-default-bucket") {
        setError("Firebase Storage has no bucket configured. Set the Storage bucket in the app's deployment settings.");
      } else if (code === "unavailable" || code === "deadline-exceeded" || code === "network-request-failed") {
        setError("The photo could not be saved because the connection to Firebase failed. Check your connection and try again.");
      } else {
        setError(cause?.message || "Could not upload this photo.");
      }
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
      await removeProfilePhoto(user?.uid, role);
      onUploaded?.("");
      await refreshProfile?.();
      return true;
    } catch (cause) {
      console.error("Could not remove profile photo:", cause);
      setError(cause?.code === "permission-denied"
        ? "Firebase denied removing the photo. Check your profile photo permissions."
        : cause?.message || "Could not remove this photo. Please try again.");
      return false;
    } finally {
      setUploading(false);
      setStage("");
    }
  }

  return { upload, remove, uploading, progress, stage, error, clearError: () => setError("") };
}
