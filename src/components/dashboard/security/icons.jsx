// Extra icons for the security dashboard, matching the existing icon style
// (20x20 viewBox, currentColor stroke, 1.6 width). Re-exports the shared
// icon sets too, so security pages only need one import.

const base = { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6 };

export {
  HomeIcon,
  QrIcon,
  MegaphoneIcon,
  ArrowRightIcon,
  UserIcon,
  CameraIcon,
  AlertIcon,
  PlusIcon,
} from "../student/icons";

export { PhoneIcon, MailIcon, ShieldIcon } from "../parent/icons";

export const ScanIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M3 6.5V4.2A1.2 1.2 0 0 1 4.2 3h2.3M13.5 3h2.3A1.2 1.2 0 0 1 17 4.2v2.3M17 13.5v2.3a1.2 1.2 0 0 1-1.2 1.2h-2.3M6.5 17H4.2A1.2 1.2 0 0 1 3 15.8v-2.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 10h14" strokeLinecap="round" />
  </svg>
);

export const UserPlusIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <circle cx="8" cy="7" r="3" />
    <path d="M2.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" />
    <path d="M15.5 6.5v4M13.5 8.5h4" strokeLinecap="round" />
  </svg>
);

export const ListIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M6.5 5h9M6.5 10h9M6.5 15h9" strokeLinecap="round" />
    <circle cx="3" cy="5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="3" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="3" cy="15" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const SirenIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M4 15v-3.5A6 6 0 0 1 10 5.5v0a6 6 0 0 1 6 6V15" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 15h14M10 5.5V3M7.5 3h5" strokeLinecap="round" />
  </svg>
);

export const CalendarClockIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <rect x="3" y="4" width="14" height="12.5" rx="2" />
    <path d="M3 8h14M7 2.5v3M13 2.5v3" strokeLinecap="round" />
    <circle cx="12.5" cy="12.5" r="2.6" />
    <path d="M12.5 11.2v1.3l0.9 0.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LogInIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M8 3.5H4.5A1.5 1.5 0 0 0 3 5v10a1.5 1.5 0 0 0 1.5 1.5H8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 6.5 16.5 10 13 13.5M16.2 10H8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LogOutIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M12 3.5h3.5A1.5 1.5 0 0 1 17 5v10a1.5 1.5 0 0 1-1.5 1.5H12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 6.5 3.5 10 7 13.5M3.8 10H12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
