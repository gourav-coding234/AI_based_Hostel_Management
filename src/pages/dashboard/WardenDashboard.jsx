import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import WardenOverview from "./warden/Overview";
import RoomAllotment from "./warden/RoomAllotment";
import WardenFees from "./warden/WardenFees";
import WardenMess from "./warden/WardenMess";
import WardenAttendance from "./warden/WardenAttendance";
import WardenComplaints from "./warden/WardenComplaints";
import WardenInventory from "./warden/WardenInventory";
import StudentDirectory from "./warden/StudentDirectory";
import WardenNotices from "./warden/WardenNotices";
import Visitors from "./warden/Visitors";
import GatePasses from "./warden/GatePasses";
import Leave from "./warden/Leave";

export default function WardenDashboard() {
  return (
    <DashboardLayout title="Warden Dashboard">
      <Routes>
        <Route index element={<WardenOverview />} />
        <Route path="rooms" element={<RoomAllotment />} />
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
