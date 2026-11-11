/** Canonical pass states: Pending, Approved, Rejected, Out, Completed. */
export function passStatus(pass) {
  const status = String(pass?.status || "").toLowerCase();
  const tripState = String(pass?.tripState || "").toLowerCase();
  if (["completed", "returned"].includes(status) || tripState === "returned") return "Completed";
  if (["out", "journey_started"].includes(status) || tripState === "out") return "Out";
  if (["approved", "pending", "rejected"].includes(status)) return status[0].toUpperCase() + status.slice(1);
  return pass?.status || "Pending";
}

export const isPassOut = (pass) => passStatus(pass) === "Out";
export const isPassActive = (pass) => ["Approved", "Out"].includes(passStatus(pass));
