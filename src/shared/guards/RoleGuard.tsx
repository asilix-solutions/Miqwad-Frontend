import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@app/store";
import type { UserRole } from "@modules/auth/types";

/**
 * Guards a route subtree to one or more user roles.
 *
 * - Unauthenticated users are bounced to /login (handled by
 *   ProtectedRoute upstream, but we double-check defensively).
 * - Authenticated users whose role is *not* in `allow` are
 *   redirected to a sensible home page for their actual role.
 *
 * For a "provider" we additionally honour `providerStatus`:
 *   - "pending"  → /provider/pending
 *   - "rejected" → /provider/pending (same screen, different copy)
 *   - "approved" → /provider/services
 *
 * This is the single source of truth for cross-role redirects.
 */
interface RoleGuardProps {
  allow: ReadonlyArray<UserRole>;
}

/** Maps a role to its primary landing route. */
function defaultHomeFor(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/providers";
    case "provider":
      return "/provider/services";
    case "driver":
    case "customer":
    default:
      return "/app/dashboard";
  }
}

export function RoleGuard({ allow }: RoleGuardProps) {
  const user = useAppSelector((s) => s.auth.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allow.includes(user.role)) {
    return <Outlet />;
  }

  return <Navigate to={defaultHomeFor(user.role)} replace />;
}
