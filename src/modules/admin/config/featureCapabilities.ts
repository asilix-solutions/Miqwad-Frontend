/** Audited availability, never inferred from a failed request. See docs/ai/ADMIN_FEATURE_AVAILABILITY.md. */
import { mockModeEnabled } from "@shared/config/mockMode";
import type { PermissionCode } from "@shared/auth/permissions";

export type FeatureStatus = "LIVE" | "PARTIAL" | "MOCK_ONLY" | "STATIC" | "UNKNOWN";

export const adminFeatureCapabilities = {
  dashboard: "PARTIAL",
  dashboardMetrics: "MOCK_ONLY",
  dashboardActivity: "LIVE",
  quickActions: "STATIC",
  providers: "MOCK_ONLY",
  users: "PARTIAL",
  createUser: "MOCK_ONLY",
  addresses: "LIVE",
  orders: "LIVE",
  coupons: "LIVE",
  invoices: "LIVE",
  reference: "PARTIAL",
  referenceCategories: "PARTIAL",
  legacyCategoryTree: "MOCK_ONLY",
  referenceCities: "MOCK_ONLY",
  referenceBrands: "LIVE",
  referenceServices: "MOCK_ONLY",
  taxonomy: "LIVE",
  attachments: "LIVE",
  subscriptions: "PARTIAL",
  providerSubscriptionsPlaceholder: "STATIC",
  revenues: "MOCK_ONLY",
  notifications: "MOCK_ONLY",
  ads: "LIVE",
  complaints: "MOCK_ONLY",
  audit: "LIVE",
  settings: "MOCK_ONLY",
  profile: "LIVE",
} as const satisfies Record<string, FeatureStatus>;

export type AdminFeature = keyof typeof adminFeatureCapabilities;

export function isFeatureStatusAvailable(status: FeatureStatus, mocks: boolean): boolean {
  switch (status) {
    case "LIVE":
    case "PARTIAL":
    case "STATIC":
      return true;
    case "MOCK_ONLY":
      return mocks;
    case "UNKNOWN":
      return false; // Requires an audit decision before exposure.
  }
}

export function isAdminFeatureAvailable(feature: AdminFeature): boolean {
  return isFeatureStatusAvailable(adminFeatureCapabilities[feature], mockModeEnabled);
}

export type UnavailableRouteBehavior = "HIDDEN" | "COMING_SOON";

export interface AdminRouteDefinition {
  feature: AdminFeature;
  permission?: PermissionCode;
  /** Omitted means HIDDEN. This never authorizes the implementation to run. */
  unavailableBehavior?: UnavailableRouteBehavior;
}

/** Production presentation only; this never changes implementation availability. */
export function shouldShowAdminComingSoon(route: AdminRouteDefinition): boolean {
  return (
    import.meta.env.PROD &&
    route.unavailableBehavior === "COMING_SOON" &&
    adminFeatureCapabilities[route.feature] === "MOCK_ONLY" &&
    !isAdminFeatureAvailable(route.feature)
  );
}

export function isAdminRouteVisible(route: AdminRouteDefinition): boolean {
  return (
    import.meta.env.DEV ||
    isAdminFeatureAvailable(route.feature) ||
    shouldShowAdminComingSoon(route)
  );
}

// Permissions remain RBAC's concern; these match the existing route guards.
export const adminRoutes = {
  dashboard: { feature: "dashboard" },
  providers: {
    feature: "providers",
    permission: "providers.view",
    unavailableBehavior: "COMING_SOON",
  },
  users: { feature: "users", permission: "users.view" },
  addresses: { feature: "addresses", permission: "addresses.view" },
  orders: { feature: "orders", permission: "orders.view" },
  coupons: { feature: "coupons", permission: "coupons.view" },
  invoices: { feature: "invoices", permission: "invoices.view" },
  reference: { feature: "reference", permission: "categories.view" },
  taxonomy: { feature: "taxonomy", permission: "categories.view" },
  attachments: { feature: "attachments", permission: "attachments.view" },
  subscriptions: { feature: "subscriptions", permission: "subscriptions.view" },
  revenues: {
    feature: "revenues",
    permission: "subscriptions.view",
    unavailableBehavior: "COMING_SOON",
  },
  notifications: {
    feature: "notifications",
    permission: "notifications.view",
    unavailableBehavior: "COMING_SOON",
  },
  ads: { feature: "ads", permission: "ads.view" },
  complaints: {
    feature: "complaints",
    permission: "complaints.view",
    unavailableBehavior: "COMING_SOON",
  },
  audit: { feature: "audit", permission: "audit.view" },
  settings: {
    feature: "settings",
    permission: "settings.view",
    unavailableBehavior: "COMING_SOON",
  },
  profile: { feature: "profile" },
  categories: { feature: "referenceCategories", permission: "categories.view" },
  cities: { feature: "referenceCities", permission: "categories.view" },
} as const satisfies Record<string, AdminRouteDefinition>;

export type AdminRoute = keyof typeof adminRoutes;

export function getAdminRoute(pathname: string): AdminRouteDefinition | undefined {
  const segment = pathname.split(/[?#]/)[0].split("/")[2]?.toLowerCase() || "dashboard";
  return Object.hasOwn(adminRoutes, segment) ? adminRoutes[segment as AdminRoute] : undefined;
}
