/**
 * @file ScrapPartRequestsPage.tsx
 *
 * Scrap provider salvage-order browse page — customer "part requests" are
 * real Orders (OrderType = salvage), fetched via useSalvageOrdersQuery
 * (fixture-backed today; see salvageOrdersApi.ts for the fixture→live
 * switch). Filters operate client-side over the fetched list: brand, search
 * (part name / brand / model), and "not yet offered by me" (cross-referenced
 * against this scrap's own GET /api/Offers). Renders a friendly state when
 * the browse endpoint is not yet authorized (403).
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ClipboardList, RefreshCw, Info } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderSelect,
  ProviderSearchBar,
  ProviderSkeleton,
  ProviderEmptyState,
} from "@shared/provider-ui";
import type { ProviderSelectOption } from "@shared/provider-ui";
import { useSalvageOrdersQuery } from "../hooks/useSalvageOrders";
import { useOffersQuery } from "../hooks/useOffersQueries";
import { ScrapPartRequestCard } from "../components/ScrapPartRequestCard";
import { ScrapPartRequestDetailDialog } from "../components/ScrapPartRequestDetailDialog";

// ── Loading skeleton card ─────────────────────────────────────────────────────

function PartRequestSkeletonCard() {
  return (
    <div className="flex items-start gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-provider-sm)] sm:p-5">
      <ProviderSkeleton variant="block" width={64} height={64} className="shrink-0 rounded-[var(--radius-md)]" />
      <div className="flex flex-1 flex-col gap-2.5">
        <ProviderSkeleton width="60%" height={18} />
        <ProviderSkeleton width="40%" height={14} />
        <div className="mt-1 flex gap-2">
          <ProviderSkeleton width={68} height={22} className="rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

/** Scrap provider salvage-order browse page. */
export function ScrapPartRequestsPage() {
  const { t } = useTranslation();

  const [brandFilter, setBrandFilter] = useState("all");
  const [notOfferedOnly, setNotOfferedOnly] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: ordersResult, isLoading, isError, refetch } = useSalvageOrdersQuery({ pageSize: 100 });
  const { data: myOffers } = useOffersQuery({ pageSize: 100 });

  const offeredOrderIds = useMemo(
    () => new Set((myOffers?.items ?? []).map((o) => o.orderId)),
    [myOffers],
  );

  const allItems = useMemo(
    () => (ordersResult?.kind === "ok" ? ordersResult.data.items : []),
    [ordersResult],
  );
  const isForbidden = ordersResult?.kind === "forbidden";

  const brandOptions = useMemo<ProviderSelectOption[]>(() => {
    const brands = Array.from(new Set(allItems.map((o) => o.brand).filter(Boolean)));
    return [
      { value: "all", label: t("scrap.partRequests.brandFilterAll") },
      ...brands.map((b) => ({ value: b, label: b })),
    ];
  }, [allItems, t]);

  const filtered = useMemo(() => {
    const search = searchInput.trim().toLowerCase();
    return allItems.filter((order) => {
      if (brandFilter !== "all" && order.brand !== brandFilter) return false;
      if (notOfferedOnly && offeredOrderIds.has(order.id)) return false;
      if (search) {
        const haystack = `${order.partName} ${order.brand} ${order.model}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [allItems, brandFilter, notOfferedOnly, offeredOrderIds, searchInput]);

  const isFiltered = brandFilter !== "all" || notOfferedOnly || searchInput.length > 0;

  return (
    <div className="flex flex-col gap-6 provider-fade-up">
      <ProviderPageHeader
        icon={<ClipboardList className="h-5 w-5" />}
        title={t("scrap.partRequests.title")}
        subtitle={t("scrap.partRequests.subtitle")}
      />

      {/* Filter controls */}
      {!isForbidden && (
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <ProviderSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onClear={() => setSearchInput("")}
            placeholder={t("scrap.partRequests.searchPlaceholder")}
            className="sm:max-w-md"
          />
          <ProviderSelect
            value={brandFilter}
            onValueChange={setBrandFilter}
            options={brandOptions}
            label={t("scrap.partRequests.brandFilterLabel")}
            className="sm:w-48"
          />
          <label className="flex items-center gap-2 pb-2.5 text-sm text-[var(--color-ink-body)]">
            <input
              type="checkbox"
              checked={notOfferedOnly}
              onChange={(e) => setNotOfferedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-divider)] accent-[var(--color-brand-orange)]"
            />
            {t("scrap.partRequests.notOfferedFilterLabel")}
          </label>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <PartRequestSkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <ProviderEmptyState
          icon={<AlertCircle className="h-8 w-8" />}
          title={t("scrap.partRequests.errorTitle")}
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
              {t("scrap.partRequests.retry")}
            </button>
          }
        />
      )}

      {/* Friendly 403 state — browse endpoint not authorized yet */}
      {!isLoading && !isError && isForbidden && (
        <ProviderEmptyState
          icon={<Info className="h-8 w-8" />}
          title={t("scrap.partRequests.browsingUnavailableTitle")}
          description={t("scrap.partRequests.browsingUnavailableDescription")}
        />
      )}

      {/* Empty state */}
      {!isLoading && !isError && !isForbidden && filtered.length === 0 && (
        <ProviderEmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={isFiltered ? t("scrap.partRequests.noResultsTitle") : t("scrap.partRequests.emptyTitle")}
          description={
            isFiltered
              ? t("scrap.partRequests.noResultsDescription")
              : t("scrap.partRequests.emptyDescription")
          }
        />
      )}

      {/* Data state */}
      {!isLoading && !isError && !isForbidden && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => (
            <ScrapPartRequestCard
              key={order.id}
              request={order}
              onSelect={(id) => setSelectedId(id)}
              alreadyOffered={offeredOrderIds.has(order.id)}
            />
          ))}
        </div>
      )}

      {/* Detail dialog — defer-mounted */}
      {selectedId && (
        <ScrapPartRequestDetailDialog
          requestId={selectedId}
          open={true}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
