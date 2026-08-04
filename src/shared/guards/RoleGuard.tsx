import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@app/store";
import type { User, UserRole } from "@modules/auth/types";
import type { ProviderType } from "@modules/providers/types";

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

/** Maps a provider type to its primary dashboard. */
export function providerHomeFor(type: import("@modules/providers/types").ProviderType | undefined): string {
  if (type === "dealer") return "/provider/dealer/dashboard";
  if (type === "workshop") return "/provider/workshop/dashboard";
  if (type === "scrap") return "/provider/scrap/dashboard";
  return "/provider/services";
}


/** Maps a role to its primary landing route.
 *
 *  This is the **single source of truth** for post-login / redirect landing.
 *  Every call-site that needs "where does this role go?" must import and
 *  call this function — never duplicate the mapping.
 */
/**
 * TODO(provider-status): the live backend's login response has no
 * `isActive`/status field yet — providers are active-by-default, so a
 * missing `providerStatus` (real backend) is treated as approved. Only an
 * EXPLICIT "pending"/"rejected" (as set by the mock onboarding flow) gates
 * access. When the backend adds `isActive` to /auth/login (or
 * /api/profile), switch this to gate on `isActive === false`.
 */
export function isProviderApproved(user: User): boolean {
  return user.providerStatus == null || user.providerStatus === "approved";
}

/**
 * Resolves a provider's sub-type, preferring `user.providerType` (populated
 * from the numeric role at login for the real backend) and falling back to
 * `fallback` (typically `/provider/me`'s `type`, which only the mock
 * backend serves — the real backend has no such endpoint yet).
 */
export function resolveProviderType(
  user: User,
  fallback?: ProviderType,
): ProviderType | undefined {
  return user.providerType ?? fallback ?? undefined;
}

export function defaultHomeFor(role: UserRole): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin/dashboard";
    case "provider":
      return "/provider";
    case "driver":
    case "customer":
    default:
      // ===== FROZEN: client/EndUser landing — revert to "/app/dashboard" when client routes are re-enabled =====
      return "/unavailable";
      // ===== END FROZEN =====
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
