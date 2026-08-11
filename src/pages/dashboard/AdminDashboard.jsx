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

const navItems = [
  { label: "Overview", to: "/dashboard/admin", end: true, icon: <ChartIcon /> },
  { label: "Manage Users", to: "/dashboard/admin/users", icon: <UserPlusIcon /> },
  { label: "Wardens", to: "/dashboard/admin/wardens", icon: <UsersIcon /> },
  { label: "Complaints", to: "/dashboard/admin/complaints", icon: <WrenchIcon /> },
  { label: "Fees", to: "/dashboard/admin/fees", icon: <WalletIcon /> },
  { label: "Notices", to: "/dashboard/admin/notices", icon: <MegaphoneIcon /> },
  { label: "Blocks & Rooms", to: "/dashboard/admin/blocks", icon: <BuildingIcon /> },
  { label: "Reports", to: "/dashboard/admin/reports", icon: <DownloadIcon /> },
  { label: "Audit Log", to: "/dashboard/admin/audit", icon: <ClipboardIcon /> },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="wardens" element={<Wardens />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="fees" element={<Fees />} />
        <Route path="notices" element={<Notices />} />
        <Route path="blocks" element={<Blocks />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit" element={<AuditLog />} />
      </Routes>
    </DashboardLayout>
  );
}
