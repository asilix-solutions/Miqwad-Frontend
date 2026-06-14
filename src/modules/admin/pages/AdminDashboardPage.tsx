import { useTranslation } from "react-i18next";
import { Users, Store, Clock, ShieldAlert, Wallet, AlertCircle } from "lucide-react";
import { useDashboardStatsQuery, useAuditLogsQuery, useAdminProvidersQuery, useDisputesQuery } from "../hooks/useAdminQueries";
import { StatCard } from "../components/dashboard/StatCard";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartTooltip } from "../components/dashboard/ChartTooltip";
import { StatusBadge } from "../components/shared/StatusBadge";
import { formatDate } from "@shared/lib/formatDate";
import { Link } from "react-router-dom";
/**
 * Super Admin Dashboard overview page.
 */
export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError, refetch } = useDashboardStatsQuery();


  const nf = new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US");

  const { data: auditData, isLoading: isAuditLoading } = useAuditLogsQuery({ page: 1, pageSize: 6 });
  const { data: providersData, isLoading: isProvidersLoading } = useAdminProvidersQuery("pending");
  const { data: disputesData, isLoading: isDisputesLoading } = useDisputesQuery({ page: 1, pageSize: 5, status: "open" });

  const revenueSeries = data?.revenueSeries ?? [];
  const usersSeries = data?.usersSeries ?? [];
  const providerStatusBreakdown = data?.providerStatusBreakdown ?? [];
  const disputeStatusBreakdown = data?.disputeStatusBreakdown ?? [];

  const formatMonth = (m: string) => {
    try {
      return new Date(m + "-01").toLocaleDateString(i18n.language === "ar" ? "ar-SA" : "en-US", { month: "short" });
    } catch {
      return m;
    }
  };

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          title={t("superAdmin.dashboard.openDisputes")}
          value={data?.openDisputes ?? 0}
          icon={ShieldAlert}
          tone="danger"
          isLoading={isLoading}
          trend={data?.trends?.openDisputes}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)] flex flex-col">
          <h2 className="font-[var(--font-main)] font-semibold text-[var(--color-ink-body)] text-base mb-4">
            {t("superAdmin.dashboard.charts.revenue")}
          </h2>
          <div dir="ltr" className="h-[340px] w-full min-w-0">
            {revenueSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F45E2B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F45E2B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECECF1" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={formatMonth} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted)" }} dy={10} />
                  <YAxis tickFormatter={(val) => nf.format(val)} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted)" }} dx={-10} />
                  <Tooltip content={<ChartTooltip formatter={(val) => formatCurrency(val as number, i18n.language)} />} />
                  <Area type="monotone" dataKey="value" stroke="#F45E2B" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--color-muted)] text-sm">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)] flex flex-col">
          <h2 className="font-[var(--font-main)] font-semibold text-[var(--color-ink-body)] text-base mb-4">
            {t("superAdmin.dashboard.charts.users")}
          </h2>
          <div dir="ltr" className="h-[340px] w-full min-w-0">
            {usersSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={usersSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECECF1" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={formatMonth} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted)" }} dy={10} />
                  <YAxis tickFormatter={(val) => nf.format(val)} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted)" }} dx={-10} />
                  <Tooltip content={<ChartTooltip formatter={(val) => nf.format(val as number)} />} />
                  <Line type="monotone" dataKey="value" stroke="#043168" strokeWidth={2} dot={{ r: 4, fill: "#043168" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--color-muted)] text-sm">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)] flex flex-col">
          <h2 className="font-[var(--font-main)] font-semibold text-[var(--color-ink-body)] text-base mb-4">
            {t("superAdmin.dashboard.charts.providerStatus")}
          </h2>
          <div dir="ltr" className="h-[260px] w-full min-w-0 flex items-center justify-center">
            {providerStatusBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="50%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={providerStatusBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="count">
                      {providerStatusBreakdown.map((entry, index) => {
                        const color = entry.status === "approved" ? "#1f9d55" : entry.status === "pending" ? "#e88c1c" : "#d92d20";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(val) => nf.format(val as number)} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex w-[50%] flex-col gap-3 px-4" dir={i18n.dir()}>
                  {providerStatusBreakdown.map((entry) => (
                    <div key={entry.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.status === "approved" ? "#1f9d55" : entry.status === "pending" ? "#e88c1c" : "#d92d20" }} />
                        <span className="text-sm text-[var(--color-ink-secondary)]">
                          {t(`superAdmin.dashboard.providerStatus.${entry.status}`)}
                        </span>
                      </div>
                      <span className="font-semibold text-sm">{nf.format(entry.count)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--color-muted)] text-sm">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)] flex flex-col">
          <h2 className="font-[var(--font-main)] font-semibold text-[var(--color-ink-body)] text-base mb-4">
            {t("superAdmin.dashboard.charts.disputeStatus")}
          </h2>
          <div dir="ltr" className="h-[260px] w-full min-w-0 flex items-center justify-center">
            {disputeStatusBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="50%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={disputeStatusBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="count">
                      {disputeStatusBreakdown.map((entry, index) => {
                        const color = entry.status === "open" ? "#e88c1c" : entry.status === "under_review" ? "#2e7cd6" : "#1f9d55";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(val) => nf.format(val as number)} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex w-[50%] flex-col gap-3 px-4" dir={i18n.dir()}>
                  {disputeStatusBreakdown.map((entry) => (
                    <div key={entry.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.status === "open" ? "#e88c1c" : entry.status === "under_review" ? "#2e7cd6" : "#1f9d55" }} />
                        <span className="text-sm text-[var(--color-ink-secondary)]">
                          {t(`superAdmin.dashboard.disputeStatusDist.${entry.status}`)}
                        </span>
                      </div>
                      <span className="font-semibold text-sm">{nf.format(entry.count)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--color-muted)] text-sm">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-main)] font-semibold text-[var(--color-ink-body)] text-base">
              {t("superAdmin.dashboard.widgets.recentActivity")}
            </h2>
            <Link to="/admin/audit" className="text-sm font-medium text-[var(--color-brand-blue)] hover:underline">
              {t("superAdmin.dashboard.widgets.viewAll")}
            </Link>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {isAuditLoading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-[var(--color-surface-2)] animate-pulse rounded" />)
            ) : auditData?.items?.length ? (
              auditData.items.slice(0, 6).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between gap-2 border-b border-[var(--color-divider)] pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <StatusBadge status={log.action} kind="audit" />
                    <span className="truncate text-sm text-[var(--color-ink-body)]">{log.summaryAr || log.action}</span>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-muted)]">{formatDate(log.createdAt, i18n.language)}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-1 items-center justify-center text-[var(--color-muted)] text-sm">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>

        {/* Pending Providers */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-main)] font-semibold text-[var(--color-ink-body)] text-base">
              {t("superAdmin.dashboard.widgets.pendingProviders")}
            </h2>
            <Link to="/admin/providers" className="text-sm font-medium text-[var(--color-brand-blue)] hover:underline">
              {t("superAdmin.dashboard.widgets.viewAll")}
            </Link>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {isProvidersLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-[var(--color-surface-2)] animate-pulse rounded" />)
            ) : providersData?.length ? (
              providersData.slice(0, 5).map((provider) => (
                <div key={provider.id} className="flex items-center justify-between gap-2 border-b border-[var(--color-divider)] pb-2 last:border-0 last:pb-0">
                  <span className="truncate font-medium text-sm text-[var(--color-ink-body)]">{provider.companyName}</span>
                  <span className="shrink-0 text-xs text-[var(--color-muted)]">{formatDate(provider.createdAt, i18n.language)}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-1 items-center justify-center text-[var(--color-muted)] text-sm">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>

        {/* Open Disputes */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-main)] font-semibold text-[var(--color-ink-body)] text-base">
              {t("superAdmin.dashboard.widgets.openDisputes")}
            </h2>
            <Link to="/admin/escrow" className="text-sm font-medium text-[var(--color-brand-blue)] hover:underline">
              {t("superAdmin.dashboard.widgets.viewAll")}
            </Link>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {isDisputesLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-[var(--color-surface-2)] animate-pulse rounded" />)
            ) : disputesData?.items?.length ? (
              disputesData.items.slice(0, 5).map((dispute: any) => (
                <div key={dispute.id} className="flex items-center justify-between gap-2 border-b border-[var(--color-divider)] pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium text-sm text-[var(--color-ink-body)]">#{dispute.orderId}</span>
                    <span className="text-xs font-semibold text-[var(--color-brand-orange)]">{formatCurrency(dispute.amount, i18n.language)}</span>
                  </div>
                  <StatusBadge status={dispute.status} kind="dispute" />
                </div>
              ))
            ) : (
              <div className="flex flex-1 items-center justify-center text-[var(--color-muted)] text-sm">
                {t("superAdmin.dashboard.widgets.empty")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
