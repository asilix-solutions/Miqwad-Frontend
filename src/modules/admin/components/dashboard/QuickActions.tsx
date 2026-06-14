/**
 * @file QuickActions.tsx
 * @description Quick actions row for the admin dashboard.
 */
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Store, Bell, Megaphone, Wallet, Settings, ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Can } from "@shared/auth/Can";
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
    to: "/admin/ads/campaigns/new",
    permission: "ads.create",
    color: "var(--color-brand-orange)",
  },
  {
    key: "finance",
    labelKey: "superAdmin.dashboard.quickActions.finance",
    icon: Wallet,
    to: "/admin/finance",
    permission: "finance.view",
    color: "var(--color-success-500)",
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {ACTIONS.map((action) => (
        <Can key={action.key} permission={action.permission}>
          <button
            onClick={() => navigate(action.to)}
            className="group relative flex items-center gap-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4 text-start cursor-pointer shadow-[var(--shadow-1)] transition-all duration-200 hover:shadow-[var(--shadow-2)]"
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
              className="text-[var(--color-muted)] shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 rtl:rotate-0 ms-auto"
            />
          </button>
        </Can>
      ))}
    </div>
  );
}
