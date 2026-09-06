import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import Overview from "./parent/Overview";
import Profile from "./parent/Profile";
import Attendance from "./parent/Attendance";
import Fees from "./parent/Fees";
import GatePass from "./parent/GatePass";
import RoomBed from "./parent/RoomBed";
import Notices from "./parent/Notices";
import EmergencyContacts from "./parent/EmergencyContacts";

export default function ParentDashboard() {
  return (
    <DashboardLayout title="Parent Dashboard">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="fees" element={<Fees />} />
        <Route path="gate-pass" element={<GatePass />} />
        <Route path="room" element={<RoomBed />} />
        <Route path="notices" element={<Notices />} />
        <Route path="emergency" element={<EmergencyContacts />} />
      </Routes>
    </DashboardLayout>
  );
}
