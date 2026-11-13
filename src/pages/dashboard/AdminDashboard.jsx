import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";

const StaffProfile = lazy(() => import("./admin/StaffProfile"));
const AdminOverview = lazy(() => import("./admin/Overview"));
const DataImport = lazy(() => import("./admin/DataImport"));
const ManageUsers = lazy(() => import("./admin/ManageUsers"));
const StudentRegister = lazy(() => import("./admin/StudentRegister"));
const Complaints = lazy(() => import("./admin/Complaints"));
const Fees = lazy(() => import("./admin/Fees"));
const Expenses = lazy(() => import("./admin/Expenses"));
const Notices = lazy(() => import("./admin/Notices"));
const Reports = lazy(() => import("./admin/Reports"));
const AuditLog = lazy(() => import("./admin/AuditLog"));
const Visitors = lazy(() => import("./admin/Visitors"));
const GatePasses = lazy(() => import("./admin/GatePasses"));
const Leave = lazy(() => import("./admin/Leave"));
const Feedback = lazy(() => import("./admin/Feedback"));

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <Routes>
        <Route path="profile" element={<StaffProfile />} />
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="data-import" element={<DataImport />} />
        <Route path="student-register" element={<StudentRegister />} />
        <Route path="blocks" element={<Navigate to="/dashboard/admin/data-import" replace />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="gate-passes" element={<GatePasses />} />
        <Route path="leave" element={<Leave />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="fees" element={<Fees />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="notices" element={<Notices />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit" element={<AuditLog />} />
      </Routes>
    </DashboardLayout>
  );
}
