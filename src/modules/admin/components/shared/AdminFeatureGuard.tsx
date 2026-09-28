import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@app/store";
import { usePermissions } from "@shared/auth/usePermissions";
import {
  getAdminRoute,
  isAdminFeatureAvailable,
  isAdminRouteVisible,
} from "../../config/featureCapabilities";
import { AdminFeatureUnavailablePage } from "./AdminFeatureUnavailablePage";

/** Presentation is separate from implementation availability and authorization. */
export function AdminFeatureGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const { can } = usePermissions();
  const route = getAdminRoute(pathname);
  if (!route) return <Navigate to="/admin/dashboard" replace />;
  if (isAdminFeatureAvailable(route.feature)) return children;

  if (isAdminRouteVisible(route)) {
    // This guard sits ABOVE RoleGuard/PermissionGuard. Only authorized Admins
    // may see the fallback. Otherwise delegate to those existing guards so
    // login, wrong-role redirects and the permission-denied screen stay intact.
    if (
      !accessToken ||
      !user ||
      (user.role !== "admin" && user.role !== "super_admin") ||
      (route.permission && !can(route.permission))
    ) {
      return children;
    }
    // Do not mount children: the original page and its queries stay inactive.
    return <AdminFeatureUnavailablePage />;
  }

  return <Navigate to="/admin/dashboard" replace />;
}
