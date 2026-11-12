import { Card } from "../../../components/dashboard/student/ui";
import { ShieldIcon, PhoneIcon, MailIcon } from "../../../components/dashboard/parent/icons";
import { useCollection } from "../../../hooks/useCollection";
import { mergeEmergencyContacts } from "../../../data/emergencyContacts";

// Builds a dial-safe value for the `tel:` target only (keeps a leading "+",
// strips spaces, dashes, brackets, dots and other display formatting).
// The human-readable number is still what gets displayed.
function toTelTarget(raw) {
  const value = String(raw ?? "").trim();
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return `${value.startsWith("+") ? "+" : ""}${digits}`;
}

function clean(value) {
  return value == null ? "" : String(value).trim();
}

// Read-only view: parents can view and tap published contacts, never edit them.
// Only role, name, phone and email are read from each contact document.
export default function EmergencyContacts() {
  const contactsQuery = useCollection("emergencyContacts", { limitCount: 100 });
  const contacts = mergeEmergencyContacts(contactsQuery.data);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
            <ShieldIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Emergency contacts</p>
            <p className="text-sm text-slate-500">Quick numbers for anything urgent involving your child.</p>
          </div>
        </div>
      </Card>

      {contactsQuery.error && <p className="text-xs text-slate-500">Showing the saved hostel emergency numbers. Live contact updates are unavailable right now.</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {contacts.map((c) => {
            const role = clean(c.role);
            const name = clean(c.name);
            const phone = clean(c.phone);
            const email = clean(c.email);
            const telTarget = toTelTarget(phone);
            return (
              <Card key={c.id} className={c.id === "default-principal" ? "sm:col-span-2" : ""}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{role || "Contact"}</p>
                <p className="mt-1.5 font-display text-base font-semibold text-ink">{name || "Unnamed contact"}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {phone &&
                    (telTarget ? (
                      <a href={`tel:${telTarget}`} className="flex items-center gap-2 text-sm text-teal-700 hover:underline">
                        <PhoneIcon /> {phone}
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 text-sm text-slate-500">
                        <PhoneIcon /> {phone}
                      </span>
                    ))}
                  {email && (
                    <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 hover:underline">
                      <MailIcon /> {email}
                    </a>
                  )}
                  {!phone && !email && <span className="text-sm text-slate-400">No contact details available</span>}
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
