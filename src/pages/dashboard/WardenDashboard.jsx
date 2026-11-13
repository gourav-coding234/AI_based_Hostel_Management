import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";

const StaffProfile = lazy(() => import("./admin/StaffProfile"));
const WardenOverview = lazy(() => import("./warden/Overview"));
const WardenFees = lazy(() => import("./warden/WardenFees"));
const WardenMess = lazy(() => import("./warden/WardenMess"));
const WardenAttendance = lazy(() => import("./warden/WardenAttendance"));
const WardenComplaints = lazy(() => import("./warden/WardenComplaints"));
const WardenInventory = lazy(() => import("./warden/WardenInventory"));
const StudentDirectory = lazy(() => import("./warden/StudentDirectory"));
const WardenNotices = lazy(() => import("./warden/WardenNotices"));
const Visitors = lazy(() => import("./warden/Visitors"));
const GatePasses = lazy(() => import("./warden/GatePasses"));
const Leave = lazy(() => import("./warden/Leave"));

export default function WardenDashboard() {
  return (
    <DashboardLayout title="Warden Dashboard">
      <Routes>
        <Route path="profile" element={<StaffProfile />} />
        <Route index element={<WardenOverview />} />
        <Route path="directory" element={<StudentDirectory />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="gate-passes" element={<GatePasses />} />
        <Route path="leave" element={<Leave />} />
        <Route path="complaints" element={<WardenComplaints />} />
        <Route path="fees" element={<WardenFees />} />
        <Route path="mess" element={<WardenMess />} />
        <Route path="attendance" element={<WardenAttendance />} />
        <Route path="inventory" element={<WardenInventory />} />
        <Route path="notices" element={<WardenNotices />} />
      </Routes>
    </DashboardLayout>
  );
}
