import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@app/store";

/**
 * Guards routes that require an authenticated user.
 * Unauth users are bounced to /login; once they log in,
 * the original URL is restored via location.state.from.
 *
 * If the user is authenticated but has not yet completed
 * their profile, force them through /complete-profile.
 */
export function ProtectedRoute() {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user && !user.isProfileComplete && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
}
