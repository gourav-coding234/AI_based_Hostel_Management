export const DEFAULT_EMERGENCY_CONTACTS = [
  { id: "default-boys-hostel", name: "Dr. Yogesh Kumar Nayak", role: "Boys Hostel", phone: "8789958911", email: "" },
  { id: "default-girls-hostel", name: "Dr. Rajesh Kumar Tripathy", role: "Girls Hostel", phone: "9776343570", email: "" },
  { id: "default-security-banamali", name: "Banamali", role: "Security", phone: "9348084139", email: "" },
  { id: "default-security-dehury", name: "Dehury", role: "Security", phone: "798520218", email: "" },
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
    byContact.set(key, { ...existing, ...record, id: record.id || existing?.id || key });
  });
  return [...byContact.values()].sort((a, b) => String(a.role || "").localeCompare(String(b.role || "")) || String(a.name || "").localeCompare(String(b.name || "")));
}
