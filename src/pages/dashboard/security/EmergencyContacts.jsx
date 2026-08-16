import { Card } from "../../../components/dashboard/student/ui";
import { PhoneIcon, MailIcon, ShieldIcon } from "../../../components/dashboard/security/icons";
import { emergencyContacts } from "../../../data/securityMock";

export default function SecurityEmergencyContacts() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
            <ShieldIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Emergency contacts</p>
            <p className="text-sm text-slate-500">Keep these on hand at the gate desk.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {emergencyContacts.map((c) => (
          <div key={c.role} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.role}</p>
            <p className="mt-1 font-display text-base font-semibold text-ink">{c.name}</p>
            <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-600">
              {c.phone && (
                <a href={`tel:${c.phone}`} className="flex items-center gap-2 hover:text-teal-700">
                  <PhoneIcon /> {c.phone}
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-teal-700">
                  <MailIcon /> {c.email}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
