import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";

const Overview = lazy(() => import("./security/Overview"));
const GateDesk = lazy(() => import("./security/GateDesk"));
const Attendance = lazy(() => import("./security/Attendance"));
const VisitorLog = lazy(() => import("./security/VisitorLog"));
const IncidentReports = lazy(() => import("./security/IncidentReports"));
const EmergencyContacts = lazy(() => import("./security/EmergencyContacts"));
const Notices = lazy(() => import("./security/Notices"));
const Profile = lazy(() => import("./security/Profile"));

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
