/**
 * @file ScrapPartRequestsPage.tsx
 *
 * Scrap provider part-requests inbox — filterable by status tab, searchable,
 * paginated. Four states: Loading (skeleton), Error (retry), Empty, Data.
 * Tab counts derive from a background all-items fetch (pageSize 100).
 */

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderTabs,
  ProviderSearchBar,
  ProviderSkeleton,
  ProviderEmptyState,
} from "@shared/provider-ui";
import type { ProviderTabItem } from "@shared/provider-ui";
import { usePartRequestsQuery } from "../hooks/useScrapQueries";
import { ScrapPartRequestCard } from "../components/ScrapPartRequestCard";
import { ScrapPartRequestDetailDialog } from "../components/ScrapPartRequestDetailDialog";
import type { PartRequestStatus } from "../types";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_VALUES: Array<PartRequestStatus | "all"> = [
  "all",
  "new",
  "quoted",
  "accepted",
  "shipped",
  "completed",
  "cancelled",
];

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
          <ProviderSkeleton width={68} height={22} className="rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

/** Scrap provider part-requests inbox page. */
export function ScrapPartRequestsPage() {
  const { t } = useTranslation();

  const [activeStatus, setActiveStatus] = useState<PartRequestStatus | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce search input 300 ms; also reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function handleStatusChange(value: string) {
    setActiveStatus(value as PartRequestStatus | "all");
    setPage(1);
  }

  // Background all-items fetch for per-status counts
  const { data: allItemsData } = usePartRequestsQuery({ pageSize: 100 });

  const statusCounts = useMemo<Record<string, number>>(() => {
    if (!allItemsData) return {};
    return allItemsData.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [allItemsData]);

  // Main paginated + filtered query
  const queryParams = {
    page,
    pageSize: PAGE_SIZE,
    status: activeStatus === "all" ? undefined : activeStatus,
    search: debouncedSearch || undefined,
  };
  const { data, isLoading, isError, refetch } = usePartRequestsQuery(queryParams);

  const tabs = useMemo<ProviderTabItem[]>(
    () =>
      STATUS_VALUES.map((s) => ({
        value: s,
        label: s === "all" ? t("scrap.partRequests.tabAll") : t(`scrap.status.${s}`),
        count: s === "all" ? undefined : statusCounts[s],
      })),
    [t, statusCounts],
  );

  const isFiltered = activeStatus !== "all" || debouncedSearch.length > 0;

  return (
    <div className="flex flex-col gap-6 provider-fade-up">
      {/* Page header */}
      <ProviderPageHeader
        icon={<ClipboardList className="h-5 w-5" />}
        title={t("scrap.partRequests.title")}
        subtitle={t("scrap.partRequests.subtitle")}
      />

      {/* Filter controls */}
      <div className="flex flex-col gap-4">
        <ProviderTabs
          tabs={tabs}
          value={activeStatus}
          onChange={handleStatusChange}
        />
        <ProviderSearchBar
          value={searchInput}
          onChange={setSearchInput}
          onClear={() => setSearchInput("")}
          placeholder={t("scrap.partRequests.searchPlaceholder")}
          className="sm:max-w-md"
        />
      </div>

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

      {/* Empty state */}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <ProviderEmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={
            isFiltered
              ? t("scrap.partRequests.noResultsTitle")
              : t("scrap.partRequests.emptyTitle")
          }
          description={
            isFiltered
              ? t("scrap.partRequests.noResultsDescription")
              : t("scrap.partRequests.emptyDescription")
          }
        />
      )}

      {/* Data state */}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {data.items.map((request) => (
              <ScrapPartRequestCard
                key={request.id}
                request={request}
                onSelect={(id) => setSelectedId(id)}
              />
            ))}
          </div>

          {/* Pagination — only rendered when there is more than one page */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
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
                  page,
                  totalPages: data.totalPages,
                })}
              </span>

              <button
                type="button"
                disabled={page >= data.totalPages}
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
