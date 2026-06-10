/**
 * @file Route-level permission guard for react-router.
 *
 * `<PermissionGuard>` is analogous to `RoleGuard` but gates on granular
 * permission codes rather than on the user's role.
 *
 * ### Authentication handling
 *
 * Mirrors `RoleGuard`: if the user is not authenticated (no access token or
 * no user object) they are redirected to `/login` with `state.from` so the
 * login flow can send them back afterwards.
 *
 * ### Permission failure strategy — inline 403 (no redirect)
 *
 * When the user **is** authenticated but lacks the required permission the
 * guard renders a simple inline "no access" message rather than redirecting
 * to another route.
 *
 * **Why not redirect?**
 * Redirecting to e.g. `/admin/dashboard` is risky: if that route is also
 * wrapped in a `PermissionGuard` that the user does not satisfy, the
 * browser enters an infinite redirect loop.  The inline fallback is the
 * safest default and can be styled / replaced later without touching the
 * guard logic.
 *
 * ### Props
 *
 * | Prop         | Description                                           |
 * |--------------|-------------------------------------------------------|
 * | `permission` | Single code — user must hold it.                      |
 * | `anyOf`      | Array — user must hold **at least one** listed code.   |
 * | `fallback`   | Optional custom 403 node. Defaults to a minimal text. |
 *
 * When both `permission` and `anyOf` are provided, `permission` takes
 * precedence (same rule as `<Can>`).
 *
 * @module shared/auth/PermissionGuard
 */

import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@app/store";
import { usePermissions } from "@shared/auth/usePermissions";
import type { PermissionCode } from "@shared/auth/permissions";

/** Props for {@link PermissionGuard}. */
export interface PermissionGuardProps {
  /** Single permission code. Takes precedence over `anyOf`. */
  permission?: PermissionCode;
  /** Array of permission codes — user must hold **at least one**. */
  anyOf?: PermissionCode[];
  /**
   * Custom node rendered when the user is authenticated but lacks the
   * required permission.  Defaults to a minimal "no access" message.
   */
  fallback?: ReactNode;
}

/**
 * Default inline fallback rendered when the user lacks the required
 * permission.  Intentionally plain so it never conflicts with
 * application styling.
 */
const DEFAULT_FORBIDDEN: ReactNode = (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      textAlign: "center",
      padding: "2rem",
    }}
  >
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>403</h1>
      <p style={{ color: "#666" }}>
        You do not have permission to access this page.
      </p>
    </div>
  </div>
);

/**
 * Route guard that renders `<Outlet />` only when the authenticated user
 * holds the required permission(s).
 *
 * @example
 * ```tsx
 * // In router config (Step 5 — not wired yet)
 * {
 *   element: <PermissionGuard permission={PERMISSIONS.providers.view} />,
 *   children: [ ... ]
 * }
 * ```
 */
export function PermissionGuard({
  permission,
  anyOf,
  fallback = DEFAULT_FORBIDDEN,
}: PermissionGuardProps): ReactNode {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  const { can, canAny } = usePermissions();

  // ── Not authenticated → mirror RoleGuard redirect ───────────────────
  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // ── Permission check (precedence: permission > anyOf) ───────────────
  let allowed = false;

  if (permission !== undefined) {
    allowed = can(permission);
  } else if (anyOf !== undefined) {
    allowed = canAny(anyOf);
  }
  // If neither prop is provided → allowed stays false (fail-safe)

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <Outlet />;
}
