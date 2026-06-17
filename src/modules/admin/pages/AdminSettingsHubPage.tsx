/**
 * @file Admin Settings Hub Page
 */

import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import { PageLoader } from "@shared/components/feedback/PageLoader";
import { useSettingsQuery } from "../hooks/useAdminQueries";
import { cn } from "@shared/lib/utils";

import { GeneralSettingsPanel } from "../components/settings/GeneralSettingsPanel";
import { ContactSettingsPanel } from "../components/settings/ContactSettingsPanel";
import { FeatureFlagsPanel } from "../components/settings/FeatureFlagsPanel";

type TabValue = "general" | "contact" | "flags";

export function AdminSettingsHubPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = (searchParams.get("tab") as TabValue) || "general";

  const setTab = (tab: TabValue) => {
    setSearchParams({ tab });
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: "general", label: t("superAdmin.settings.tabs.general") },
    { value: "contact", label: t("superAdmin.settings.tabs.contact") },
    { value: "flags", label: t("superAdmin.settings.tabs.flags") },
  ];

  const { data: settings, isLoading, isError } = useSettingsQuery();

  if (isLoading) return <PageLoader />;

  if (isError || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 h-[50vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-[var(--color-warning-500)] opacity-80" />
          <h3 className="text-lg font-medium text-[var(--color-ink-body)]">
            {t("common.errorTitle")}
          </h3>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-[var(--color-brand-blue)] hover:underline"
          >
            {t("common.errorRetry")}
          </button>
        </div>
      </div>
    );
  }

  const isMaintenanceActive = settings.featureFlags.find(
    (f) => f.key === "maintenance_mode"
  )?.enabled;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.settings.title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t("superAdmin.settings.subtitle")}
        </p>
      </div>

      {isMaintenanceActive && (
        <div className="bg-[var(--color-warning-50)] border border-[var(--color-warning-500)]/30 text-[var(--color-warning-500)] rounded-[var(--radius-md)] px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{t("superAdmin.settings.maintenanceActive")}</span>
        </div>
      )}

      {/* URL-synced Pill Tabs */}
      <div className="flex bg-[var(--color-surface-2)] p-1 rounded-full w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTab(tab.value)}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-full transition-colors",
              currentTab === tab.value
                ? "bg-white text-[var(--color-brand-blue)] shadow-sm"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink-body)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="mt-2">
        {currentTab === "general" && <GeneralSettingsPanel settings={settings} />}
        {currentTab === "contact" && <ContactSettingsPanel settings={settings} />}
        {currentTab === "flags" && <FeatureFlagsPanel settings={settings} />}
      </div>
    </div>
  );
}
