import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
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
} from "../../components/dashboard/admin/icons";

import AdminOverview from "./admin/Overview";
import ManageUsers from "./admin/ManageUsers";
import Wardens from "./admin/Wardens";
import Complaints from "./admin/Complaints";
import Fees from "./admin/Fees";
import Notices from "./admin/Notices";
import Blocks from "./admin/Blocks";
import Reports from "./admin/Reports";
import AuditLog from "./admin/AuditLog";
import AiAssistant from "./admin/AiAssistant";
import Visitors from "./admin/Visitors";
import GatePasses from "./admin/GatePasses";
import Leave from "./admin/Leave";
import Safety from "./admin/Safety";
import Feedback from "./admin/Feedback";

const navItems = [
  { label: "Overview", to: "/dashboard/admin", end: true, icon: <ChartIcon /> },
  { label: "AI Assistant", to: "/dashboard/admin/ai-assistant", icon: <SparkleIcon /> },
  { label: "Manage Users", to: "/dashboard/admin/users", icon: <UserPlusIcon /> },
  { label: "Wardens", to: "/dashboard/admin/wardens", icon: <UsersIcon /> },
  { label: "Blocks & Rooms", to: "/dashboard/admin/blocks", icon: <BuildingIcon /> },
  { label: "Visitors", to: "/dashboard/admin/visitors", icon: <EyeIcon /> },
  { label: "Gate Passes", to: "/dashboard/admin/gate-passes", icon: <QrIcon /> },
  { label: "Leave Requests", to: "/dashboard/admin/leave", icon: <CalendarClockIcon /> },
  { label: "Complaints", to: "/dashboard/admin/complaints", icon: <WrenchIcon /> },
  { label: "Safety & Emergency", to: "/dashboard/admin/safety", icon: <SirenIcon /> },
  { label: "Fees", to: "/dashboard/admin/fees", icon: <WalletIcon /> },
  { label: "Notices", to: "/dashboard/admin/notices", icon: <MegaphoneIcon /> },
  { label: "Feedback Analysis", to: "/dashboard/admin/feedback", icon: <SmileIcon /> },
  { label: "Reports", to: "/dashboard/admin/reports", icon: <DownloadIcon /> },
  { label: "Audit Log", to: "/dashboard/admin/audit", icon: <ClipboardIcon /> },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="ai-assistant" element={<AiAssistant />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="wardens" element={<Wardens />} />
        <Route path="blocks" element={<Blocks />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="gate-passes" element={<GatePasses />} />
        <Route path="leave" element={<Leave />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="safety" element={<Safety />} />
        <Route path="fees" element={<Fees />} />
        <Route path="notices" element={<Notices />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit" element={<AuditLog />} />
      </Routes>
    </DashboardLayout>
  );
}
