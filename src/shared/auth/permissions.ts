/**
 * @file Centralised permission codes and helpers for the Super Admin RBAC layer.
 *
 * Every permission follows the `<module>.<action>` naming convention.
 * The `PermissionCode` union type is derived from the constant object so
 * that typos in permission checks become compile-time errors instead of
 * silent runtime bugs.
 *
 * The `hasPermission` helper is designed to be **fail-safe**:
 *   - `null` / `undefined` user permissions → treated as "no permissions"
 *   - Wildcard `"*"` in the array → grants everything
 *   - Otherwise falls back to a simple `includes()` check
 *
 * @module shared/auth/permissions
 */

// =============================================================================
// Permission code constants — grouped by module
// =============================================================================

export const PERMISSIONS = {
  // ── Providers ──────────────────────────────────────────────────────────────
  providers: {
    view: "providers.view",
    approve: "providers.approve",
    reject: "providers.reject",
    suspend: "providers.suspend",
    restore: "providers.restore",
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: {
    view: "users.view",
    create: "users.create",
    edit: "users.edit",
    suspend: "users.suspend",
    restore: "users.restore",
    delete: "users.delete",
  },

  // ── Roles ──────────────────────────────────────────────────────────────────
  roles: {
    view: "roles.view",
    create: "roles.create",
    edit: "roles.edit",
    delete: "roles.delete",
    assign: "roles.assign",
  },

  // ── Categories ─────────────────────────────────────────────────────────────
  categories: {
    view: "categories.view",
    create: "categories.create",
    edit: "categories.edit",
    delete: "categories.delete",
  },

  // ── Cities ─────────────────────────────────────────────────────────────────
  cities: {
    view: "cities.view",
    create: "cities.create",
    edit: "cities.edit",
    delete: "cities.delete",
  },

  // ── Brands ─────────────────────────────────────────────────────────────────
  brands: {
    view: "brands.view",
    create: "brands.create",
    edit: "brands.edit",
    delete: "brands.delete",
  },

  // ── Models ─────────────────────────────────────────────────────────────────
  models: {
    view: "models.view",
    create: "models.create",
    edit: "models.edit",
    delete: "models.delete",
  },

  // ── Services ───────────────────────────────────────────────────────────────
  services: {
    view: "services.view",
    create: "services.create",
    edit: "services.edit",
    delete: "services.delete",
  },

  // ── Packages ───────────────────────────────────────────────────────────────
  packages: {
    view: "packages.view",
    create: "packages.create",
    edit: "packages.edit",
    delete: "packages.delete",
  },

  // ── Subscription Plans ─────────────────────────────────────────────────────
  plans: {
    view: "plans.view",
    create: "plans.create",
    edit: "plans.edit",
    delete: "plans.delete",
  },

  // ── Subscriptions ──────────────────────────────────────────────────────────
  subscriptions: {
    view: "subscriptions.view",
  },

  // ── Finance ────────────────────────────────────────────────────────────────
  finance: {
    view: "finance.view",
    settle: "finance.settle",
    export: "finance.export",
  },

  // ── Escrow ─────────────────────────────────────────────────────────────────
  escrow: {
    view: "escrow.view",
    resolve: "escrow.resolve",
    refund: "escrow.refund",
  },

  // ── Bookings ───────────────────────────────────────────────────────────────
  bookings: {
    view: "bookings.view",
    cancel: "bookings.cancel",
    export: "bookings.export",
  },

  // ── Reviews ────────────────────────────────────────────────────────────────
  reviews: {
    view: "reviews.view",
    delete: "reviews.delete",
    flag: "reviews.flag",
  },

  // ── Analytics ──────────────────────────────────────────────────────────────
  analytics: {
    view: "analytics.view",
    export: "analytics.export",
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    view: "notifications.view",
    send: "notifications.send",
    delete: "notifications.delete",
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: {
    view: "settings.view",
    edit: "settings.edit",
  },

  // ── Audit ──────────────────────────────────────────────────────────────────
  audit: {
    view: "audit.view",
    export: "audit.export",
  },
} as const;

// =============================================================================
// Derived union type — compile-time safety for permission checks
// =============================================================================

/**
 * Union of every permission string literal defined in `PERMISSIONS`.
 *
 * Using this type in hooks / guards / components ensures that a misspelled
 * permission code is caught by `tsc` instead of silently passing at runtime.
 *
 * Example:
 * ```ts
 * const canView: boolean = hasPermission(user.permissions, PERMISSIONS.providers.view);
 * ```
 */
type ObjectValues<T> = T[keyof T];
export type PermissionCode = ObjectValues<{
  [K in keyof typeof PERMISSIONS]: ObjectValues<typeof PERMISSIONS[K]>
}>;

// =============================================================================
// Wildcard sentinel
// =============================================================================

/**
 * When present in a user's `permissions` array, grants access to **every**
 * permission without listing them individually.  Typically assigned only
 * to the `super_admin` role.
 */
export const WILDCARD = "*" as const;

// =============================================================================
// Runtime helper
// =============================================================================

/**
 * Check whether `userPermissions` satisfies the `required` permission.
 *
 * **Fail-safe by design:**
 * - Returns `false` if `userPermissions` is `null`, `undefined`, or empty.
 * - Returns `true`  if `userPermissions` contains the {@link WILDCARD} (`"*"`).
 * - Otherwise performs a straightforward `includes()` check.
 *
 * @param userPermissions - The logged-in user's permission array (may be absent).
 * @param required        - The permission code to check for.
 * @returns `true` if access should be granted, `false` otherwise.
 */
export function hasPermission(
  userPermissions: string[] | undefined | null,
  required: PermissionCode,
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  if (userPermissions.includes(WILDCARD)) {
    return true;
  }
  return userPermissions.includes(required);
}
