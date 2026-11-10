/** Primary workspace navigation in the existing header; route guards remain authoritative. */
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Truck } from "lucide-react";
import { usePermissions } from "@shared/auth/usePermissions";
import { useAppSelector } from "@app/store";
import { getAdminRoute, isAdminRouteVisible } from "../../config/featureCapabilities";
import { isTowTruckPath } from "../../config/workspaceNavigation";

const WORKSPACES = [
  { path: "/admin/dashboard", key: "general", icon: Building2 },
  { path: "/admin/tow-truck", key: "tow", icon: Truck },
] as const;

export function WorkspaceSwitcher() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { can } = usePermissions();
  const role = useAppSelector((state) => state.auth.user?.role);
  const active = isTowTruckPath(pathname) ? "tow" : "general";
  if (role !== "admin" && role !== "super_admin") return null;
  return (
    <nav className="admin-workspace-switcher" aria-label={t("admin.workspaces.label")}>
      {WORKSPACES.map(({ path, key, icon: Icon }) => {
        const route = getAdminRoute(path);
        if (!route || !isAdminRouteVisible(route) || (route.permission && !can(route.permission)))
          return null;
        return (
          <Link
            key={key}
            to={path}
            className="admin-workspace-link"
            aria-current={active === key ? "location" : undefined}
            aria-label={t(`admin.workspaces.${key}`)}
            title={t(`admin.workspaces.${key}`)}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="admin-workspace-full">{t(`admin.workspaces.${key}`)}</span>
            <span className="admin-workspace-compact" aria-hidden="true">
              {t(`admin.workspaces.${key}Compact`)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
