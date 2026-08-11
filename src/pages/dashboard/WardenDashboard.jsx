import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  HomeIcon,
  BedIcon,
  WalletIcon,
  UtensilsIcon,
  CheckSquareIcon,
  WrenchIcon,
  PackageIcon,
  MegaphoneIcon,
  UsersIcon,
} from "../../components/dashboard/warden/icons";

import WardenOverview from "./warden/Overview";
import RoomAllotment from "./warden/RoomAllotment";
import WardenFees from "./warden/WardenFees";
import WardenMess from "./warden/WardenMess";
import WardenAttendance from "./warden/WardenAttendance";
import WardenComplaints from "./warden/WardenComplaints";
import WardenInventory from "./warden/WardenInventory";
import StudentDirectory from "./warden/StudentDirectory";
import WardenNotices from "./warden/WardenNotices";

const navItems = [
  { label: "Overview", to: "/dashboard/warden", end: true, icon: <HomeIcon /> },
  { label: "Room & Bed", to: "/dashboard/warden/rooms", icon: <BedIcon /> },
  { label: "Fees", to: "/dashboard/warden/fees", icon: <WalletIcon /> },
  { label: "Mess", to: "/dashboard/warden/mess", icon: <UtensilsIcon /> },
  { label: "Attendance", to: "/dashboard/warden/attendance", icon: <CheckSquareIcon /> },
  { label: "Complaints", to: "/dashboard/warden/complaints", icon: <WrenchIcon /> },
  { label: "Inventory", to: "/dashboard/warden/inventory", icon: <PackageIcon /> },
  { label: "Student Directory", to: "/dashboard/warden/directory", icon: <UsersIcon /> },
  { label: "Notices", to: "/dashboard/warden/notices", icon: <MegaphoneIcon /> },
];

export default function WardenDashboard() {
  return (
    <DashboardLayout title="Warden Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<WardenOverview />} />
        <Route path="rooms" element={<RoomAllotment />} />
        <Route path="fees" element={<WardenFees />} />
        <Route path="mess" element={<WardenMess />} />
        <Route path="attendance" element={<WardenAttendance />} />
        <Route path="complaints" element={<WardenComplaints />} />
        <Route path="inventory" element={<WardenInventory />} />
        <Route path="directory" element={<StudentDirectory />} />
        <Route path="notices" element={<WardenNotices />} />
      </Routes>
    </DashboardLayout>
  );
}
