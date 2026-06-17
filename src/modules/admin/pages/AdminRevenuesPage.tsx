import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, CreditCard, TrendingUp } from "lucide-react";

import { useRevenuesQuery } from "@modules/admin/hooks/useAdminQueries";
import { StatCard } from "@modules/admin/components/dashboard/StatCard";
import { DataTable, type DataTableColumn } from "@modules/admin/components/shared/DataTable";
import { formatCurrency } from "@shared/lib/formatCurrency";

type RevenueTab = "commissions" | "subscriptions";

export function AdminRevenuesPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<RevenueTab>("commissions");
  
  const { data, isLoading, isError } = useRevenuesQuery();
  
  // Compute totals safely
  const totalMonthly = data?.totalMonthly ?? 0;
  const commissionTotal = data?.commissionTotal ?? 0;
  const subscriptionTotal = data?.subscriptionTotal ?? 0;

  // Tabs structure
  const TABS: { key: RevenueTab; labelI18n: string }[] = [
    { key: "commissions", labelI18n: "superAdmin.revenues.tabs.commissions" },
    { key: "subscriptions", labelI18n: "superAdmin.revenues.tabs.subscriptions" },
  ];

  // Columns for Commissions
  const commissionColumns: DataTableColumn<any>[] = useMemo(() => [
    {
      key: "providerName",
      header: t("superAdmin.revenues.columns.provider"),
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-ink-body)]">{row.providerName}</span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] text-[10px] font-medium whitespace-nowrap border border-[var(--color-divider)]">
            {t(`superAdmin.providers.types.${row.providerType || "dealer"}`)}
          </span>
        </div>
      )
    },
    {
      key: "detail",
      header: t("superAdmin.revenues.columns.detail"),
      render: (row) => <span className="text-[var(--color-ink-body)]">{row.detail}</span>
    },
    {
      key: "amount",
      header: t("superAdmin.revenues.columns.amount"),
      render: (row) => (
        <span className="text-[var(--color-ink-body)] font-medium tabular-nums">
          {formatCurrency(row.amount, i18n.language)}
        </span>
      )
    }
  ], [t, i18n.language]);

  // Columns for Subscriptions
  const subscriptionColumns: DataTableColumn<any>[] = useMemo(() => [
    {
      key: "providerName",
      header: t("superAdmin.revenues.columns.provider"),
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-ink-body)]">{row.providerName}</span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] text-[10px] font-medium whitespace-nowrap border border-[var(--color-divider)]">
            {t(`superAdmin.providers.types.${row.providerType || "workshop"}`)}
          </span>
        </div>
      )
    },
    {
      key: "detail",
      header: t("superAdmin.revenues.columns.detail"),
      render: (row) => <span className="text-[var(--color-ink-body)]">{row.detail}</span>
    },
    {
      key: "amount",
      header: t("superAdmin.revenues.columns.amount"),
      render: (row) => (
        <span className="text-[var(--color-ink-body)] font-medium tabular-nums">
          {formatCurrency(row.amount, i18n.language)}
        </span>
      )
    }
  ], [t, i18n.language]);

  const records = data?.records ?? [];
  const filteredRows = records.filter((r: any) => 
    activeTab === "commissions" ? r.source === "commission" : r.source === "subscription"
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.revenues.title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("superAdmin.revenues.subtitle")}
        </p>
      </header>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title={t("superAdmin.revenues.summary.total")}
          value={isLoading ? 0 : formatCurrency(totalMonthly, i18n.language)}
          icon={Wallet}
          tone="brand"
          isLoading={isLoading}
        />
        <StatCard
          title={t("superAdmin.revenues.summary.commissions")}
          value={isLoading ? 0 : formatCurrency(commissionTotal, i18n.language)}
          icon={TrendingUp}
          tone="success"
          isLoading={isLoading}
        />
        <StatCard
          title={t("superAdmin.revenues.summary.subscriptions")}
          value={isLoading ? 0 : formatCurrency(subscriptionTotal, i18n.language)}
          icon={CreditCard}
          tone="neutral"
          isLoading={isLoading}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 bg-transparent overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "flex items-center justify-center gap-1.5",
                  "text-[14px] py-2 px-4 rounded-full border border-transparent",
                  "cursor-pointer transition-colors duration-150 whitespace-nowrap",
                  isActive
                    ? "bg-[var(--color-brand-orange)] text-white font-semibold"
                    : "bg-transparent text-[var(--color-muted)] font-medium hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
                ].join(" ")}
              >
                {t(tab.labelI18n)}
              </button>
            );
          })}
        </div>

        <DataTable<any>
          columns={activeTab === "commissions" ? commissionColumns : subscriptionColumns}
          rows={filteredRows}
          isLoading={isLoading}
          isError={isError}
          emptyText={t("superAdmin.revenues.empty")}
          errorText={t("superAdmin.revenues.error")}
          getRowKey={(row) => row.id?.toString() || Math.random().toString()}
        />
      </div>
    </div>
  );
}
