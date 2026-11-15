export async function createStudentRequest(user, request) {
  if (!user) throw new Error("Your student session has expired. Sign in again.");
  const token = await user.getIdToken();
  const response = await fetch("/api/create-student-request", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(request),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "The request could not be saved.");
  return result;
}
