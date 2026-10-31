/**
 * @file TowTruckOperationsNav.tsx
 * @description Compact Operations Workspace Switcher for Tow Truck Center (Phase 2A.1).
 * Provides lightweight, route-driven workspace switching across All, IntraCity, and InterCity.
 * Optimized for mobile accessibility and minimal vertical footprint without bulky decorative cards.
 */

import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Truck, MapPin, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@shared/lib/utils";
import {
  type TowTruckWorkspace,
  buildWorkspaceNavigationUrl,
} from "../lib/towTruckWorkspace";

interface WorkspaceNavItem {
  workspace: TowTruckWorkspace;
  titleKey: string;
  badgeKey: string;
  descKey: string;
  icon: LucideIcon;
  end?: boolean;
}

const WORKSPACE_ITEMS: WorkspaceNavItem[] = [
  {
    workspace: "all",
    titleKey: "towTruck.navAllBadge",
    badgeKey: "towTruck.navAllBadge",
    descKey: "towTruck.navAllDesc",
    icon: Truck,
    end: true,
  },
  {
    workspace: "intracity",
    titleKey: "towTruck.navIntraCityBadge",
    badgeKey: "towTruck.navIntraCityBadge",
    descKey: "towTruck.navIntraCityDesc",
    icon: MapPin,
  },
  {
    workspace: "intercity",
    titleKey: "towTruck.navInterCityBadge",
    badgeKey: "towTruck.navInterCityBadge",
    descKey: "towTruck.navInterCityDesc",
    icon: Route,
  },
];

interface Props {
  activeWorkspace: TowTruckWorkspace;
  trackSearch?: string;
  className?: string;
}

export function TowTruckOperationsNav({
  activeWorkspace,
  trackSearch,
  className = "",
}: Props) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("towTruck.operationsNavLabel")}
      className={cn("w-full select-none", className)}
    >
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-ink-100/70 border border-ink-200/80 shadow-2xs">
        {WORKSPACE_ITEMS.map((item) => {
          const isActive = activeWorkspace === item.workspace;
          const destination = buildWorkspaceNavigationUrl(
            item.workspace,
            trackSearch ? `trackNumber=${encodeURIComponent(trackSearch)}` : undefined,
          );
          const Icon = item.icon;

          return (
            <NavLink
              key={item.workspace}
              to={destination}
              end={item.end}
              title={t(item.descKey)}
              className={({ isActive: linkActive }) => {
                const active = isActive || linkActive;
                return cn(
                  "group relative flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 min-h-[40px] text-center",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1",
                  active
                    ? "bg-white text-[var(--color-brand-blue)] font-bold shadow-xs border border-ink-200/60"
                    : "text-ink-600 hover:text-ink-950 hover:bg-white/60 font-medium",
                );
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={15}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive
                    ? "text-[var(--color-brand-orange)]"
                    : "text-ink-500 group-hover:text-ink-800",
                )}
                aria-hidden="true"
              />
              <span className="truncate">{t(item.titleKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
