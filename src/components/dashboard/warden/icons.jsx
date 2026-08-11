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
