import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  HomeIcon,
  ScanIcon,
  ListIcon,
  UserPlusIcon,
  SirenIcon,
  CalendarClockIcon,
  ShieldIcon,
  MegaphoneIcon,
  UserIcon,
} from "../../components/dashboard/security/icons";

import Overview from "./security/Overview";
import GateScan from "./security/GateScan";
import InOutRegister from "./security/InOutRegister";
import VisitorLog from "./security/VisitorLog";
import IncidentReports from "./security/IncidentReports";
import DutyRoster from "./security/DutyRoster";
import EmergencyContacts from "./security/EmergencyContacts";
import Notices from "./security/Notices";
import Profile from "./security/Profile";

const navItems = [
  { label: "Overview", to: "/dashboard/security", end: true, icon: <HomeIcon /> },
  { label: "My Profile", to: "/dashboard/security/profile", icon: <UserIcon /> },
  { label: "Gate Scan", to: "/dashboard/security/gate-scan", icon: <ScanIcon /> },
  { label: "In / Out Register", to: "/dashboard/security/in-out", icon: <ListIcon /> },
  { label: "Visitor Log", to: "/dashboard/security/visitors", icon: <UserPlusIcon /> },
  { label: "Incident Reports", to: "/dashboard/security/incidents", icon: <SirenIcon /> },
  { label: "Duty Roster", to: "/dashboard/security/duty-roster", icon: <CalendarClockIcon /> },
  { label: "Emergency Contacts", to: "/dashboard/security/emergency", icon: <ShieldIcon /> },
  { label: "Notices", to: "/dashboard/security/notices", icon: <MegaphoneIcon /> },
];

export default function SecurityDashboard() {
  return (
    <DashboardLayout title="Security Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="gate-scan" element={<GateScan />} />
        <Route path="in-out" element={<InOutRegister />} />
        <Route path="visitors" element={<VisitorLog />} />
        <Route path="incidents" element={<IncidentReports />} />
        <Route path="duty-roster" element={<DutyRoster />} />
        <Route path="emergency" element={<EmergencyContacts />} />
        <Route path="notices" element={<Notices />} />
      </Routes>
    </DashboardLayout>
  );
}
