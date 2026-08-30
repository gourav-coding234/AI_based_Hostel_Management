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
  SparkleIcon,
  EyeIcon,
  QrIcon,
  CalendarClockIcon,
  SirenIcon,
  SmileIcon,
  DownloadIcon,
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
import WardenAiAssistant from "./warden/AiAssistant";
import Visitors from "./warden/Visitors";
import GatePasses from "./warden/GatePasses";
import Leave from "./warden/Leave";
import Safety from "./warden/Safety";
import Feedback from "./warden/Feedback";
import Reports from "./warden/Reports";

const navItems = [
  { label: "Overview", to: "/dashboard/warden", end: true, icon: <HomeIcon /> },
  { label: "AI Assistant", to: "/dashboard/warden/ai-assistant", icon: <SparkleIcon /> },
  { label: "Room & Bed", to: "/dashboard/warden/rooms", icon: <BedIcon /> },
  { label: "Student Directory", to: "/dashboard/warden/directory", icon: <UsersIcon /> },
  { label: "Visitors", to: "/dashboard/warden/visitors", icon: <EyeIcon /> },
  { label: "Gate Passes", to: "/dashboard/warden/gate-passes", icon: <QrIcon /> },
  { label: "Leave Requests", to: "/dashboard/warden/leave", icon: <CalendarClockIcon /> },
  { label: "Complaints", to: "/dashboard/warden/complaints", icon: <WrenchIcon /> },
  { label: "Safety & Emergency", to: "/dashboard/warden/safety", icon: <SirenIcon /> },
  { label: "Fees", to: "/dashboard/warden/fees", icon: <WalletIcon /> },
  { label: "Mess", to: "/dashboard/warden/mess", icon: <UtensilsIcon /> },
  { label: "Attendance", to: "/dashboard/warden/attendance", icon: <CheckSquareIcon /> },
  { label: "Inventory", to: "/dashboard/warden/inventory", icon: <PackageIcon /> },
  { label: "Notices", to: "/dashboard/warden/notices", icon: <MegaphoneIcon /> },
  { label: "Feedback Analysis", to: "/dashboard/warden/feedback", icon: <SmileIcon /> },
  { label: "Reports", to: "/dashboard/warden/reports", icon: <DownloadIcon /> },
];

export default function WardenDashboard() {
  return (
    <DashboardLayout title="Warden Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<WardenOverview />} />
        <Route path="ai-assistant" element={<WardenAiAssistant />} />
        <Route path="rooms" element={<RoomAllotment />} />
        <Route path="directory" element={<StudentDirectory />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="gate-passes" element={<GatePasses />} />
        <Route path="leave" element={<Leave />} />
        <Route path="complaints" element={<WardenComplaints />} />
        <Route path="safety" element={<Safety />} />
        <Route path="fees" element={<WardenFees />} />
        <Route path="mess" element={<WardenMess />} />
        <Route path="attendance" element={<WardenAttendance />} />
        <Route path="inventory" element={<WardenInventory />} />
        <Route path="notices" element={<WardenNotices />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="reports" element={<Reports />} />
      </Routes>
    </DashboardLayout>
  );
}
