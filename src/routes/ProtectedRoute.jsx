import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../roles";
import { ErrorState } from "../components/ui/DataState";
import PortalLoader from "../components/ui/PortalLoader";

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
    return <PortalLoader label="Checking your secure session…" />;
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
