// Extra icons for the admin dashboard, matching the existing icon style
// (20x20 viewBox, currentColor stroke, 1.6 width). Re-exports the shared
// student/warden icon sets too, so admin pages only need one import.

const base = { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6 };

export {
  HomeIcon,
  BedIcon,
  WalletIcon,
  UtensilsIcon,
  CheckSquareIcon,
  QrIcon,
  WrenchIcon,
  PackageIcon,
  MegaphoneIcon,
  PlusIcon,
  ArrowRightIcon,
  AlertIcon,
} from "../student/icons";

export {
  UsersIcon,
  ChartIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
} from "../warden/icons";

export {
  PhoneIcon,
  MailIcon,
} from "../parent/icons";

export {
  SirenIcon,
  ScanIcon,
  LogInIcon,
  LogOutIcon,
  CalendarClockIcon,
} from "../security/icons";

export const BuildingIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M4 17V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v13M4 17h13M11 17v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 6h1.5M6.5 9h1.5M6.5 12h1.5" strokeLinecap="round" />
  </svg>
);

export const DownloadIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M10 3v9.5M6 9l4 4 4-4M4 16.5h12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ClipboardIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <rect x="4.5" y="3.5" width="11" height="14" rx="1.5" />
    <path d="M7.5 3.2h5a.8.8 0 0 1 .8.8v1H6.7v-1a.8.8 0 0 1 .8-.8Z" />
    <path d="M7 9.5h6M7 12.5h6M7 15h3.5" strokeLinecap="round" />
  </svg>
);

export const ShieldIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M10 2.5 16 5v5c0 4-2.6 6.8-6 8-3.4-1.2-6-4-6-8V5Z" strokeLinejoin="round" />
    <path d="M7.3 9.8 9.2 11.7 12.8 7.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UserPlusIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <circle cx="7.5" cy="7" r="2.8" />
    <path d="M2.5 16.2c0-2.8 2.2-4.7 5-4.7s5 1.9 5 4.7" strokeLinecap="round" />
    <path d="M15 6v4.5M12.8 8.25h4.4" strokeLinecap="round" />
  </svg>
);

export const SparkleIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M10 2.5c.4 2.6 1.2 4.2 2 5s2.4 1.6 5 2c-2.6.4-4.2 1.2-5 2s-1.6 2.4-2 5c-.4-2.6-1.2-4.2-2-5s-2.4-1.6-5-2c2.6-.4 4.2-1.2 5-2s1.6-2.4 2-5Z" strokeLinejoin="round" />
    <path d="M15.8 3v2.4M14.6 4.2H17" strokeLinecap="round" />
  </svg>
);

export const ChatIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v6A1.5 1.5 0 0 1 15.5 13H9l-3.5 3v-3H4.5A1.5 1.5 0 0 1 3 11.5Z" strokeLinejoin="round" />
  </svg>
);

export const SendIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M17 3 2.5 9.2 9 11l1.8 6.5Z" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M17 3 9 11" strokeLinecap="round" />
  </svg>
);

export const SmileIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <circle cx="10" cy="10" r="7" />
    <path d="M7 11.2c.6 1.1 1.7 1.8 3 1.8s2.4-.7 3-1.8" strokeLinecap="round" />
    <circle cx="7.3" cy="8.1" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12.7" cy="8.1" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const MehIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <circle cx="10" cy="10" r="7" />
    <path d="M7 12.3h6" strokeLinecap="round" />
    <circle cx="7.3" cy="8.1" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12.7" cy="8.1" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const FrownIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <circle cx="10" cy="10" r="7" />
    <path d="M7 13c.6-1.1 1.7-1.8 3-1.8s2.4.7 3 1.8" strokeLinecap="round" />
    <circle cx="7.3" cy="8.1" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12.7" cy="8.1" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const EyeIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M2 10s2.8-5.5 8-5.5S18 10 18 10s-2.8 5.5-8 5.5S2 10 2 10Z" strokeLinejoin="round" />
    <circle cx="10" cy="10" r="2.3" />
  </svg>
);

export const UploadIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M10 13V4" strokeLinecap="round" />
    <path d="M6 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 14v2a2 2 0 002 2h8a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
