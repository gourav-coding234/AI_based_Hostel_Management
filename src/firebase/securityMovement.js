import { auth } from "./config";

export async function saveSecurityMovement({ direction, passId, studentId, manual, reason }) {
  const user = auth.currentUser;
  if (!user) throw new Error("UNAUTHENTICATED");
  const token = await user.getIdToken();
  const response = await fetch("/api/security/record-movement", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ direction, passId, studentId, manual, reason }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.headers.get("content-type")?.includes("application/json")) {
    const error = new Error("API_UNAVAILABLE");
    error.messageText = "The security movement service is unavailable in this Vite session. Run the Vercel development server to save gate movements.";
    throw error;
  }
  if (!response.ok) {
    const error = new Error(result.code || "MOVEMENT_FAILED");
    error.messageText = result.message || "Movement could not be saved. Try again.";
    throw error;
  }
  return result;
}
