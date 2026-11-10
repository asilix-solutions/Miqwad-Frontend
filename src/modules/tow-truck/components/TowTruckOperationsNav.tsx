/** Single service navigation, hosted by the existing contextual AdminSidebar/Sheet. */
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutGrid, MapPin, Route } from "lucide-react";
import { type TowTruckWorkspace, buildWorkspaceNavigationUrl } from "../lib/towTruckWorkspace";

const WORKSPACE_ITEMS = [
  { workspace: "all", titleKey: "towTruck.qAllRequests", icon: LayoutGrid },
  { workspace: "intracity", titleKey: "towTruck.navIntraCityBadge", icon: MapPin },
  { workspace: "intercity", titleKey: "towTruck.navInterCityBadge", icon: Route },
] as const;

interface Props {
  activeWorkspace?: TowTruckWorkspace;
  trackSearch?: string;
  onNavigate?: () => void;
}

export function TowTruckOperationsNav({ activeWorkspace, trackSearch, onNavigate }: Props) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("towTruck.operationsNavLabel")} className="admin-service-navigation">
      {WORKSPACE_ITEMS.map(({ workspace, titleKey, icon: Icon }) => (
        <NavLink
          key={workspace}
          to={buildWorkspaceNavigationUrl(
            workspace,
            trackSearch ? `trackNumber=${encodeURIComponent(trackSearch)}` : undefined,
          )}
          end
          onClick={onNavigate}
          className="admin-service-link admin-context-link"
          aria-current={activeWorkspace === workspace ? "page" : undefined}
        >
          <Icon size={20} aria-hidden="true" />
          <span>{t(titleKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
