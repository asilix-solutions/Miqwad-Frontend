import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { TemplatesPanel } from "../components/notifications/TemplatesPanel";
import { SentHistoryPanel } from "../components/notifications/SentHistoryPanel";
import { cn } from "@shared/lib/utils";
import { SendNotificationPanel } from "../components/notifications/SendNotificationPanel";

type TabValue = "templates" | "history" | "send";

export function AdminNotificationsHubPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced tab, default to "templates"
  const currentTab = (searchParams.get("tab") as TabValue) || "templates";

  const setTab = (tab: TabValue) => {
    setSearchParams({ tab });
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: "templates", label: t("superAdmin.notifications.tabs.templates") },
    { value: "history", label: t("superAdmin.notifications.tabs.history") },
    { value: "send", label: t("superAdmin.notifications.tabs.send") },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-ink-title)]">
          {t("superAdmin.notifications.title")}
        </h1>
        <p className="text-sm text-[var(--color-ink-lighter)]">
          {t("superAdmin.notifications.subtitle")}
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
        {currentTab === "templates" && <TemplatesPanel />}
        {currentTab === "history" && <SentHistoryPanel />}
        {currentTab === "send" && <SendNotificationPanel />}
      </div>
    </div>
  );
}
