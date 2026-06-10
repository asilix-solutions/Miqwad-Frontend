/**
 * @file React hook for consuming the permission layer.
 *
 * `usePermissions()` reads the authenticated user from the Redux auth slice
 * and exposes a lightweight, **fail-safe** API for permission checks:
 *
 * - `permissions` — the raw permission array (or `[]`).
 * - `can(code)`   — single-permission check (wildcard-aware).
 * - `canAny(codes)` — true if the user holds **at least one** of the listed permissions.
 * - `canAll(codes)` — true if the user holds **every** listed permission.
 * - `isSuperAdmin` — true when the user's role is `"super_admin"` or their
 *    permissions array contains the wildcard sentinel (`"*"`).
 *
 * All methods are safe to call when the user is `null`, `undefined`, or when
 * the `permissions` field is absent — they simply return `false` / `[]`.
 *
 * @module shared/auth/usePermissions
 */

import { useMemo } from "react";
import { useAppSelector } from "@app/store";
import { hasPermission, WILDCARD } from "@shared/auth/permissions";
import type { PermissionCode } from "@shared/auth/permissions";

/** Shape returned by {@link usePermissions}. */
export interface UsePermissionsResult {
  /** The user's raw permission codes, or an empty array when absent. */
  permissions: string[];

  /**
   * Check whether the current user holds a single permission.
   * Returns `false` when the user is unauthenticated or lacks the permission.
   * Wildcard-aware: a user with `"*"` passes every check.
   */
  can: (permission: PermissionCode) => boolean;

  /**
   * Returns `true` if the user holds **at least one** of the given permissions.
   * An empty array argument always yields `false`.
   */
  canAny: (permissions: PermissionCode[]) => boolean;

  /**
   * Returns `true` only if the user holds **every** listed permission.
   * An empty array argument always yields `true` (vacuous truth).
   */
  canAll: (permissions: PermissionCode[]) => boolean;

  /**
   * Convenience flag: `true` when the user's role is `"super_admin"` **or**
   * their permission array contains the wildcard sentinel `"*"`.
   */
  isSuperAdmin: boolean;
}

/**
 * Hook that provides type-safe, fail-safe permission checks for the
 * current authenticated user.
 *
 * @example
 * ```tsx
 * const { can, isSuperAdmin } = usePermissions();
 *
 * if (can(PERMISSIONS.providers.approve)) {
 *   // render approve button
 * }
 * ```
 */
export function usePermissions(): UsePermissionsResult {
  const user = useAppSelector((s) => s.auth.user);

  // Stabilise the permissions reference so downstream memos / effects
  // don't re-run unless the actual array instance changes.
  const permissions: string[] = user?.permissions ?? [];

  return useMemo<UsePermissionsResult>(() => {
    const can = (permission: PermissionCode): boolean =>
      hasPermission(permissions, permission);

    const canAny = (perms: PermissionCode[]): boolean =>
      perms.some((p) => hasPermission(permissions, p));

    const canAll = (perms: PermissionCode[]): boolean =>
      perms.every((p) => hasPermission(permissions, p));

    const isSuperAdmin: boolean =
      user?.role === "super_admin" || permissions.includes(WILDCARD);

    return { permissions, can, canAny, canAll, isSuperAdmin };
  }, [permissions, user?.role]);
}
