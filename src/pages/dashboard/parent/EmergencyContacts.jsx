import { Card } from "../../../components/dashboard/student/ui";
import { ShieldIcon, PhoneIcon, MailIcon } from "../../../components/dashboard/parent/icons";
import { emergencyContacts } from "../../../data/parentMock";

export default function EmergencyContacts() {
  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {emergencyContacts.map((c) => (
          <Card key={c.role}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.role}</p>
            <p className="mt-1.5 font-display text-base font-semibold text-ink">{c.name}</p>
            <div className="mt-3 flex flex-col gap-2">
              <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 text-sm text-teal-700 hover:underline">
                <PhoneIcon /> {c.phone}
              </a>
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 hover:underline">
                  <MailIcon /> {c.email}
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
