import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@app/store";

/**
 * Inverse guard: if already authenticated, do not show login/OTP pages.
 * Sends users to the app dashboard.
 */
export function GuestRoute() {
  const { accessToken, user } = useAppSelector((s) => s.auth);

  if (accessToken && user?.isProfileComplete) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
