import { useTranslation } from "react-i18next";
import { Users, Store, Clock, Wallet, AlertCircle } from "lucide-react";
import {
  useDashboardStatsQuery,
  useAuditLogsQuery,
  useAdminProvidersQuery,
} from "../hooks/useAdminQueries";
import { StatCard } from "../components/dashboard/StatCard";
import { formatCurrency } from "@shared/lib/formatCurrency";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { ChartTooltip } from "../components/dashboard/ChartTooltip";
import { StatusBadge } from "../components/shared/StatusBadge";
import { formatDate } from "@shared/lib/formatDate";
import { Link } from "react-router-dom";
import { QuickActions } from "../components/dashboard/QuickActions";
import { Can } from "@shared/auth/Can";
import { isAdminFeatureAvailable } from "../config/featureCapabilities";
/** Live widgets stay mounted independently of optional development previews. */
export function AdminDashboardPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.dashboard.title")}
        </h1>
        {isAdminFeatureAvailable("dashboardMetrics") && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t("superAdmin.dashboard.subtitle")}
          </p>
        )}
      </header>

      {isAdminFeatureAvailable("dashboardMetrics") && <MockDashboardOverview />}
      <div
        className={
          isAdminFeatureAvailable("providers")
            ? "grid grid-cols-1 gap-6 lg:grid-cols-2"
            : "grid grid-cols-1 gap-6"
        }
      >
        {isAdminFeatureAvailable("dashboardActivity") && (
          <Can permission="audit.view">
            <RecentActivity />
          </Can>
        )}
        {isAdminFeatureAvailable("providers") && (
          <Can permission="providers.view">
            <PendingProviders />
          </Can>
        )}
      </div>
      <QuickActions />
    </div>
  );
}

function MockDashboardOverview() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError, refetch } = useDashboardStatsQuery();
  const nf = new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US");
  const usersSeries = data?.usersSeries ?? [];
  const revenueSeries = data?.revenueSeries ?? [];
  const providerStatusBreakdown = data?.providerStatusBreakdown ?? [];

  const formatMonth = (m: string) => {
    try {
      return new Date(m + "-01").toLocaleDateString(i18n.language === "ar" ? "ar-SA" : "en-US", {
        month: "short",
      });
    } catch {
      return m;
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-[var(--color-danger-50)] p-12 text-center text-[var(--color-danger-500)]">
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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("superAdmin.dashboard.totalUsers")}
          value={data?.totalUsers ?? 0}
          icon={Users}
          tone="brand"
          isLoading={isLoading}
          trend={data?.trends?.totalUsers}
        />
        <StatCard
          title={t("superAdmin.dashboard.activeProviders")}
          value={data?.activeProviders ?? 0}
          icon={Store}
          tone="success"
          isLoading={isLoading}
          trend={data?.trends?.activeProviders}
        />
        <StatCard
          title={t("superAdmin.dashboard.pendingVerifications")}
          value={data?.pendingVerifications ?? 0}
          icon={Clock}
          tone="warning"
          isLoading={isLoading}
          trend={data?.trends?.pendingVerifications}
          invertTrendColor
        />

        <StatCard
          title={t("superAdmin.dashboard.monthlyRevenue")}
          value={isLoading ? 0 : formatCurrency(data?.monthlyRevenue, i18n.language)}
          icon={Wallet}
          tone="neutral"
          isLoading={isLoading}
          trend={data?.trends?.monthlyRevenue}
        />
      </div>
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)]">
          <h2 className="mb-4 text-base font-[var(--font-main)] font-semibold text-[var(--color-ink-body)]">
            {t("superAdmin.dashboard.charts.revenue")}
          </h2>
          <div dir="ltr" className="h-[340px] w-full min-w-0">
            {revenueSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="revenueOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand-orange)" stopOpacity={0.25} />
                      <stop
                        offset="100%"
                        stopColor="var(--color-brand-orange)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECECF1" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(val) => nf.format(val)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                    dx={-10}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(val) => formatCurrency(val as number, i18n.language)}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-brand-orange)"
                    fillOpacity={1}
                    fill="url(#revenueOrangeGradient)"
                    strokeWidth={2}
                    activeDot={{ r: 6, fill: "var(--color-brand-orange)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)]">
          <h2 className="mb-4 text-base font-[var(--font-main)] font-semibold text-[var(--color-ink-body)]">
            {t("superAdmin.dashboard.charts.users")}
          </h2>
          <div dir="ltr" className="h-[340px] w-full min-w-0">
            {usersSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={usersSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECECF1" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(val) => nf.format(val)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                    dx={-10}
                  />
                  <Tooltip
                    content={<ChartTooltip formatter={(val) => nf.format(val as number)} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#043168"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#043168" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)]">
          <h2 className="mb-4 text-base font-[var(--font-main)] font-semibold text-[var(--color-ink-body)]">
            {t("superAdmin.dashboard.charts.providerStatus")}
          </h2>
          <div dir="ltr" className="flex h-[260px] w-full min-w-0 items-center justify-center">
            {providerStatusBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="50%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={providerStatusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {providerStatusBreakdown.map((entry, index) => {
                        const color =
                          entry.status === "approved"
                            ? "#1f9d55"
                            : entry.status === "pending"
                              ? "#e88c1c"
                              : "#d92d20";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip formatter={(val) => nf.format(val as number)} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex w-[50%] flex-col gap-3 px-4" dir={i18n.dir()}>
                  {providerStatusBreakdown.map((entry) => (
                    <div key={entry.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              entry.status === "approved"
                                ? "#1f9d55"
                                : entry.status === "pending"
                                  ? "#e88c1c"
                                  : "#d92d20",
                          }}
                        />
                        <span className="text-sm text-[var(--color-ink-secondary)]">
                          {t(`superAdmin.dashboard.providerStatus.${entry.status}`)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">{nf.format(entry.count)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentActivity() {
  const { t, i18n } = useTranslation();
  const {
    data: auditData,
    isLoading: isAuditLoading,
    isError: isAuditError,
    refetch,
  } = useAuditLogsQuery({ page: 1, pageSize: 6 });
  return (
    <>
      {/* Recent Activity */}
      <div className="flex flex-col rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-[var(--font-main)] font-semibold text-[var(--color-ink-body)]">
            {t("superAdmin.dashboard.widgets.recentActivity")}
          </h2>
          <Link
            to="/admin/audit"
            className="text-sm font-medium text-[var(--color-brand-blue)] hover:underline"
          >
            {t("superAdmin.dashboard.widgets.viewAll")}
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-3">
          {isAuditLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-[var(--color-surface-2)]" />
            ))
          ) : isAuditError ? (
            <WidgetError onRetry={() => void refetch()} />
          ) : auditData?.items?.length ? (
            auditData.items.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-2 border-b border-[var(--color-divider)] pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <StatusBadge status={log.action} kind="audit" />
                  <span className="truncate text-sm text-[var(--color-ink-body)]">
                    {(i18n.language.startsWith("ar") ? log.summaryAr : log.summaryEn) || log.action}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-[var(--color-muted)]">
                  {formatDate(log.createdAt, i18n.language)}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">
              {t("superAdmin.dashboard.widgets.empty")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PendingProviders() {
  const { t, i18n } = useTranslation();
  const {
    data: providersData,
    isLoading: isProvidersLoading,
    isError,
    refetch,
  } = useAdminProvidersQuery("pending");
  return (
    <>
      {/* Pending Providers */}
      <div className="flex flex-col rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-[var(--font-main)] font-semibold text-[var(--color-ink-body)]">
            {t("superAdmin.dashboard.widgets.pendingProviders")}
          </h2>
          <Link
            to="/admin/providers"
            className="text-sm font-medium text-[var(--color-brand-blue)] hover:underline"
          >
            {t("superAdmin.dashboard.widgets.viewAll")}
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-3">
          {isProvidersLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-[var(--color-surface-2)]" />
            ))
          ) : isError ? (
            <WidgetError onRetry={() => void refetch()} />
          ) : providersData?.length ? (
            providersData.slice(0, 5).map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between gap-2 border-b border-[var(--color-divider)] pb-2 last:border-0 last:pb-0"
              >
                <span className="truncate text-sm font-medium text-[var(--color-ink-body)]">
                  {provider.companyName}
                </span>
                <span className="shrink-0 text-xs text-[var(--color-muted)]">
                  {formatDate(provider.createdAt, i18n.language)}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">
              {t("superAdmin.dashboard.widgets.empty")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function WidgetError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="text-sm text-[var(--color-danger-500)]">
      <p>{t("common.errorTitle")}</p>
      <button type="button" onClick={onRetry} className="mt-2 underline">
        {t("common.errorRetry")}
      </button>
    </div>
  );
}
