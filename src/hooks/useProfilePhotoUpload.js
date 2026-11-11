import { useState } from "react";
import { uploadProfilePhoto } from "../firebase/firestore";

export function useProfilePhotoUpload(user, refreshProfile, onUploaded, role = "") {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  async function upload(file) {
    if (!file) return "";
    setError("");
    setProgress(0);
    setStage("Preparing photo");
    setUploading(true);
    try {
      const url = await uploadProfilePhoto(user?.uid, file, setProgress, role, setStage);
      onUploaded?.(url);
      await refreshProfile?.();
      return url;
    } catch (cause) {
      console.error("Profile photo upload failed:", cause);
      const code = cause?.code || cause?.cause?.code;
      if (code === "storage/unauthorized") {
        setError("Firebase Storage denied this upload. Publish storage.rules and confirm this signed-in account can write its own profile photo.");
      } else if (code === "storage/bucket-not-found" || code === "storage/project-not-found") {
        setError("The Firebase Storage bucket was not found. Set VITE_FIREBASE_STORAGE_BUCKET to the bucket shown in Firebase Console, then redeploy the app.");
      } else if (code === "storage/quota-exceeded") {
        setError("Firebase Storage has reached its quota. Check Storage usage in Firebase Console.");
      } else if (code === "storage/retry-limit-exceeded" || code === "storage/canceled") {
        setError("The upload could not finish. Check your connection and Firebase Storage setup, then try again.");
      } else {
        setError(cause?.message || "Could not upload this photo.");
      }
      return "";
    } finally {
      setUploading(false);
      setStage("");
    }
  }

  return { upload, uploading, progress, stage, error, clearError: () => setError("") };
}
