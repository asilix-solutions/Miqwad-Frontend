import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { PlansPanel } from "../components/subscriptions/PlansPanel";
import { SubscriptionsListPanel } from "../components/subscriptions/SubscriptionsListPanel";
import { cn } from "@shared/lib/utils";

type TabValue = "plans" | "providers";

export function AdminSubscriptionsHubPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced tab, default to "plans"
  const currentTab = (searchParams.get("tab") as TabValue) || "plans";

  const setTab = (tab: TabValue) => {
    setSearchParams({ tab });
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: "plans", label: t("superAdmin.subscriptions.tabs.plans") },
    { value: "providers", label: t("superAdmin.subscriptions.tabs.providers") },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-ink-title)]">
          {t("superAdmin.subscriptions.title")}
        </h1>
        <p className="text-sm text-[var(--color-ink-lighter)]">
          {t("superAdmin.subscriptions.subtitle")}
        </p>
      </div>

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
                : "text-[var(--color-ink-lighter)] hover:text-[var(--color-ink-body)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="mt-2">
        {currentTab === "plans" && <PlansPanel />}
        {currentTab === "providers" && <SubscriptionsListPanel />}
      </div>
    </div>
  );
}
