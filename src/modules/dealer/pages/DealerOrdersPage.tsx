/**
 * @file DealerOrdersPage.tsx
 *
 * Dealer orders list — READ-ONLY (Phase B), backed by the LIVE `/api/Orders`.
 *
 * - No order-TYPE filter: a dealer is a single provider type and `/api/Orders`
 *   is already provider-scoped by the JWT, so every result is the same
 *   OrderType — a client-side type filter would be a misleading no-op.
 * - STATUS tabs are client-side over the fetched page.
 * - Results are provider-scoped by the JWT — no client-side dealer filter.
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderTabs,
  ProviderEmptyState,
} from "@shared/provider-ui";
import { useDealerOrdersQuery } from "../hooks/useDealerQueries";
import type { OrderStatus } from "../types";
import { OrderList } from "../components/OrderList";

const PAGE_SIZE = 20;

const STATUS_TAB_VALUES = ["all", "new", "preparing", "shipped", "delivered", "cancelled"] as const;

export function DealerOrdersPage() {
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);

  const q = useDealerOrdersQuery({ pageNumber, pageSize: PAGE_SIZE });

  const totalPages = q.data?.totalPages ?? 1;

  // Status stays client-side over the fetched page.
  const visibleOrders = useMemo(() => {
    const rows = q.data?.items ?? [];
    return statusFilter === "all"
      ? rows
      : rows.filter((o) => o.status === (statusFilter as OrderStatus));
  }, [q.data?.items, statusFilter]);

  const statusTabs = STATUS_TAB_VALUES.map((value) => ({
    value,
    label: value === "all" ? t("dealer.orders.filterAll") : t(`dealer.status.order.${value}`),
  }));

  const emptyState = (
    <ProviderEmptyState
      icon={<ShoppingCart className="h-8 w-8" aria-hidden />}
      title={t("dealer.orders.emptyTitle")}
      description={t("dealer.orders.emptyDescription")}
    />
  );

  return (
    <div className="space-y-6">
      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
          title={t("dealer.orders.title")}
          subtitle={t("dealer.orders.subtitle")}
        />
      </div>

      {/* Status filter */}
      <div className="provider-fade-up" style={{ animationDelay: "40ms" }}>
        <ProviderTabs tabs={statusTabs} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Order card list */}
      <div className="provider-fade-up" style={{ animationDelay: "80ms" }}>
        <OrderList
          orders={visibleOrders}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => { void q.refetch(); }}
          emptyState={emptyState}
        />
      </div>

      {/* Pagination */}
      {!q.isError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm text-[var(--color-muted)]">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            className="rounded-[var(--radius-sm)] px-3 py-1.5 font-medium text-[var(--color-ink-body)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-40"
          >
            {t("common.back")}
          </button>
          <span className="tabular-nums">
            {pageNumber} / {totalPages}
          </span>
          <button
            type="button"
            disabled={pageNumber >= totalPages}
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            className="rounded-[var(--radius-sm)] px-3 py-1.5 font-medium text-[var(--color-ink-body)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-40"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}
