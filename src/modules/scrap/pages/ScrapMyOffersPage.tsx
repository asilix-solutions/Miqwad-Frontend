/**
 * @file ScrapMyOffersPage.tsx
 *
 * Scrap provider "My Offers" — this scrap's own submitted quotations, queried
 * directly from the live GET /api/request-quotations. Supports edit (PUT) and
 * delete (DELETE) inline. Salvage-order context (part / vehicle) is resolved
 * client-side from the salvage-orders list when available.
 *
 * Architecture: src/modules/scrap/pages/
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tag, AlertCircle, RefreshCw } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderSkeleton,
  ProviderEmptyState,
  ProviderDialog,
} from "@shared/provider-ui";
import { useRequestQuotationsQuery } from "../hooks/useRequestQuotations";
import { useSalvageOrdersQuery } from "../hooks/useSalvageOrders";
import { QuotationCard } from "../components/QuotationCard";
import { QuotationForm } from "../components/QuotationForm";
import { DeleteQuotationDialog } from "../components/DeleteQuotationDialog";
import { ScrapPartRequestDetailDialog } from "../components/ScrapPartRequestDetailDialog";
import type { RequestQuotation, SalvageOrder } from "../types";

// ── Skeleton card ─────────────────────────────────────────────────────────────

function OfferSkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-provider-sm)]">
      <div className="flex flex-col gap-2">
        <ProviderSkeleton width="55%" height={18} />
        <ProviderSkeleton width="40%" height={14} />
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-divider)] pt-3">
        <ProviderSkeleton width="38%" height={12} />
        <ProviderSkeleton width={72} height={28} className="rounded-[var(--radius-sm)]" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

/** Scrap provider's own quotations, queried directly from GET /api/request-quotations. */
export function ScrapMyOffersPage() {
  const { t } = useTranslation();

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [editing, setEditing] = useState<RequestQuotation | null>(null);
  const [deleting, setDeleting] = useState<RequestQuotation | null>(null);

  const { data: quotationsPage, isLoading, isError, refetch } = useRequestQuotationsQuery({
    pageSize: 100,
  });
  const { data: ordersPage } = useSalvageOrdersQuery({ pageSize: 100 });

  const orderById = useMemo(() => {
    const map = new Map<string, SalvageOrder>();
    for (const order of ordersPage?.items ?? []) map.set(order.id, order);
    return map;
  }, [ordersPage]);

  const quotations = quotationsPage?.items ?? [];

  return (
    <div className="flex flex-col gap-6 provider-fade-up">
      <ProviderPageHeader
        icon={<Tag className="h-5 w-5" />}
        title={t("scrap.myOffers.title")}
        subtitle={t("scrap.myOffers.subtitle")}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <OfferSkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
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

      {/* Empty state */}
      {!isLoading && !isError && quotations.length === 0 && (
        <ProviderEmptyState
          icon={<Tag className="h-8 w-8" />}
          title={t("scrap.myOffers.emptyTitle")}
          description={t("scrap.myOffers.emptyDescription")}
        />
      )}

      {/* Data state */}
      {!isLoading && !isError && quotations.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quotations.map((quotation) => (
            <QuotationCard
              key={quotation.id}
              quotation={quotation}
              order={orderById.get(quotation.orderId)}
              onViewRequest={(id) => setSelectedRequestId(id)}
              onEdit={(q) => setEditing(q)}
              onDelete={(q) => setDeleting(q)}
            />
          ))}
        </div>
      )}

      {/* View request dialog — defer-mounted */}
      {selectedRequestId && (
        <ScrapPartRequestDetailDialog
          requestId={selectedRequestId}
          open={true}
          onClose={() => setSelectedRequestId(null)}
        />
      )}

      {/* Edit dialog — defer-mounted */}
      {editing && (
        <ProviderDialog
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
          title={t("scrap.offer.editTitle")}
          size="lg"
        >
          <QuotationForm
            orderId={editing.orderId}
            existing={editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        </ProviderDialog>
      )}

      {/* Delete confirm dialog — defer-mounted */}
      {deleting && (
        <DeleteQuotationDialog
          quotation={deleting}
          open={true}
          onOpenChange={(o) => {
            if (!o) setDeleting(null);
          }}
          onDeleted={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
