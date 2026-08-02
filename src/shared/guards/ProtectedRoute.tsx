import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@app/store";

/**
 * Guards routes that require an authenticated user.
 * Unauth users are bounced to /login; once they log in,
 * the original URL is restored via location.state.from.
 *
 * Profile completeness is captured at signup time now (password + type
 * collected by /register/{type}), so there is no separate complete-profile
 * gate here — see OtpPage for the one remaining incomplete-profile case
 * (a provider verified via the phone/OTP flow who hasn't onboarded yet).
 */
export function ProtectedRoute() {
  const { accessToken } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
