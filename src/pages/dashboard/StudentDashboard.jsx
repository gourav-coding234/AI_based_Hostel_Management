import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";

const Overview = lazy(() => import("./student/Overview"));
const Fees = lazy(() => import("./student/Fees"));
const Mess = lazy(() => import("./student/Mess"));
const Attendance = lazy(() => import("./student/Attendance"));
const GatePass = lazy(() => import("./student/GatePass"));
const Complaints = lazy(() => import("./student/Complaints"));
const Notices = lazy(() => import("./student/Notices"));
const Profile = lazy(() => import("./student/Profile"));
const Leave = lazy(() => import("./student/Leave"));
const EmergencyContacts = lazy(() => import("./parent/EmergencyContacts"));

export default function StudentDashboard() {
  return (
    <DashboardLayout title="Student Dashboard">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="fees" element={<Fees />} />
        <Route path="mess" element={<Mess />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="gate-pass" element={<GatePass />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="notices" element={<Notices />} />
        <Route path="leave" element={<Leave />} />
        <Route path="emergency" element={<EmergencyContacts />} />
      </Routes>
    </DashboardLayout>
  );
}
