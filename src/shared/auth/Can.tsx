/**
 * @file Declarative permission gate component.
 *
 * `<Can>` conditionally renders its children based on the current user's
 * permissions (read via {@link usePermissions}).
 *
 * ### Props (all permission props are typed as `PermissionCode`)
 *
 * | Prop         | Description                                     |
 * |--------------|-------------------------------------------------|
 * | `permission` | Single permission code — user must hold it.     |
 * | `allOf`      | Array — user must hold **every** listed code.    |
 * | `anyOf`      | Array — user must hold **at least one** code.    |
 * | `fallback`   | React node rendered when the check fails (`null` by default). |
 *
 * ### Precedence
 *
 * When multiple permission props are provided simultaneously the first
 * match in this order is used and the rest are ignored:
 *
 * 1. `permission` (single check)
 * 2. `allOf`      (every check)
 * 3. `anyOf`      (some check)
 *
 * This keeps behaviour deterministic and avoids ambiguity.
 *
 * @example
 * ```tsx
 * <Can permission={PERMISSIONS.providers.approve}>
 *   <ApproveButton />
 * </Can>
 *
 * <Can anyOf={[PERMISSIONS.finance.view, PERMISSIONS.finance.export]}
 *      fallback={<NoAccess />}>
 *   <FinancePanel />
 * </Can>
 * ```
 *
 * @module shared/auth/Can
 */

import type { ReactNode } from "react";
import { usePermissions } from "@shared/auth/usePermissions";
import type { PermissionCode } from "@shared/auth/permissions";

/**
 * Props for {@link Can}.
 *
 * At least one of `permission`, `allOf`, or `anyOf` should be supplied.
 * If none is provided the component renders nothing (fail-safe).
 */
export interface CanProps {
  /** Single permission to check. Takes highest precedence. */
  permission?: PermissionCode;
  /** Array of permissions — **all** must be satisfied. Second precedence. */
  allOf?: PermissionCode[];
  /** Array of permissions — **any one** must be satisfied. Third precedence. */
  anyOf?: PermissionCode[];
  /**
   * Content rendered when the permission check passes.
   */
  children: ReactNode;
  /**
   * Content rendered when the permission check fails.
   * Defaults to `null` (render nothing).
   */
  fallback?: ReactNode;
}

/**
 * Renders `children` only when the current user satisfies the permission
 * requirement expressed via props.
 *
 * Fully **fail-safe**: if no permission prop is provided, or the user is
 * unauthenticated, the component renders `fallback` (or nothing).
 */
export function Can({
  permission,
  allOf,
  anyOf,
  children,
  fallback = null,
}: CanProps): ReactNode {
  const { can, canAll, canAny } = usePermissions();

  let allowed = false;

  // Precedence: permission > allOf > anyOf
  if (permission !== undefined) {
    allowed = can(permission);
  } else if (allOf !== undefined) {
    allowed = canAll(allOf);
  } else if (anyOf !== undefined) {
    allowed = canAny(anyOf);
  }
  // If none provided → allowed stays false (fail-safe)

  return allowed ? children : fallback;
}
