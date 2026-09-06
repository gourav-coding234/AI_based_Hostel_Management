// ---------------------------------------------------------------------------
// Single source of truth for dashboard navigation. Each *Dashboard.jsx shell
// still owns its own <Routes> (since routes need the actual page
// components), but the SIDEBAR is driven entirely from here — grouped into
// sections, per role. To add a new page to the sidebar: add one entry below
// and one <Route> in the matching *Dashboard.jsx. Nothing else needs to
// change.
//
// Shape:
//   NAVIGATION[role] = [ { section: "Label", items: [ {label, to, end?, icon} ] }, ... ]
// ---------------------------------------------------------------------------
import { ROLES } from "../roles";

import {
  ChartIcon,
  UserPlusIcon,
  UsersIcon,
  WrenchIcon,
  WalletIcon,
  MegaphoneIcon,
  BuildingIcon,
  DownloadIcon,
  ClipboardIcon,
  SparkleIcon,
  EyeIcon,
  QrIcon,
  CalendarClockIcon,
  SirenIcon,
  SmileIcon,
  UploadIcon,
} from "../components/dashboard/admin/icons";

import {
  HomeIcon,
  UserIcon,
  BedIcon,
  WalletIcon as StudentWalletIcon,
  UtensilsIcon,
  CheckSquareIcon,
  QrIcon as StudentQrIcon,
  WrenchIcon as StudentWrenchIcon,
  MegaphoneIcon as StudentMegaphoneIcon,
  PackageIcon,
  AlertIcon as StudentAlertIcon,
} from "../components/dashboard/student/icons";

import { ShieldIcon } from "../components/dashboard/parent/icons";
import { ScanIcon, ListIcon } from "../components/dashboard/security/icons";

export const NAVIGATION = {
  [ROLES.ADMIN]: [
    {
      section: "Main",
      items: [{ label: "Overview", to: "/dashboard/admin", end: true, icon: <ChartIcon /> }],
    },
    {
      section: "AI",
      items: [{ label: "AI Assistant", to: "/dashboard/admin/ai-assistant", icon: <SparkleIcon /> }],
    },
    {
      section: "Hostel",
      items: [
        { label: "Manage Users", to: "/dashboard/admin/users", icon: <UserPlusIcon /> },
        { label: "Wardens", to: "/dashboard/admin/wardens", icon: <UsersIcon /> },
        { label: "Blocks & Rooms", to: "/dashboard/admin/blocks", icon: <BuildingIcon /> },
      ],
    },
    {
      section: "Services",
      items: [
        { label: "Visitors", to: "/dashboard/admin/visitors", icon: <EyeIcon /> },
        { label: "Gate Passes", to: "/dashboard/admin/gate-passes", icon: <QrIcon /> },
        { label: "Leave Requests", to: "/dashboard/admin/leave", icon: <CalendarClockIcon /> },
        { label: "Complaints", to: "/dashboard/admin/complaints", icon: <WrenchIcon /> },
        { label: "Notices", to: "/dashboard/admin/notices", icon: <MegaphoneIcon /> },
      ],
    },
    {
      section: "Finance",
      items: [{ label: "Fees", to: "/dashboard/admin/fees", icon: <WalletIcon /> }],
    },
    {
      section: "Safety",
      items: [{ label: "Safety & Emergency", to: "/dashboard/admin/safety", icon: <SirenIcon /> }],
    },
    {
      section: "Analytics",
      items: [
        { label: "Feedback Analysis", to: "/dashboard/admin/feedback", icon: <SmileIcon /> },
        { label: "Reports", to: "/dashboard/admin/reports", icon: <DownloadIcon /> },
        { label: "Audit Log", to: "/dashboard/admin/audit", icon: <ClipboardIcon /> },
      ],
    },
    {
      section: "Data",
      items: [{ label: "Data Import", to: "/dashboard/admin/data-import", icon: <UploadIcon /> }],
    },
  ],

  [ROLES.STUDENT]: [
    {
      section: "Main",
      items: [{ label: "Overview", to: "/dashboard/student", end: true, icon: <HomeIcon /> }],
    },
    {
      section: "Hostel",
      items: [
        { label: "Room & Bed", to: "/dashboard/student/rooms", icon: <BedIcon /> },
        { label: "Attendance", to: "/dashboard/student/attendance", icon: <CheckSquareIcon /> },
        { label: "Mess", to: "/dashboard/student/mess", icon: <UtensilsIcon /> },
        { label: "Inventory", to: "/dashboard/student/inventory", icon: <PackageIcon /> },
      ],
    },
    {
      section: "Finance",
      items: [{ label: "Fees", to: "/dashboard/student/fees", icon: <StudentWalletIcon /> }],
    },
    {
      section: "Services",
      items: [
        { label: "Gate Pass", to: "/dashboard/student/gate-pass", icon: <StudentQrIcon /> },
        { label: "Complaints", to: "/dashboard/student/complaints", icon: <StudentWrenchIcon /> },
        { label: "Leave Request", to: "/dashboard/student/leave", icon: <StudentAlertIcon /> },
        { label: "Feedback", to: "/dashboard/student/feedback", icon: <SmileIcon /> },
        { label: "Notices", to: "/dashboard/student/notices", icon: <StudentMegaphoneIcon /> },
      ],
    },
    {
      section: "Settings",
      items: [{ label: "My Profile", to: "/dashboard/student/profile", icon: <UserIcon /> }],
    },
  ],

  [ROLES.WARDEN]: [
    {
      section: "Main",
      items: [{ label: "Overview", to: "/dashboard/warden", end: true, icon: <HomeIcon /> }],
    },
    {
      section: "AI",
      items: [{ label: "AI Assistant", to: "/dashboard/warden/ai-assistant", icon: <SparkleIcon /> }],
    },
    {
      section: "Hostel",
      items: [
        { label: "Student Directory", to: "/dashboard/warden/directory", icon: <UsersIcon /> },
        { label: "Room & Bed", to: "/dashboard/warden/rooms", icon: <BedIcon /> },
        { label: "Attendance", to: "/dashboard/warden/attendance", icon: <CheckSquareIcon /> },
      ],
    },
    {
      section: "Services",
      items: [
        { label: "Visitors", to: "/dashboard/warden/visitors", icon: <EyeIcon /> },
        { label: "Gate Passes", to: "/dashboard/warden/gate-passes", icon: <QrIcon /> },
        { label: "Leave Requests", to: "/dashboard/warden/leave", icon: <CalendarClockIcon /> },
        { label: "Complaints", to: "/dashboard/warden/complaints", icon: <WrenchIcon /> },
        { label: "Notices", to: "/dashboard/warden/notices", icon: <MegaphoneIcon /> },
      ],
    },
    {
      section: "Finance",
      items: [{ label: "Fees", to: "/dashboard/warden/fees", icon: <WalletIcon /> }],
    },
    {
      section: "Operations",
      items: [
        { label: "Mess", to: "/dashboard/warden/mess", icon: <UtensilsIcon /> },
        { label: "Inventory", to: "/dashboard/warden/inventory", icon: <PackageIcon /> },
        { label: "Safety & Emergency", to: "/dashboard/warden/safety", icon: <SirenIcon /> },
      ],
    },
    {
      section: "Analytics",
      items: [
        { label: "Feedback Analysis", to: "/dashboard/warden/feedback", icon: <SmileIcon /> },
        { label: "Reports", to: "/dashboard/warden/reports", icon: <DownloadIcon /> },
      ],
    },
  ],

  [ROLES.PARENT]: [
    {
      section: "Main",
      items: [{ label: "Overview", to: "/dashboard/parent", end: true, icon: <HomeIcon /> }],
    },
    {
      section: "Hostel",
      items: [
        { label: "Room & Bed", to: "/dashboard/parent/room", icon: <BedIcon /> },
        { label: "Attendance", to: "/dashboard/parent/attendance", icon: <CheckSquareIcon /> },
      ],
    },
    {
      section: "Finance",
      items: [{ label: "Fees", to: "/dashboard/parent/fees", icon: <StudentWalletIcon /> }],
    },
    {
      section: "Services",
      items: [
        { label: "Gate Pass", to: "/dashboard/parent/gate-pass", icon: <StudentQrIcon /> },
        { label: "Notices", to: "/dashboard/parent/notices", icon: <StudentMegaphoneIcon /> },
        { label: "Emergency Contacts", to: "/dashboard/parent/emergency", icon: <ShieldIcon /> },
      ],
    },
    {
      section: "Settings",
      items: [{ label: "My Profile", to: "/dashboard/parent/profile", icon: <UserIcon /> }],
    },
  ],

  [ROLES.SECURITY]: [
    {
      section: "Main",
      items: [{ label: "Overview", to: "/dashboard/security", end: true, icon: <HomeIcon /> }],
    },
    {
      section: "Gate Desk",
      items: [
        { label: "Gate Scan", to: "/dashboard/security/gate-scan", icon: <ScanIcon /> },
        { label: "In / Out Register", to: "/dashboard/security/in-out", icon: <ListIcon /> },
        { label: "Visitor Log", to: "/dashboard/security/visitors", icon: <UserPlusIcon /> },
      ],
    },
    {
      section: "Safety",
      items: [
        { label: "Incident Reports", to: "/dashboard/security/incidents", icon: <SirenIcon /> },
        { label: "Duty Roster", to: "/dashboard/security/duty-roster", icon: <CalendarClockIcon /> },
        { label: "Emergency Contacts", to: "/dashboard/security/emergency", icon: <ShieldIcon /> },
      ],
    },
    {
      section: "Services",
      items: [{ label: "Notices", to: "/dashboard/security/notices", icon: <MegaphoneIcon /> }],
    },
    {
      section: "Settings",
      items: [{ label: "My Profile", to: "/dashboard/security/profile", icon: <UserIcon /> }],
    },
  ],
};

/** Flat list of every nav item for a role — used for breadcrumbs and search. */
export function flatNavForRole(role) {
  return (NAVIGATION[role] || []).flatMap((group) => group.items.map((item) => ({ ...item, section: group.section })));
}
