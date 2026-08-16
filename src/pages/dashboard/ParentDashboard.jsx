import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  HomeIcon,
  UserIcon,
  BedIcon,
  WalletIcon,
  CheckSquareIcon,
  QrIcon,
  MegaphoneIcon,
  ShieldIcon,
} from "../../components/dashboard/parent/icons";

import Overview from "./parent/Overview";
import Profile from "./parent/Profile";
import Attendance from "./parent/Attendance";
import Fees from "./parent/Fees";
import GatePass from "./parent/GatePass";
import RoomBed from "./parent/RoomBed";
import Notices from "./parent/Notices";
import EmergencyContacts from "./parent/EmergencyContacts";

const navItems = [
  { label: "Overview", to: "/dashboard/parent", end: true, icon: <HomeIcon /> },
  { label: "My Profile", to: "/dashboard/parent/profile", icon: <UserIcon /> },
  { label: "Attendance", to: "/dashboard/parent/attendance", icon: <CheckSquareIcon /> },
  { label: "Fees", to: "/dashboard/parent/fees", icon: <WalletIcon /> },
  { label: "Gate Pass", to: "/dashboard/parent/gate-pass", icon: <QrIcon /> },
  { label: "Room & Bed", to: "/dashboard/parent/room", icon: <BedIcon /> },
  { label: "Notices", to: "/dashboard/parent/notices", icon: <MegaphoneIcon /> },
  { label: "Emergency Contacts", to: "/dashboard/parent/emergency", icon: <ShieldIcon /> },
];

export default function ParentDashboard() {
  return (
    <DashboardLayout title="Parent Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="fees" element={<Fees />} />
        <Route path="gate-pass" element={<GatePass />} />
        <Route path="room" element={<RoomBed />} />
        <Route path="notices" element={<Notices />} />
        <Route path="emergency" element={<EmergencyContacts />} />
      </Routes>
    </DashboardLayout>
  );
}
