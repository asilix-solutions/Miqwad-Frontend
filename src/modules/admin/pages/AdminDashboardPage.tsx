import { useTranslation } from "react-i18next";
import { Users, Store, Clock, ShieldAlert, Wallet, AlertCircle } from "lucide-react";
import { useDashboardStatsQuery } from "../hooks/useAdminQueries";
import { StatCard } from "../components/dashboard/StatCard";

/**
 * Super Admin Dashboard overview page.
 */
export function AdminDashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useDashboardStatsQuery();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--color-danger-500)] bg-[var(--color-danger-50)] rounded-lg">
        <AlertCircle className="mb-4 h-10 w-10" />
        <p className="text-lg font-semibold">{t("superAdmin.dashboard.error")}</p>
        <button
          onClick={() => void refetch()}
          className="mt-4 rounded border border-[var(--color-danger-200)] px-4 py-2 text-sm text-[var(--color-danger-700)] hover:bg-[var(--color-danger-100)]"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "0";
    return new Intl.NumberFormat("en-US").format(value) + " ر.س";
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("superAdmin.dashboard.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("superAdmin.dashboard.totalUsers")}
          value={data?.totalUsers ?? 0}
          icon={Users}
          tone="brand"
          isLoading={isLoading}
        />
        <StatCard
          title={t("superAdmin.dashboard.activeProviders")}
          value={data?.activeProviders ?? 0}
          icon={Store}
          tone="success"
          isLoading={isLoading}
        />
        <StatCard
          title={t("superAdmin.dashboard.pendingVerifications")}
          value={data?.pendingVerifications ?? 0}
          icon={Clock}
          tone="warning"
          isLoading={isLoading}
        />
        <StatCard
          title={t("superAdmin.dashboard.openDisputes")}
          value={data?.openDisputes ?? 0}
          icon={ShieldAlert}
          tone="danger"
          isLoading={isLoading}
        />
        <StatCard
          title={t("superAdmin.dashboard.monthlyRevenue")}
          value={isLoading ? 0 : formatCurrency(data?.monthlyRevenue)}
          icon={Wallet}
          tone="neutral"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
