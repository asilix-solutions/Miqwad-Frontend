/**
 * @file AdminSidebar.tsx
 * @description Super Admin Dashboard sidebar component. Includes navigation links and brand mark.
 */

import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
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
  Wallet,
  Truck,
  Route,
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
  { key: "tow-truck", labelPath: "towTruck.title", path: "/admin/tow-truck", icon: Truck },
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
  {
    key: "transactions",
    labelPath: "transactions.title",
    path: "/admin/transactions",
    icon: Wallet,
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

export function AdminSidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const location = useLocation();
  const isTowTruckActive = location.pathname.startsWith("/admin/tow-truck");

  const visibleItems = NAV_ITEMS.filter((item) => {
    const route = getAdminRoute(item.path);
    return route && isAdminRouteVisible(route) && (!route.permission || can(route.permission));
  });

  return (
    <aside
      className={cn(
        mobile
          ? "flex h-full min-h-0 w-full flex-col"
          : "fixed inset-y-0 start-0 z-20 hidden w-[260px] flex-col lg:flex",
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
      <nav
        aria-label={t("towTruck.navigation")}
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6"
      >
        {visibleItems.map((item) => {
          const isTowTruck = item.key === "tow-truck";

          return (
            <div key={item.key} className="flex flex-col">
              <NavLink
                to={item.path}
                onClick={onNavigate}
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

              {isTowTruck && isTowTruckActive && (
                <div
                  className="ms-6 me-1 mt-1 space-y-0.5 border-s-2 border-[var(--color-divider)] ps-3 py-1"
                  role="group"
                  aria-label={t("towTruck.operationsNavLabel")}
                >
                  <NavLink
                    to="/admin/tow-truck"
                    end
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-brand-50 text-brand-orange font-semibold"
                          : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
                      )
                    }
                  >
                    <Truck size={14} className="shrink-0" aria-hidden="true" />
                    <span>{t("towTruck.navAllBadge")}</span>
                  </NavLink>
                  <NavLink
                    to="/admin/tow-truck/intracity"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-brand-50 text-brand-orange font-semibold"
                          : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
                      )
                    }
                  >
                    <MapPin size={14} className="shrink-0" aria-hidden="true" />
                    <span>{t("towTruck.navIntraCityBadge")}</span>
                  </NavLink>
                  <NavLink
                    to="/admin/tow-truck/intercity"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-brand-50 text-brand-orange font-semibold"
                          : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
                      )
                    }
                  >
                    <Route size={14} className="shrink-0" aria-hidden="true" />
                    <span>{t("towTruck.navInterCityBadge")}</span>
                  </NavLink>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
