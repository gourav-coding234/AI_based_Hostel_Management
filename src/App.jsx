import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ROLES } from "./roles";

// Each role's dashboard pulls in ~15-20 pages. Loading all five eagerly
// meant every visitor downloaded the entire application — including four
// dashboards they can never open — before the login screen would paint.
// Splitting per role keeps the initial download to the public site plus
// the one dashboard the signed-in user actually has access to.
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
const StudentDashboard = lazy(() => import("./pages/dashboard/StudentDashboard"));
const WardenDashboard = lazy(() => import("./pages/dashboard/WardenDashboard"));
const ParentDashboard = lazy(() => import("./pages/dashboard/ParentDashboard"));
const SecurityDashboard = lazy(() => import("./pages/dashboard/SecurityDashboard"));

function RouteFallback() {
  return (
    <div className="route-fallback">
      <span className="route-spinner" aria-hidden="true" />
      <span>Loading…</span>
    </div>
  );
}

function Guarded({ role, children }) {
  return (
    <ProtectedRoute allowedRole={role}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard/admin/*"
        element={
          <Guarded role={ROLES.ADMIN}>
            <AdminDashboard />
          </Guarded>
        }
      />
      <Route
        path="/dashboard/student/*"
        element={
          <Guarded role={ROLES.STUDENT}>
            <StudentDashboard />
          </Guarded>
        }
      />
      <Route
        path="/dashboard/warden/*"
        element={
          <Guarded role={ROLES.WARDEN}>
            <WardenDashboard />
          </Guarded>
        }
      />
      <Route
        path="/dashboard/parent/*"
        element={
          <Guarded role={ROLES.PARENT}>
            <ParentDashboard />
          </Guarded>
        }
      />
      <Route
        path="/dashboard/security/*"
        element={
          <Guarded role={ROLES.SECURITY}>
            <SecurityDashboard />
          </Guarded>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
