/**
 * @file WorkshopSidebar.tsx
 *
 * Responsive sidebar / drawer for the workshop provider area.
 * Desktop (≥ lg): fixed 260px panel always visible.
 * Mobile / tablet (< lg): off-canvas drawer sliding from inline-start.
 * Transition uses .provider-sidebar-transition (globals.css, reduced-motion safe).
 */

import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  UserCircle,
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
  { key: "dashboard",    labelPath: "workshop.nav.dashboard",    path: "/provider/workshop/dashboard",    icon: LayoutDashboard },
  { key: "conversations", labelPath: "workshop.nav.conversations", path: "/provider/workshop/conversations", icon: MessageSquare },
  { key: "subscription", labelPath: "workshop.nav.subscription", path: "/provider/workshop/subscription", icon: CreditCard },
  { key: "profile",      labelPath: "workshop.nav.profile",      path: "/provider/workshop/profile",      icon: UserCircle },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WorkshopSidebar({ open, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <aside
      id="workshop-sidebar"
      className={cn(
        "fixed inset-y-0 start-0 z-40 flex w-[260px] flex-col",
        "bg-[var(--color-surface)] border-e border-[var(--color-divider)]",
        "provider-sidebar-transition",
        "lg:!translate-x-0",
        !open && "ltr:-translate-x-full rtl:translate-x-full",
      )}
    >
      {/* ── Brand header ──────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-[var(--color-divider)]">
        <span
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-main)", color: "var(--color-brand-blue)" }}
        >
          مقود
        </span>
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
                isActive
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
