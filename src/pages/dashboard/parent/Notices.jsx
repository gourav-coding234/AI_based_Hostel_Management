import { useState } from "react";
import { Card, Pill } from "../../../components/dashboard/student/ui";
import { MegaphoneIcon } from "../../../components/dashboard/parent/icons";
import { notices } from "../../../data/studentMock";

export default function ParentNotices() {
  const [openId, setOpenId] = useState(notices[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <MegaphoneIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Notice board</p>
            <p className="text-sm text-slate-500">Published by the warden and hostel admin.</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {notices.map((n) => {
          const open = openId === n.id;
          return (
            <div key={n.id} className="rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : n.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{n.postedBy} · {n.date}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Pill tone={n.priority}>{n.priority}</Pill>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                  >
                    <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
              {open && (
                <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:px-6">
                  {n.body}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
