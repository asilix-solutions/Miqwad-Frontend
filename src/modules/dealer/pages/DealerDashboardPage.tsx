/**
 * @file DealerDashboardPage.tsx
 *
 * Dealer overview with independently loaded metrics. Live provider-service
 * counts take priority; the existing dues mock is DEV-only and labelled.
 * Unsupported sales/order semantics remain explicitly unavailable.
 */

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { ProviderPageHeader, ProviderStatCard, ProviderCard } from "@shared/provider-ui";
import { useDealerDashboardData } from "../hooks/useDealerDashboardQuery";
import { useAppSelector } from "@app/store";
import { Button } from "@shared/components/ui/button";

export function DealerDashboardPage() {
  const { t, i18n } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { summary, products, dues, serviceCount } = useDealerDashboardData();
  const companyName = summary.data?.user.fullName || user?.fullName || "";
  const productCount = serviceCount ?? products.data;
  const productsLoading = productCount == null && (summary.isLoading || products.isLoading);
  const productUnavailable = productCount == null && !productsLoading;
  const demoDebt = dues.data?.outstandingDebt;
  const hasDemoDebt = typeof demoDebt === "number" && Number.isFinite(demoDebt);

  const fmtDebt = (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<LayoutDashboard className="h-5 w-5" aria-hidden />}
          title={t("dealer.dashboard.greeting", { name: companyName })}
          subtitle={t("dealer.dashboard.title")}
        />
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      {/*
        The grid wrapper fades in at 40ms. ProviderStatCard applies its own
        provider-fade-up internally; the wrapper's opacity masks that until it
        starts, so the stagger appears natural.
      */}
      <div
        className="provider-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        style={{ animationDelay: "40ms" }}
      >
        <ProviderStatCard
          label={t("dealer.dashboard.kpiProducts")}
          value={
            productCount == null ? "—" : new Intl.NumberFormat(i18n.language).format(productCount)
          }
          icon={<Package className="h-5 w-5" aria-hidden />}
          tone="brand"
          loading={productsLoading}
          trend={productUnavailable ? t("dealer.dashboard.metricUnavailable") : undefined}
        />
        <ProviderStatCard
          label={t("dealer.dashboard.kpiOpenOrders")}
          value="—"
          icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
          tone="info"
          trend={t("dealer.dashboard.metricUnsupported")}
        />
        <ProviderStatCard
          label={t("dealer.dashboard.kpiMonthlySales")}
          value="—"
          icon={<TrendingUp className="h-5 w-5" aria-hidden />}
          tone="success"
          trend={t("dealer.dashboard.metricUnsupported")}
        />
        <ProviderStatCard
          label={t("dealer.dashboard.kpiOutstandingDues")}
          value={hasDemoDebt ? fmtDebt(demoDebt) : "—"}
          icon={<Wallet className="h-5 w-5" aria-hidden />}
          tone={hasDemoDebt && dues.data?.debtAlert ? "danger" : "warning"}
          loading={dues.isLoading}
          trend={t(
            hasDemoDebt ? "dealer.dashboard.demoData" : "dealer.dashboard.metricUnsupported",
          )}
        />
      </div>

      {productUnavailable && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]"
        >
          <span>{t("dealer.dashboard.metricUnavailable")}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={summary.isFetching || products.isFetching}
            onClick={() => {
              void summary.refetch();
              void products.refetch();
            }}
          >
            {t("common.retry")}
          </Button>
        </div>
      )}

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div className="provider-fade-up space-y-3" style={{ animationDelay: "100ms" }}>
        <h2 className="text-xs font-semibold tracking-widest text-[var(--color-muted)] uppercase">
          {t("dealer.dashboard.quickActionsTitle")}
        </h2>

        {/* Manage products link card */}
        <ProviderCard padded={false} interactive>
          <Link
            to="/provider/dealer/products"
            className={[
              "flex items-center gap-4 p-5",
              "rounded-[var(--radius-lg)]", // match card radius for focus ring
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-inset",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            {/* Icon container */}
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-50)] text-[var(--color-brand-orange)]"
              aria-hidden
            >
              <Package className="h-5 w-5" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("dealer.dashboard.manageProducts")}
              </p>
              <p className="truncate text-xs text-[var(--color-muted)]">
                {t("dealer.dashboard.manageProductsHint")}
              </p>
            </div>

            {/* Direction-aware forward arrow */}
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[var(--color-muted)] rtl:rotate-180"
              aria-hidden
            />
          </Link>
        </ProviderCard>
      </div>
    </div>
  );
}
