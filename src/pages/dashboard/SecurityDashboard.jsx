import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import Overview from "./security/Overview";
import GateDesk from "./security/GateDesk";
import Attendance from "./security/Attendance";
import VisitorLog from "./security/VisitorLog";
import IncidentReports from "./security/IncidentReports";
import EmergencyContacts from "./security/EmergencyContacts";
import Notices from "./security/Notices";
import Profile from "./security/Profile";

export default function SecurityDashboard() {
  return (
    <DashboardLayout title="Security Dashboard">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="gate-desk" element={<GateDesk />} />
        <Route path="gate-scan" element={<Navigate to="/dashboard/security/gate-desk" replace />} />
        <Route path="in-out" element={<Navigate to="/dashboard/security/gate-desk" replace />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="visitors" element={<VisitorLog />} />
        <Route path="incidents" element={<IncidentReports />} />
        <Route path="emergency" element={<EmergencyContacts />} />
        <Route path="notices" element={<Notices />} />
      </Routes>
    </DashboardLayout>
  );
}
