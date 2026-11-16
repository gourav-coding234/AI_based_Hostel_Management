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

export async function approveStudentGatePass(passId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in again to approve gate passes.");
  const token = await user.getIdToken();
  const response = await fetch("/api/security/approve-gate-pass", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ passId }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("The gate pass approval service is unavailable. Run the Vercel development server and try again.");
  }
  if (!response.ok) throw new Error(result.message || "Gate pass could not be approved. Try again.");
  return result;
}
