import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  HomeIcon,
  BedIcon,
  WalletIcon,
  UtensilsIcon,
  CheckSquareIcon,
  QrIcon,
  WrenchIcon,
  PackageIcon,
  MegaphoneIcon,
} from "../../components/dashboard/student/icons";

import Overview from "./student/Overview";
import RoomBed from "./student/RoomBed";
import Fees from "./student/Fees";
import Mess from "./student/Mess";
import Attendance from "./student/Attendance";
import GatePass from "./student/GatePass";
import Complaints from "./student/Complaints";
import Inventory from "./student/Inventory";
import Notices from "./student/Notices";

const navItems = [
  { label: "Overview", to: "/dashboard/student", end: true, icon: <HomeIcon /> },
  { label: "Room & Bed", to: "/dashboard/student/rooms", icon: <BedIcon /> },
  { label: "Fees", to: "/dashboard/student/fees", icon: <WalletIcon /> },
  { label: "Mess", to: "/dashboard/student/mess", icon: <UtensilsIcon /> },
  { label: "Attendance", to: "/dashboard/student/attendance", icon: <CheckSquareIcon /> },
  { label: "Gate Pass", to: "/dashboard/student/gate-pass", icon: <QrIcon /> },
  { label: "Complaints", to: "/dashboard/student/complaints", icon: <WrenchIcon /> },
  { label: "Inventory", to: "/dashboard/student/inventory", icon: <PackageIcon /> },
  { label: "Notices", to: "/dashboard/student/notices", icon: <MegaphoneIcon /> },
];

export default function StudentDashboard() {
  return (
    <DashboardLayout title="Student Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="rooms" element={<RoomBed />} />
        <Route path="fees" element={<Fees />} />
        <Route path="mess" element={<Mess />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="gate-pass" element={<GatePass />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="notices" element={<Notices />} />
      </Routes>
    </DashboardLayout>
  );
}
