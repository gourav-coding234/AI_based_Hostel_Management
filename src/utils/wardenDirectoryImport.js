// Validation for the Warden Student Directory's "Upload CSV" action.
// Deliberately separate from utils/importSchemas.js + fileImport.js's
// validateRecords: this upload's rules don't fit that generic schema shape
// (the identifier is "uid OR email", not one required column, and room/bed
// duplicates have to be checked against the live roster, not just other
// rows in the file). parseDataFile is still reused for the actual
// CSV/Excel parsing so there's one file-reading implementation in the app.
import { parseDataFile } from "./fileImport";

export const HOSTEL_CSV_COLUMNS = ["uid", "email", "wing", "room", "bed"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Room/bed labels in this app look like "B-204" or "12" — letters, digits,
// spaces and a hyphen/slash, nothing that could be a formula or garbage.
const ROOM_RE = /^[A-Za-z0-9][A-Za-z0-9\-/ ]{0,19}$/;
const BED_RE = /^[A-Za-z0-9][A-Za-z0-9\-]{0,9}$/;

/**
 * Validates one already-parsed row against the live roster (`directory`,
 * the same merged rows the table renders — each with `id` as its UID).
 * Returns null when the row is valid, or an error string otherwise.
 * Exported mainly so the two duplicate checks below share one code path.
 */
function findConflictOccupant(directory, wing, room, bed, uid, email) {
  const norm = (v) => String(v || "").trim().toLowerCase();
  return directory.find((s) => {
    if (norm(s.wing) !== norm(wing) || norm(s.room) !== norm(room) || norm(s.bed) !== norm(bed)) return false;
    const sameStudent = (uid && s.id === uid) || (email && norm(s.email) === norm(email));
    return !sameStudent;
  });
}

/**
 * Parses a File and validates it into rows bulkUpsertHostelAssignments can
 * write, catching problems before anything reaches Firestore:
 *  - a required identifier (uid or email)
 *  - a syntactically valid room/bed (and both given together, or neither)
 *  - no two rows in the file targeting the same student
 *  - no two rows (or a row and an existing resident) targeting the same
 *    wing+room+bed unless it's the same student already there
 *  - when `assignedWing` is set (this warden is scoped to one block), no
 *    row targeting a different wing
 *
 * directory: the live, already-merged roster rows (see StudentDirectory) —
 * used only to detect bed clashes against residents already in the
 * database, never written to directly.
 */
export async function parseAndValidateHostelCsv(file, { directory = [], assignedWing = "" } = {}) {
  const { records } = await parseDataFile(file);
  const errors = [];
  const validRecords = [];
  const seenIdentifiers = new Set();
  const seenBeds = new Set();

  if (records.length === 0) {
    return { validRecords, errors: [{ row: 0, field: "", message: "The file has no data rows." }], totalRows: 0 };
  }

  records.forEach((raw, idx) => {
    const rowNum = idx + 2; // header row + 1-indexing
    const uid = String(raw.uid || "").trim();
    const email = String(raw.email || "").trim();
    const wing = String(raw.wing || raw.block || "").trim();
    const room = String(raw.room || "").trim();
    const bed = String(raw.bed || "").trim();
    const identifier = uid || email;

    if (!identifier) {
      errors.push({ row: rowNum, field: "uid / email", message: "Give a Student UID or Email to identify the student." });
      return;
    }
    if (email && !EMAIL_RE.test(email)) {
      errors.push({ row: rowNum, field: "email", message: `"${email}" isn't a valid email.` });
      return;
    }
    if (room && !ROOM_RE.test(room)) {
      errors.push({ row: rowNum, field: "room", message: `"${room}" doesn't look like a valid room.` });
      return;
    }
    if (bed && !BED_RE.test(bed)) {
      errors.push({ row: rowNum, field: "bed", message: `"${bed}" doesn't look like a valid bed.` });
      return;
    }
    if ((room && !bed) || (bed && !room)) {
      errors.push({ row: rowNum, field: "room / bed", message: "Room and Bed must be given together." });
      return;
    }

    // A block-assigned warden can only re-assign students who currently
    // live in (or have no wing yet in) their own block.
    if (assignedWing) {
      const norm = (v) => String(v || "").trim().toLowerCase();
      const current = directory.find((s) => (uid && s.id === uid) || (email && norm(s.email) === norm(email)));
      if (current?.wing && current.wing !== assignedWing) {
        errors.push({ row: rowNum, field: "uid / email", message: `${identifier} belongs to ${current.wing}, outside your assigned block.` });
        return;
      }
    }

    const effectiveWing = wing || assignedWing;
    if (assignedWing && wing && wing !== assignedWing) {
      errors.push({
        row: rowNum,
        field: "wing",
        message: `You're only assigned to ${assignedWing}; this row targets ${wing}.`,
      });
      return;
    }
    if ((room || bed) && !effectiveWing) {
      errors.push({ row: rowNum, field: "wing", message: "A wing/block is required to assign a room and bed." });
      return;
    }

    const idKey = identifier.toLowerCase();
    if (seenIdentifiers.has(idKey)) {
      errors.push({ row: rowNum, field: "uid / email", message: `Duplicate row for ${identifier} — already applied earlier in this file.` });
      return;
    }
    seenIdentifiers.add(idKey);

    if (room && bed) {
      const bedKey = `${effectiveWing.toLowerCase()}||${room.toLowerCase()}||${bed.toLowerCase()}`;
      if (seenBeds.has(bedKey)) {
        errors.push({ row: rowNum, field: "room / bed", message: `Bed ${bed} in ${room} (${effectiveWing}) is assigned twice in this file.` });
        return;
      }
      const occupant = findConflictOccupant(directory, effectiveWing, room, bed, uid, email);
      if (occupant) {
        errors.push({
          row: rowNum,
          field: "room / bed",
          message: `Bed ${bed} in ${room} (${effectiveWing}) is already occupied by ${occupant.name || occupant.id}.`,
        });
        return;
      }
      seenBeds.add(bedKey);
    }

    validRecords.push({
      uid: uid || undefined,
      email: email || undefined,
      wing: effectiveWing || undefined,
      room: room || undefined,
      bed: bed || undefined,
    });
  });

  return { validRecords, errors, totalRows: records.length };
}
