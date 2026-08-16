// Extra icons for the parent dashboard, matching the existing icon style
// (20x20 viewBox, currentColor stroke, 1.6 width). Re-exports the shared
// icon sets too, so parent pages only need one import.

const base = { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6 };

export {
  HomeIcon,
  BedIcon,
  WalletIcon,
  UtensilsIcon,
  CheckSquareIcon,
  QrIcon,
  WrenchIcon,
  MegaphoneIcon,
  ArrowRightIcon,
  UserIcon,
  CameraIcon,
  AlertIcon,
} from "../student/icons";

export const PhoneIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M4.5 3h2.3l1 3.2-1.6 1.4a9 9 0 0 0 4.2 4.2l1.4-1.6 3.2 1v2.3a1.2 1.2 0 0 1-1.3 1.2A12.5 12.5 0 0 1 3.3 4.3 1.2 1.2 0 0 1 4.5 3Z" strokeLinejoin="round" />
  </svg>
);

export const MailIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <rect x="2.5" y="4.5" width="15" height="11" rx="1.8" />
    <path d="m3.2 5.5 6.8 5 6.8-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ShieldIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M10 2.5 16 5v5c0 4-2.6 6.8-6 8-3.4-1.2-6-4-6-8V5Z" strokeLinejoin="round" />
    <path d="M7.3 9.8 9.2 11.7 12.8 7.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
