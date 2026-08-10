import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../roles";

/**
 * Wrap a route element with this to require sign-in.
 * Pass `allowedRole` to also require the signed-in user's Firestore role
 * to match — mismatches get redirected to their own dashboard, not booted
 * to login, since they ARE authenticated, just on the wrong page.
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-navy-800">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-800/20 border-t-teal-500" />
          <span className="font-medium">Loading your session…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  return children;
}
