import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../roles";
import { ErrorState } from "../components/ui/DataState";

/**
 * Wrap a route element with this to require sign-in.
 * Pass `allowedRole` to also require the signed-in user's Firestore role
 * to match — mismatches get redirected to their own dashboard, not booted
 * to login, since they ARE authenticated, just on the wrong page.
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role, loading, error, refreshProfile } = useAuth();
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

  if (isAuthenticated && error) {
    return <div className="mx-auto mt-12 max-w-2xl px-6"><ErrorState message={error} onRetry={refreshProfile} /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role) {
    return <div className="mx-auto mt-12 max-w-2xl px-6"><ErrorState message="Your account is signed in, but it has no valid role profile. Ask an administrator to check your users document." /></div>;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  return children;
}
