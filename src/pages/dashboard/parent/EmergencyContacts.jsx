import { Card } from "../../../components/dashboard/student/ui";
import { AsyncSection } from "../../../components/ui/DataState";
import { ShieldIcon, PhoneIcon, MailIcon } from "../../../components/dashboard/parent/icons";
import { useCollection } from "../../../hooks/useCollection";

export default function EmergencyContacts() {
  const contacts = useCollection("emergencyContacts", { orderByField: "role", orderByDirection: "asc" });

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

      <AsyncSection
        loading={contacts.loading}
        error={contacts.error}
        isEmpty={contacts.isEmpty}
        emptyTitle="No emergency contacts published yet"
        emptyDescription="The hostel office hasn't added any emergency contacts yet."
        emptyIcon={<ShieldIcon />}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {contacts.data.map((c) => (
            <Card key={c.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.role}</p>
              <p className="mt-1.5 font-display text-base font-semibold text-ink">{c.name}</p>
              <div className="mt-3 flex flex-col gap-2">
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 text-sm text-teal-700 hover:underline">
                    <PhoneIcon /> {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 hover:underline">
                    <MailIcon /> {c.email}
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </AsyncSection>
    </div>
  );
}
