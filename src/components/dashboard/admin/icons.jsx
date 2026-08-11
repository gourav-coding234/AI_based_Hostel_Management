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
} from "../warden/icons";

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
