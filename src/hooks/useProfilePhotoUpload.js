import { useState } from "react";
import { uploadProfilePhoto } from "../firebase/firestore";

export function useProfilePhotoUpload(user, refreshProfile, onUploaded, role = "") {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function upload(file) {
    if (!file) return "";
    setError("");
    setProgress(0);
    setUploading(true);
    try {
      const url = await uploadProfilePhoto(user?.uid, file, setProgress, role);
      onUploaded?.(url);
      await refreshProfile?.();
      return url;
    } catch (cause) {
      console.error("Profile photo upload failed:", cause);
      setError(cause?.code === "storage/unauthorized"
        ? "Firebase Storage denied this upload. Deploy storage.rules and check the signed-in account's profile."
        : cause?.message || "Could not upload this photo.");
      return "";
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, progress, error, clearError: () => setError("") };
}
