/**
 * @file QuickActions.tsx
 * @description Quick actions row for the admin dashboard.
 */
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Store, Bell, Megaphone, Settings, ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePermissions } from "@shared/auth/usePermissions";
import { getAdminRoute, isAdminFeatureAvailable } from "../../config/featureCapabilities";
import type { PermissionCode } from "@shared/auth/permissions";

interface QuickAction {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  to: string;
  permission: PermissionCode;
  color: string;
}

const ACTIONS: QuickAction[] = [
  {
    key: "providers",
    labelKey: "superAdmin.dashboard.quickActions.providers",
    icon: Store,
    to: "/admin/providers",
    permission: "providers.view",
    color: "var(--color-brand-blue)",
  },
  {
    key: "notifications",
    labelKey: "superAdmin.dashboard.quickActions.notifications",
    icon: Bell,
    to: "/admin/notifications?tab=send",
    permission: "notifications.send",
    color: "var(--color-info-500)",
  },
  {
    key: "ads",
    labelKey: "superAdmin.dashboard.quickActions.ads",
    icon: Megaphone,
    to: "/admin/ads",
    permission: "ads.create",
    color: "var(--color-brand-orange)",
  },

  {
    key: "settings",
    labelKey: "superAdmin.dashboard.quickActions.settings",
    icon: Settings,
    to: "/admin/settings",
    permission: "settings.view",
    color: "var(--color-ink-secondary)",
  },
];

export function QuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { can } = usePermissions();
  const actions = ACTIONS.filter((action) => {
    const route = getAdminRoute(action.to);
    return (
      route &&
      isAdminFeatureAvailable(route.feature) &&
      can(action.permission) &&
      (!route.permission || can(route.permission))
    );
  });
  if (actions.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-[var(--font-main)] font-semibold text-[var(--color-ink-body)]">
        {t("superAdmin.dashboard.quickActions.title")}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={() => navigate(action.to)}
            className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4 text-start shadow-[var(--shadow-1)] transition-all duration-200 hover:shadow-[var(--shadow-2)]"
          >
            <span
              className="absolute inset-y-0 start-0 w-[3px] opacity-70 transition-opacity group-hover:opacity-100"
              style={{ backgroundColor: action.color }}
            />
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: `color-mix(in srgb, ${action.color} 12%, transparent)`,
                color: action.color,
              }}
            >
              <action.icon size={22} />
            </span>
            <span className="flex-1 text-sm font-semibold text-[var(--color-ink-body)]">
              {t(action.labelKey)}
            </span>
            <ArrowLeft
              size={18}
              className="ms-auto shrink-0 -translate-x-1 text-[var(--color-muted)] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 rtl:rotate-0"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
