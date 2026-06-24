/**
 * @file ScrapMyOffersPage.tsx
 *
 * Scrap provider "My Offers" — offer performance hub.
 * Distinct from the part-requests inbox: this page is analytic and
 * performance-focused, with PRICE as the hero metric.
 *
 * Layout:
 *   1. ProviderPageHeader
 *   2. 3 KPI cards (total, accept rate, accepted value) derived from full set
 *   3. Status tabs with per-status counts
 *   4. Offer list (price-hero cards) with pagination
 *
 * Four states: Loading / Error / Empty / Data.
 * "View Request" opens the shared ScrapPartRequestDetailDialog inline (defer-mount).
 *
 * Architecture: src/modules/scrap/pages/
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tag, TrendingUp, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderStatCard,
  ProviderTabs,
  ProviderSkeleton,
  ProviderEmptyState,
} from "@shared/provider-ui";
import type { ProviderTabItem } from "@shared/provider-ui";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { useMyOffersQuery } from "../hooks/useScrapQueries";
import { ScrapOfferCard } from "../components/ScrapOfferCard";
import { ScrapPartRequestDetailDialog } from "../components/ScrapPartRequestDetailDialog";
import type { OfferStatus } from "../types";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_TABS: Array<OfferStatus | "all"> = [
  "all",
  "pending",
  "accepted",
  "completed",
  "rejected",
];

// ── Skeleton card ─────────────────────────────────────────────────────────────

function OfferSkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-provider-sm)]">
      <div className="flex items-start justify-between gap-3">
        <ProviderSkeleton width="35%" height={28} />
        <ProviderSkeleton width={70} height={22} className="rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <ProviderSkeleton width="55%" height={16} />
        <ProviderSkeleton width="40%" height={13} />
        <ProviderSkeleton width="25%" height={12} />
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-divider)] pt-3">
        <ProviderSkeleton width="38%" height={12} />
        <ProviderSkeleton width={72} height={28} className="rounded-[var(--radius-sm)]" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

/** Scrap provider offer performance hub. */
export function ScrapMyOffersPage() {
  const { t, i18n } = useTranslation();

  const [activeStatus, setActiveStatus] = useState<OfferStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  function handleStatusChange(value: string) {
    setActiveStatus(value as OfferStatus | "all");
    setPage(1);
  }

  // Single fetch — all offers (max 100); KPIs + tab counts derived client-side.
  const { data: allOffers, isLoading, isError, refetch } = useMyOffersQuery();

  // ── KPI derivations ───────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    if (!allOffers) return { total: 0, acceptRate: 0, acceptedValue: 0 };
    const total = allOffers.length;
    const converted = allOffers.filter(
      (o) => o.status === "accepted" || o.status === "completed",
    );
    const acceptRate = total === 0 ? 0 : Math.round((converted.length / total) * 100);
    const acceptedValue = converted.reduce((sum, o) => sum + o.offerPrice, 0);
    return { total, acceptRate, acceptedValue };
  }, [allOffers]);

  // ── Tab counts ────────────────────────────────────────────────────────────

  const statusCounts = useMemo<Record<string, number>>(() => {
    if (!allOffers) return {};
    return allOffers.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [allOffers]);

  const tabs = useMemo<ProviderTabItem[]>(
    () =>
      STATUS_TABS.map((s) => ({
        value: s,
        label:
          s === "all"
            ? t("scrap.myOffers.tabAll")
            : t(`scrap.myOffers.status.${s}`),
        count: s === "all" ? undefined : statusCounts[s],
      })),
    [t, statusCounts],
  );

  // ── Filtered + paginated slice (client-side from full set) ────────────────

  const filtered = useMemo(() => {
    if (!allOffers) return [];
    return activeStatus === "all"
      ? allOffers
      : allOffers.filter((o) => o.status === activeStatus);
  }, [allOffers, activeStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const isFiltered = activeStatus !== "all";

  return (
    <div className="flex flex-col gap-6 provider-fade-up">
      {/* ── 1. Page header ──────────────────────────────────────────── */}
      <ProviderPageHeader
        icon={<Tag className="h-5 w-5" />}
        title={t("scrap.myOffers.title")}
        subtitle={t("scrap.myOffers.subtitle")}
      />

      {/* ── 2. KPI row ──────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 provider-fade-up"
        style={{ animationDelay: "50ms" }}
      >
        {/* Total offers */}
        <ProviderStatCard
          label={t("scrap.myOffers.kpiTotal")}
          value={isLoading ? "" : String(kpis.total)}
          icon={<Tag className="h-5 w-5" aria-hidden />}
          tone="info"
          loading={isLoading}
        />

        {/* Acceptance rate — signature conversion metric */}
        <ProviderStatCard
          label={t("scrap.myOffers.kpiAcceptRate")}
          value={isLoading ? "" : `${kpis.acceptRate}%`}
          icon={<TrendingUp className="h-5 w-5" aria-hidden />}
          tone="success"
          loading={isLoading}
        />

        {/* Accepted value */}
        <ProviderStatCard
          label={t("scrap.myOffers.kpiAcceptedValue")}
          value={isLoading ? "" : formatCurrency(kpis.acceptedValue, i18n.language)}
          icon={<Wallet className="h-5 w-5" aria-hidden />}
          tone="warning"
          loading={isLoading}
        />
      </div>

      {/* ── 3. Status tabs ──────────────────────────────────────────── */}
      <ProviderTabs
        tabs={tabs}
        value={activeStatus}
        onChange={handleStatusChange}
      />

      {/* ── 4a. Loading state ────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <OfferSkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── 4b. Error state ─────────────────────────────────────────── */}
      {!isLoading && isError && (
        <ProviderEmptyState
          icon={<AlertCircle className="h-8 w-8" />}
          title={t("scrap.myOffers.errorTitle")}
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className={[
                "inline-flex items-center gap-2 rounded-[var(--radius-md)]",
                "bg-[var(--color-brand-orange)] px-5 py-2.5 text-sm font-semibold text-white",
                "transition-colors duration-[var(--dur-fast)]",
                "hover:bg-[var(--color-brand-orange-hover)]",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-[var(--color-brand-orange)]/40",
              ].join(" ")}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {t("scrap.myOffers.retry")}
            </button>
          }
        />
      )}

      {/* ── 4c. Empty state ─────────────────────────────────────────── */}
      {!isLoading && !isError && allOffers && pageItems.length === 0 && (
        <ProviderEmptyState
          icon={<Tag className="h-8 w-8" />}
          title={
            isFiltered
              ? t("scrap.myOffers.noResultsTitle")
              : t("scrap.myOffers.emptyTitle")
          }
          description={
            isFiltered
              ? t("scrap.myOffers.noResultsDescription")
              : t("scrap.myOffers.emptyDescription")
          }
        />
      )}

      {/* ── 4d. Data state ──────────────────────────────────────────── */}
      {!isLoading && !isError && allOffers && pageItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pageItems.map((offer) => (
              <ScrapOfferCard
                key={offer.partRequestId}
                offer={offer}
                onViewRequest={(id) => setSelectedRequestId(id)}
              />
            ))}
          </div>

          {/* Pagination — only when more than one page */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className={[
                  "inline-flex items-center rounded-[var(--radius-md)]",
                  "border border-[var(--color-divider)] bg-[var(--color-surface)]",
                  "px-4 py-2 text-sm font-medium text-[var(--color-ink-body)]",
                  "transition-colors duration-[var(--dur-fast)]",
                  "hover:bg-[var(--color-surface-2)]",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-[var(--color-brand-orange)]/40",
                ].join(" ")}
              >
                {t("scrap.partRequests.prev")}
              </button>

              <span className="text-sm text-[var(--color-muted)]">
                {t("scrap.partRequests.pageOf", {
                  page: safePage,
                  totalPages,
                })}
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={[
                  "inline-flex items-center rounded-[var(--radius-md)]",
                  "border border-[var(--color-divider)] bg-[var(--color-surface)]",
                  "px-4 py-2 text-sm font-medium text-[var(--color-ink-body)]",
                  "transition-colors duration-[var(--dur-fast)]",
                  "hover:bg-[var(--color-surface-2)]",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-[var(--color-brand-orange)]/40",
                ].join(" ")}
              >
                {t("scrap.partRequests.next")}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── 5. Detail dialog — defer-mounted ────────────────────────── */}
      {selectedRequestId && (
        <ScrapPartRequestDetailDialog
          requestId={selectedRequestId}
          open={true}
          onClose={() => setSelectedRequestId(null)}
        />
      )}
    </div>
  );
}
