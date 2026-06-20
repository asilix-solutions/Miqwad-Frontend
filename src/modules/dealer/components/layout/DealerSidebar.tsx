import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@shared/lib/utils";

interface NavItem {
  key: string;
  labelPath: string;
  path: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", labelPath: "dealer.nav.dashboard", path: "/provider/dealer/dashboard", icon: LayoutDashboard },
  // FUTURE: create actual routes for these in phase 3-5
  { key: "products",  labelPath: "dealer.nav.products",  path: "/provider/dealer/dashboard", icon: Package },
  { key: "orders",    labelPath: "dealer.nav.orders",    path: "/provider/dealer/dashboard", icon: ShoppingCart },
  { key: "shipments", labelPath: "dealer.nav.shipments", path: "/provider/dealer/dashboard", icon: Truck },
  { key: "dues",      labelPath: "dealer.nav.dues",      path: "/provider/dealer/dashboard", icon: Wallet },
];

export function DealerSidebar() {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-20 flex w-[260px] flex-col",
        "bg-[var(--color-surface)] border-e border-[var(--color-divider)]"
      )}
    >
      {/* Brand Area */}
      <div className="flex h-16 items-center px-6 border-b border-[var(--color-divider)]">
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
      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.key === "dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-colors text-sm font-medium",
                isActive && item.key === "dashboard"
                  ? "bg-[var(--color-brand-orange)] text-white"
                  : "text-[var(--color-ink-body)] hover:bg-[var(--color-surface-2)]",
                item.key !== "dashboard" && "opacity-50 pointer-events-none" // FUTURE: remove when pages exist
              )
            }
          >
            <item.icon size={20} className="shrink-0" />
            <span>{t(item.labelPath, { defaultValue: item.key })}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
