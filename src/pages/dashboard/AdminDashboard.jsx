import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import AdminOverview from "./admin/Overview";
import DataImport from "./admin/DataImport";
import ManageUsers from "./admin/ManageUsers";
import Wardens from "./admin/Wardens";
import StudentRegister from "./admin/StudentRegister";
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

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="ai-assistant" element={<AiAssistant />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="data-import" element={<DataImport />} />
        <Route path="wardens" element={<Wardens />} />
        <Route path="student-register" element={<StudentRegister />} />
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
