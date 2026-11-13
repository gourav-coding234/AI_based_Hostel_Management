import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";

const Overview = lazy(() => import("./parent/Overview"));
const Profile = lazy(() => import("./parent/Profile"));
const Attendance = lazy(() => import("./parent/Attendance"));
const Fees = lazy(() => import("./parent/Fees"));
const GatePass = lazy(() => import("./parent/GatePass"));
const Notices = lazy(() => import("./parent/Notices"));
const EmergencyContacts = lazy(() => import("./parent/EmergencyContacts"));

export default function ParentDashboard() {
  return (
    <DashboardLayout title="Parent Dashboard">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="fees" element={<Fees />} />
        <Route path="gate-pass" element={<GatePass />} />
        <Route path="notices" element={<Notices />} />
        <Route path="emergency" element={<EmergencyContacts />} />
      </Routes>
    </DashboardLayout>
  );
}
