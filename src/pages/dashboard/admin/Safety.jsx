import { Link } from "react-router-dom";
import { Card, Pill, StatCard } from "../../../components/dashboard/student/ui";
import { SirenIcon, PhoneIcon, MailIcon, AlertIcon, MegaphoneIcon, ArrowRightIcon } from "../../../components/dashboard/admin/icons";
import { sosAlerts, incidentReportsAll, emergencyContactsDirectory } from "../../../data/adminMock";

export default function Safety() {
  const activeSos = sosAlerts.filter((s) => s.status !== "Resolved").length;
  const openIncidents = incidentReportsAll.filter((i) => i.status !== "Resolved").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
              <SirenIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">Safety &amp; emergency module</p>
              <p className="text-sm text-slate-500">SOS alerts, incident reports, and emergency contacts — institute-wide.</p>
            </div>
          </div>
          <Link to="/dashboard/admin/notices" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            Publish an emergency notice <ArrowRightIcon />
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={<SirenIcon />} label="Active SOS alerts" value={activeSos} sub={`${sosAlerts.length} logged this month`} tone={activeSos > 0 ? "rose" : "teal"} />
        <StatCard icon={<AlertIcon />} label="Open incidents" value={openIncidents} sub={`${incidentReportsAll.length} reported institute-wide`} tone={openIncidents > 0 ? "amber" : "teal"} />
      </div>

      <Card title="SOS alert history">
        {sosAlerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No SOS alerts recorded.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {sosAlerts.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{s.student} <span className="font-normal text-slate-400">· {s.block}, {s.room}</span></p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.note}</p>
                  <p className="mt-1 text-xs text-slate-300">{s.time}</p>
                </div>
                <Pill tone={s.status}>{s.status}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Incident reports">
        <ul className="flex flex-col gap-3">
          {incidentReportsAll.map((i) => (
            <li key={i.id} className="rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {i.category} <span className="ml-1 font-normal text-slate-400">· {i.block} · {i.id}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">{i.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{i.date}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill tone={i.severity}>{i.severity}</Pill>
                  <Pill tone={i.status}>{i.status}</Pill>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Emergency contacts">
        <div className="grid gap-4 sm:grid-cols-2">
          {emergencyContactsDirectory.map((c) => (
            <div key={c.role} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.role}</p>
              <p className="mt-1 font-display text-sm font-semibold text-ink">{c.name}</p>
              <div className="mt-2 flex flex-col gap-1.5 text-sm text-slate-600">
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
      </Card>

      <div className="rounded-2xl border border-dashed border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-950/5 text-navy-900">
            <MegaphoneIcon />
          </span>
          <p className="text-sm text-slate-500">
            Need to alert every block at once? Head to <Link to="/dashboard/admin/notices" className="font-medium text-teal-700 hover:text-teal-800">Notices</Link> to publish an urgent, institute-wide message.
          </p>
        </div>
      </div>
    </div>
  );
}
