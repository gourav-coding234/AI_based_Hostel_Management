import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import Overview from "./security/Overview";
import GateScan from "./security/GateScan";
import InOutRegister from "./security/InOutRegister";
import LeaveExit from "./security/LeaveExit";
import Attendance from "./security/Attendance";
import VisitorLog from "./security/VisitorLog";
import IncidentReports from "./security/IncidentReports";
import DutyRoster from "./security/DutyRoster";
import EmergencyContacts from "./security/EmergencyContacts";
import Notices from "./security/Notices";
import Profile from "./security/Profile";

export default function SecurityDashboard() {
  return (
    <DashboardLayout title="Security Dashboard">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="gate-scan" element={<GateScan />} />
        <Route path="in-out" element={<InOutRegister />} />
        <Route path="leave-exit" element={<LeaveExit />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="visitors" element={<VisitorLog />} />
        <Route path="incidents" element={<IncidentReports />} />
        <Route path="duty-roster" element={<DutyRoster />} />
        <Route path="emergency" element={<EmergencyContacts />} />
        <Route path="notices" element={<Notices />} />
      </Routes>
    </DashboardLayout>
  );
}
