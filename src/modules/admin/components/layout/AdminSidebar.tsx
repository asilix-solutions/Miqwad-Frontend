/**
 * @file AdminSidebar.tsx
 * @description Super Admin Dashboard sidebar component. Includes navigation links and brand mark.
 */

import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  ScrollText,
  Settings,
  FolderTree,
  Layers,
  Paperclip,
  CreditCard,
  Bell,
  Megaphone,
  MessageSquareWarning,
  TrendingUp,
  MapPin,
  ShoppingCart,
  ReceiptText,
  TicketPercent,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@shared/lib/utils";

import {
  getAdminRoute,
  isAdminRouteVisible,
  type AdminRoute,
} from "../../config/featureCapabilities";
import { usePermissions } from "@shared/auth/usePermissions";

interface NavItem {
  key: AdminRoute;
  labelPath: string;
  path: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    labelPath: "adminNav.dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "providers",
    labelPath: "adminNav.providers",
    path: "/admin/providers",
    icon: ClipboardCheck,
  },
  { key: "users", labelPath: "adminNav.users", path: "/admin/users", icon: Users },
  { key: "addresses", labelPath: "adminNav.addresses", path: "/admin/addresses", icon: MapPin },
  { key: "orders", labelPath: "adminNav.orders", path: "/admin/orders", icon: ShoppingCart },
  { key: "coupons", labelPath: "coupons.title", path: "/admin/coupons", icon: TicketPercent },
  { key: "invoices", labelPath: "adminNav.invoices", path: "/admin/invoices", icon: ReceiptText },
  { key: "reference", labelPath: "adminNav.reference", path: "/admin/reference", icon: FolderTree },
  { key: "taxonomy", labelPath: "adminNav.taxonomy", path: "/admin/taxonomy", icon: Layers },
  {
    key: "attachments",
    labelPath: "adminNav.attachments",
    path: "/admin/attachments",
    icon: Paperclip,
  },

  {
    key: "subscriptions",
    labelPath: "adminNav.subscriptions",
    path: "/admin/subscriptions",
    icon: CreditCard,
  },
  { key: "revenues", labelPath: "adminNav.revenues", path: "/admin/revenues", icon: TrendingUp },

  {
    key: "notifications",
    labelPath: "adminNav.notifications",
    path: "/admin/notifications",
    icon: Bell,
  },
  { key: "ads", labelPath: "adminNav.ads", path: "/admin/ads", icon: Megaphone },
  {
    key: "complaints",
    labelPath: "adminNav.complaints",
    path: "/admin/complaints",
    icon: MessageSquareWarning,
  },
  { key: "audit", labelPath: "adminNav.audit", path: "/admin/audit", icon: ScrollText },
  { key: "settings", labelPath: "adminNav.settings", path: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const visibleItems = NAV_ITEMS.filter((item) => {
    const route = getAdminRoute(item.path);
    return route && isAdminRouteVisible(route) && (!route.permission || can(route.permission));
  });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-20 flex w-[260px] flex-col",
        "border-e border-[var(--color-divider)] bg-[var(--color-surface)]",
      )}
    >
      {/* Brand Area */}
      <div className="flex h-16 items-center border-b border-[var(--color-divider)] px-6">
        <span
          className="text-xl font-bold"
          style={{
            fontFamily: "var(--font-main)",
            color: "var(--color-brand-blue)",
          }}
        >
          مقود
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
        {visibleItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-brand-orange)] text-white"
                  : "text-[var(--color-ink-body)] hover:bg-[var(--color-surface-2)]",
              )
            }
          >
            <item.icon size={20} className="shrink-0" />
            <span>{t(item.labelPath)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
