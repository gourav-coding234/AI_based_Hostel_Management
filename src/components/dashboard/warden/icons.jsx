// Extra icons for the warden dashboard, matching the existing icon style
// (20x20 viewBox, currentColor stroke, 1.6 width). Re-exports the shared
// student icon set too, so warden pages only need one import.

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
  PhoneIcon,
  MailIcon,
} from "../parent/icons";

export {
  SirenIcon,
  CalendarClockIcon,
} from "../security/icons";

export const UsersIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <circle cx="7.2" cy="7" r="2.4" />
    <path d="M2.5 16c0-2.6 2.1-4.3 4.7-4.3S12 13.4 12 16" strokeLinecap="round" />
    <circle cx="14" cy="7.6" r="2" />
    <path d="M13 11.9c2.2.2 3.9 1.7 3.9 4.1" strokeLinecap="round" />
  </svg>
);

export const ChartIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M3 17V3M3 17h14" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 14V9.5M10 14V6M14 14v-3.5" strokeLinecap="round" />
  </svg>
);

export const SearchIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <circle cx="8.6" cy="8.6" r="5.1" />
    <path d="m16 16-3.5-3.5" strokeLinecap="round" />
  </svg>
);

export const EditIcon = (p) => (
  <svg width="15" height="15" {...base} {...p}>
    <path d="M12.9 2.9 16 6l-9 9-3.6.9L4.3 12l8.6-9.1Z" strokeLinejoin="round" />
  </svg>
);

export const TrashIcon = (p) => (
  <svg width="15" height="15" {...base} {...p}>
    <path d="M3.5 5.5h12M8 5.5V4a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v1.5M6 5.5v10a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon = (p) => (
  <svg width="15" height="15" {...base} {...p}>
    <path d="M4 10.2 8 14l8-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const XIcon = (p) => (
  <svg width="15" height="15" {...base} {...p}>
    <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
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

export const DownloadIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M10 3v9.5M6 9l4 4 4-4M4 16.5h12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
