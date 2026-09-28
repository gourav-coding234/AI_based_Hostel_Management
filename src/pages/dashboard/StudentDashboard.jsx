import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import Overview from "./student/Overview";
import Fees from "./student/Fees";
import Mess from "./student/Mess";
import Attendance from "./student/Attendance";
import GatePass from "./student/GatePass";
import Complaints from "./student/Complaints";
import Notices from "./student/Notices";
import Profile from "./student/Profile";
import Leave from "./student/Leave";

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
      </Routes>
    </DashboardLayout>
  );
}
