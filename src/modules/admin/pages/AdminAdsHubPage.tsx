/**
 * @file AdminAdsHubPage.tsx
 * @description Admin hub for managing Ads campaigns and placements.
 */

import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { CampaignsPanel } from "../components/ads/CampaignsPanel";
import { PlacementsPanel } from "../components/ads/PlacementsPanel";
import { cn } from "@shared/lib/utils";

type TabValue = "campaigns" | "placements";

export function AdminAdsHubPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = (searchParams.get("tab") as TabValue) || "campaigns";

  const setTab = (tab: TabValue) => {
    setSearchParams({ tab });
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: "campaigns", label: t("superAdmin.ads.tabs.campaigns") },
    { value: "placements", label: t("superAdmin.ads.tabs.placements") },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.ads.title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t("superAdmin.ads.subtitle")}
        </p>
      </div>

      <div className="flex bg-[var(--color-surface-2)] p-1 rounded-full w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTab(tab.value)}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-full transition-colors",
              currentTab === tab.value
                ? "bg-white text-[var(--color-brand-blue)] shadow-sm"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink-body)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {currentTab === "campaigns" && <CampaignsPanel />}
        {currentTab === "placements" && <PlacementsPanel />}
      </div>
    </div>
  );
}
