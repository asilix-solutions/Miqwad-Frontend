/**
 * @file DealerSidebar.tsx
 *
 * Responsive sidebar / drawer for the dealer area.
 *
 * Desktop (≥ lg): fixed 260px panel — always visible, identical look to before.
 * Mobile / tablet (< lg): off-canvas drawer that slides in from inline-start.
 *   - RTL (Arabic): sidebar is at the right; hidden state = translateX(+100%).
 *   - LTR (English): sidebar is at the left;  hidden state = translateX(-100%).
 *   `lg:!translate-x-0` forces the visible state on desktop regardless of the
 *   direction-aware hidden class (which has higher CSS specificity due to the
 *   compound [dir] selector).
 *
 * Transition uses `.provider-sidebar-transition` (globals.css) which respects
 * prefers-reduced-motion.
 *
 * Nav content is identical to the previous version; only the responsive shell changed.
 */

import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@shared/lib/utils";

// ── Nav items ─────────────────────────────────────────────────────────────────

interface NavItem {
  key: string;
  labelPath: string;
  path: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", labelPath: "dealer.nav.dashboard", path: "/provider/dealer/dashboard", icon: LayoutDashboard },
  { key: "products",  labelPath: "dealer.nav.products",  path: "/provider/dealer/products",  icon: Package },
  // FUTURE: create actual routes for these in phase 3-5
  { key: "orders",    labelPath: "dealer.nav.orders",    path: "/provider/dealer/orders",    icon: ShoppingCart },
  { key: "shipments", labelPath: "dealer.nav.shipments", path: "/provider/dealer/shipments", icon: Truck },
  { key: "dues",      labelPath: "dealer.nav.dues",      path: "/provider/dealer/dues",      icon: Wallet },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  /** Whether the drawer is open (mobile only; ignored on desktop). */
  open: boolean;
  /** Called when the close button or backdrop is activated. */
  onClose: () => void;
}

export function DealerSidebar({ open, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <aside
      id="dealer-sidebar"
      className={cn(
        // ── Fixed shell ───────────────────────────────────────────────
        "fixed inset-y-0 start-0 z-40 flex w-[260px] flex-col",
        "bg-[var(--color-surface)] border-e border-[var(--color-divider)]",
        // ── Slide transition (provider tokens, reduced-motion safe) ───
        "provider-sidebar-transition",
        // ── Desktop: always visible — `!important` beats the compound
        //    direction-selector specificity of ltr:/rtl: classes ───────
        "lg:!translate-x-0",
        // ── Mobile: hide off-screen in the inline-start direction ─────
        !open && "ltr:-translate-x-full rtl:translate-x-full",
      )}
    >
      {/* ── Brand header ──────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-[var(--color-divider)]">
        <span
          className="text-xl font-bold"
          style={{
            fontFamily: "var(--font-main)",
            color: "var(--color-brand-blue)",
          }}
        >
          مقود
        </span>

        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className={cn(
            "lg:hidden flex h-8 w-8 items-center justify-center",
            "rounded-[var(--radius-sm)] text-[var(--color-muted)]",
            "transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
          )}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.key === "dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-colors text-sm font-medium",
                isActive && (item.key === "dashboard" || item.key === "orders" || item.key === "shipments" || item.key === "dues")
                  ? "bg-[var(--color-brand-orange)] text-white"
                  : "text-[var(--color-ink-body)] hover:bg-[var(--color-surface-2)]",
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
