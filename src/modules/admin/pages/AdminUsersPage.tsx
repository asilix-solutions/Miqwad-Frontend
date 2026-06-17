import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { cn } from "@shared/lib/utils";

import { ClientsPanel } from "../components/users/ClientsPanel";
import { ProvidersPanel } from "../components/users/ProvidersPanel";

type TabValue = "clients" | "providers";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = (searchParams.get("tab") as TabValue) || "clients";

  const setTab = (tab: TabValue) => {
    setSearchParams({ tab });
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: "clients", label: t("superAdmin.users.tabs.clients") },
    { value: "providers", label: t("superAdmin.users.tabs.providers") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink-body)]">
          {t("superAdmin.users.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("superAdmin.users.subtitle")}
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
                : "text-[var(--color-muted)] hover:text-[var(--color-ink-body)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="mt-2">
        {currentTab === "clients" && <ClientsPanel />}
        {currentTab === "providers" && <ProvidersPanel />}
      </div>
    </div>
  );
}
