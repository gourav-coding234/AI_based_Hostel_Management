export const PRINCIPAL_PHONE = "06766-213180";
export const PRINCIPAL_EMAIL = "principal@gcekjr.ac.in";

// Dehury's supplied phone has only 9 digits; retained exactly as provided.
// Please confirm whether one digit is missing.
export const DEFAULT_EMERGENCY_CONTACTS = [
  { id: "default-principal", name: "Principal", role: "Principal", phone: PRINCIPAL_PHONE, email: PRINCIPAL_EMAIL },
  { id: "default-boys-hostel", name: "Dr. Yogesh Kumar Nayak", role: "Boys Hostel Warden", phone: "8789958911", email: "" },
  { id: "default-girls-hostel", name: "Dr. Rajesh Kumar Tripathy", role: "Girls Hostel Warden", phone: "9776343570", email: "" },
  { id: "default-security-banamali", name: "Banamali", role: "Security Guard", phone: "9348084139", email: "" },
  { id: "default-security-dehury", name: "Dehury", role: "Security Guard", phone: "798520218", email: "" },
  { id: "default-ambulance-driver", name: "Ambulance Driver", role: "Ambulance", phone: "9437627043", email: "" },
  { id: "default-ambulance-108", name: "Ambulance (Odisha)", role: "Emergency", phone: "108", email: "" },
];

function contactKey(contact) {
  const name = String(contact?.name || "").trim().toLocaleLowerCase();
  return name || `${String(contact?.role || "").trim().toLocaleLowerCase()}|${String(contact?.phone || "").trim()}`;
}

/** Use Firestore values when present, with the supplied hostel contacts as a
 * reliable baseline when a collection is empty or temporarily unavailable. */
export function mergeEmergencyContacts(records = []) {
  const byContact = new Map(DEFAULT_EMERGENCY_CONTACTS.map((contact) => [contactKey(contact), contact]));
  records.forEach((record) => {
    const key = contactKey(record);
    const existing = byContact.get(key);
    // Supplied emergency numbers are trusted constants; stale Firestore
    // copies may add unknown contacts, but cannot overwrite these details.
    byContact.set(key, existing ? { ...record, ...existing, id: existing.id } : { ...record, id: record.id || key });
  });
  const order = new Map(DEFAULT_EMERGENCY_CONTACTS.map((contact, index) => [contactKey(contact), index]));
  return [...byContact.values()].sort((a, b) => (order.get(contactKey(a)) ?? 100) - (order.get(contactKey(b)) ?? 100) || String(a.name || "").localeCompare(String(b.name || "")));
}
