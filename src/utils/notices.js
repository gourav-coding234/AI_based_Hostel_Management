import { normalizeHostel } from "./hostels";

/** Backward-compatible visibility check for legacy wing-targeted notices. */
function extractWingLetter(text) {
  if (!text) return null;
  const match = String(text).match(/\b([A-Za-z])\b/);
  return match ? match[1].toUpperCase() : null;
}

export function noticeAppliesTo(noticeTarget, studentHostel) {
  const target = String(noticeTarget || "Both").trim().toLowerCase();
  if (["both", "all", "all hostels", "institute-wide", "general"].includes(target)) return true;
  const audience = target.includes("girl") || target.includes("female") ? "girls" : target.includes("boy") || target.includes("male") ? "boys" : "";
  if (!audience) {
    // Preserve old wing-addressed notices by comparing block letter only
    // when the stored value is explicitly a wing. New notices use hostel targets.
    const targetLetter = extractWingLetter(noticeTarget);
    const studentLetter = extractWingLetter(studentHostel);
    return Boolean(targetLetter && studentLetter && targetLetter === studentLetter);
  }
  const student = String(studentHostel || "").toLowerCase();
  return audience === "girls"
    ? student.includes("girl") || student.includes("female")
    : student.includes("boy") || student.includes("male");
}
export function hostelForNoticeProfile(profile = {}) {
  return normalizeHostel(profile.hostel) || normalizeHostel(profile.hostelType) ||
    normalizeHostel(profile.gender) || normalizeHostel(profile.hostelResidence);
}

export function noticeQueryTargets(studentProfile = {}) {
  const hostel = hostelForNoticeProfile(studentProfile);
  // Student/Parent Firestore rules permit institute-wide and canonical
  // hostel targets. Wing names such as "West" are not a hostel audience and
  // adding them to this IN query makes Firestore reject the entire read.
  return [...new Set(["Both", "Both Hostels", "All Hostels", ...(hostel ? [hostel] : [])])];
}
