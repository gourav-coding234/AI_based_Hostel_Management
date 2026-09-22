/**
 * Notices are targeted at a wing via a fixed dropdown ("All Wings", "A
 * Wing", "B Wing", "C Wing", ...), but a student's own block is a free-text
 * field (hostelResidence — could be entered as "Block C", "C Wing", "C",
 * "Wing-C", etc). There's no guaranteed shared format, so this compares
 * the single wing LETTER found in each string rather than the strings
 * themselves.
 *
 * Deliberately biased toward showing a notice when in doubt: if either
 * side's letter can't be confidently extracted, or the student has no
 * block on file at all, the notice is shown. Hiding a real notice due to a
 * data-entry format mismatch is worse than showing an occasionally
 * irrelevant one — a targeted notice should only ever be hidden when we
 * can positively tell it's for a different, specific wing.
 */
function extractWingLetter(text) {
  if (!text) return null;
  const match = String(text).match(/\b([A-Za-z])\b/);
  return match ? match[1].toUpperCase() : null;
}

export function noticeAppliesTo(noticeTarget, studentBlock) {
  if (!noticeTarget || /^all\b/i.test(noticeTarget.trim())) return true;

  const targetLetter = extractWingLetter(noticeTarget);
  if (!targetLetter) return true; // couldn't parse the target — don't hide it

  const studentLetter = extractWingLetter(studentBlock);
  if (!studentLetter) return true; // student has no parseable block on file — don't hide it

  return targetLetter === studentLetter;
}
