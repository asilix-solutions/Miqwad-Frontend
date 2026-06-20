/**
 * @file DealerDashboardPage.tsx
 *
 * Dealer store overview — provider design system re-skin.
 * - ProviderPageHeader with personalised greeting.
 * - Four ProviderStatCards: products count is real (from useDealerProductsQuery);
 *   orders, sales, dues show an honest "—" with a "قريباً" trend annotation.
 * - Quick-actions card linking to the products page.
 * - Staggered provider-fade-up entrance animation. RTL / bilingual throughout.
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
import {
  ProviderPageHeader,
  ProviderStatCard,
  ProviderCard,
} from "@shared/provider-ui";
import { useDealerProductsQuery } from "../hooks/useDealerQueries";
import { useMyProviderProfileQuery } from "@modules/providers/hooks/useProviderQueries";
import { useAppSelector } from "@app/store";

export function DealerDashboardPage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { data: profile } = useMyProviderProfileQuery();
  const productsQuery = useDealerProductsQuery();

  const companyName = profile?.companyName || user?.fullName || "";

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
        className="provider-fade-up grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        style={{ animationDelay: "40ms" }}
      >
        <ProviderStatCard
          label={t("dealer.dashboard.kpiProducts")}
          value={productsQuery.data?.total ?? 0}
          icon={<Package className="h-5 w-5" aria-hidden />}
          tone="brand"
          loading={productsQuery.isLoading}
        />
        <ProviderStatCard
          label={t("dealer.dashboard.kpiOpenOrders")}
          value="—"
          icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
          tone="info"
          trend={t("dealer.dashboard.comingSoon")}
        />
        <ProviderStatCard
          label={t("dealer.dashboard.kpiMonthlySales")}
          value="—"
          icon={<TrendingUp className="h-5 w-5" aria-hidden />}
          tone="success"
          trend={t("dealer.dashboard.comingSoon")}
        />
        <ProviderStatCard
          label={t("dealer.dashboard.kpiOutstandingDues")}
          value="—"
          icon={<Wallet className="h-5 w-5" aria-hidden />}
          tone="warning"
          trend={t("dealer.dashboard.comingSoon")}
        />
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div
        className="provider-fade-up space-y-3"
        style={{ animationDelay: "100ms" }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {t("dealer.dashboard.quickActionsTitle")}
        </h2>

        {/* Manage products link card */}
        <ProviderCard padded={false} interactive>
          <Link
            to="/provider/dealer/products"
            className={[
              "flex items-center gap-4 p-5",
              "rounded-[var(--radius-lg)]",         // match card radius for focus ring
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("dealer.dashboard.manageProducts")}
              </p>
              <p className="text-xs text-[var(--color-muted)] truncate">
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
