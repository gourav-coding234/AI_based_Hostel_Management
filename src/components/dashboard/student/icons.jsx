// Minimal stroke-style icon set matching the app's existing icon (see
// SimpleDashboard's home icon): 20x20 viewBox, currentColor stroke, 1.6 width.

const base = { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6 };

export const HomeIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M3 10.5 10 4l7 6.5M5 9.5V17h3.5v-4h3v4H16V9.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BedIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M2.5 16V6.5m0 9.5H17.5m0 0v-5a2 2 0 0 0-2-2H8m9.5 7v-3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.5 12.5V9.5H8v3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="5" cy="7.2" r="1.2" />
  </svg>
);

export const WalletIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <rect x="2.5" y="5.5" width="15" height="10.5" rx="2" />
    <path d="M2.5 8.5h15" />
    <circle cx="13.5" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const UtensilsIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M5 2.5v6a1.5 1.5 0 0 0 3 0v-6M6.5 8.5V17.5M13.5 2.5c-1.4 0-2.5 1.8-2.5 4s1.1 4 2.5 4V17.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckSquareIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <rect x="3" y="3" width="14" height="14" rx="3" />
    <path d="M6.5 10.2 9 12.7l4.5-5.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const QrIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <rect x="2.7" y="2.7" width="5.5" height="5.5" rx="1" />
    <rect x="11.8" y="2.7" width="5.5" height="5.5" rx="1" />
    <rect x="2.7" y="11.8" width="5.5" height="5.5" rx="1" />
    <path d="M12.3 12.3h2v2h-2zM15.8 12.3h1.5v1.5h-1.5zM12.3 15.8h1.5v1.5h-1.5zM15.5 15.8h1.8v1.8h-1.8z" fill="currentColor" stroke="none" />
  </svg>
);

export const WrenchIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M12.5 3.2a4 4 0 0 0-5.2 4.9L2.8 12.6a1.6 1.6 0 0 0 2.3 2.3l4.5-4.5a4 4 0 0 0 4.9-5.2l-2.4 2.4-1.8-.6-.6-1.8 2.4-2.4Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PackageIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M10 2.5 3 6.2v7.6l7 3.7 7-3.7V6.2Z" strokeLinejoin="round" />
    <path d="M3 6.2 10 10l7-3.8M10 10v7.5" strokeLinejoin="round" />
  </svg>
);

export const MegaphoneIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <path d="M3 8v4l3 .4v2.1a1.2 1.2 0 0 0 2.4 0V12.7l7.6 1.1V6.2L8.4 7.3H3Z" strokeLinejoin="round" />
    <path d="M15.8 8.4a2.2 2.2 0 0 1 0 3.2" strokeLinecap="round" />
  </svg>
);

export const AlertIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M10 3 2.5 16h15L10 3Z" strokeLinejoin="round" />
    <path d="M10 8v3.5" strokeLinecap="round" />
    <circle cx="10" cy="13.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const PlusIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
  </svg>
);

export const ArrowRightIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UserIcon = (p) => (
  <svg width="18" height="18" {...base} {...p}>
    <circle cx="10" cy="7" r="3.3" />
    <path d="M3.5 17c0-3.3 2.9-5.6 6.5-5.6s6.5 2.3 6.5 5.6" strokeLinecap="round" />
  </svg>
);

export const CameraIcon = (p) => (
  <svg width="16" height="16" {...base} {...p}>
    <path d="M3 7.2a1.2 1.2 0 0 1 1.2-1.2h1.6l.8-1.4h6.8l.8 1.4h1.6A1.2 1.2 0 0 1 17 7.2v7.6A1.2 1.2 0 0 1 15.8 16H4.2A1.2 1.2 0 0 1 3 14.8Z" strokeLinejoin="round" />
    <circle cx="10" cy="10.8" r="3" />
  </svg>
);
