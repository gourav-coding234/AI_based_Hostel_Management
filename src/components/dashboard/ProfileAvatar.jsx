import { useEffect, useState } from "react";

/** Displays a saved photo when it can be decoded, otherwise a stable initials badge. */
export default function ProfileAvatar({ src, initials = "U", className = "", fallbackClassName = "" }) {
  const [failedSrc, setFailedSrc] = useState("");

  useEffect(() => setFailedSrc(""), [src]);

  if (src && failedSrc !== src) {
    return <img src={src} alt="" className={className} onError={() => setFailedSrc(src)} />;
  }

  return <span className={fallbackClassName}>{initials || "U"}</span>;
}
