import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@app/store";
import { defaultHomeFor } from "@shared/guards/RoleGuard";

/**
 * Inverse guard: if already authenticated, do not show login/OTP pages.
 * Sends users to the correct home page for their role.
 */
export function GuestRoute() {
  const { accessToken, user } = useAppSelector((s) => s.auth);

  if (accessToken && user?.isProfileComplete) {
    return <Navigate to={defaultHomeFor(user.role)} replace />;
  }

  return <Outlet />;
}
