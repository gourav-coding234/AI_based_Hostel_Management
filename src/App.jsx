import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import WardenDashboard from "./pages/dashboard/WardenDashboard";
import ParentDashboard from "./pages/dashboard/ParentDashboard";
import SecurityDashboard from "./pages/dashboard/SecurityDashboard";
import { ROLES } from "./roles";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard/admin/*"
        element={
          <ProtectedRoute allowedRole={ROLES.ADMIN}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student/*"
        element={
          <ProtectedRoute allowedRole={ROLES.STUDENT}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/warden/*"
        element={
          <ProtectedRoute allowedRole={ROLES.WARDEN}>
            <WardenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/parent/*"
        element={
          <ProtectedRoute allowedRole={ROLES.PARENT}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/security/*"
        element={
          <ProtectedRoute allowedRole={ROLES.SECURITY}>
            <SecurityDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
