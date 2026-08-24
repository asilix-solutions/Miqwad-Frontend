/**
 * @file ScrapMyOffersPage.tsx
 *
 * Scrap provider "My Offers" — lists this scrap's own submitted offers,
 * queried directly from the real GET /api/Offers (not derived from part
 * requests, unlike the old mock-backed page). Supports edit (PUT) and
 * delete (DELETE) inline. Salvage-order context (part/vehicle) is resolved
 * client-side from the salvage-orders list when available.
 *
 * Architecture: src/modules/scrap/pages/
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tag, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderSkeleton,
  ProviderEmptyState,
  ProviderDialog,
} from "@shared/provider-ui";
import { useToast } from "@shared/components/ui/toastContext";
import { useOffersQuery, useDeleteOfferMutation } from "../hooks/useOffersQueries";
import { useSalvageOrdersQuery } from "../hooks/useSalvageOrders";
import { ScrapOfferCard } from "../components/ScrapOfferCard";
import { ScrapPartRequestDetailDialog } from "../components/ScrapPartRequestDetailDialog";
import { OfferForm } from "../components/PartRequestDetailContent";
import type { Offer, SalvageOrder } from "../types";

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

/** Scrap provider's own offers, queried directly from GET /api/Offers. */
export function ScrapMyOffersPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);

  const { data: offersData, isLoading, isError, refetch } = useOffersQuery({ pageSize: 100 });
  const { data: ordersResult } = useSalvageOrdersQuery({ pageSize: 100 });

  const orderById = useMemo(() => {
    const map = new Map<string, SalvageOrder>();
    if (ordersResult?.kind === "ok") {
      for (const order of ordersResult.data.items) map.set(order.id, order);
    }
    return map;
  }, [ordersResult]);

  const deleteMutation = useDeleteOfferMutation();

  const offers = offersData?.items ?? [];

  function handleDelete() {
    if (!deletingOffer) return;
    deleteMutation.mutate(deletingOffer.id, {
      onSuccess: () => {
        toast.success(t("scrap.offer.deleteSuccess"));
        setDeletingOffer(null);
      },
      onError: () => {
        toast.error(t("common.saveFailed"));
        setDeletingOffer(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6 provider-fade-up">
      <ProviderPageHeader
        icon={<Tag className="h-5 w-5" />}
        title={t("scrap.myOffers.title")}
        subtitle={t("scrap.myOffers.subtitle")}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      {!isLoading && !isError && offers.length === 0 && (
        <ProviderEmptyState
          icon={<Tag className="h-8 w-8" />}
          title={t("scrap.myOffers.emptyTitle")}
          description={t("scrap.myOffers.emptyDescription")}
        />
      )}

      {/* Data state */}
      {!isLoading && !isError && offers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {offers.map((offer) => (
            <ScrapOfferCard
              key={offer.id}
              offer={offer}
              order={orderById.get(offer.orderId)}
              onViewRequest={(id) => setSelectedRequestId(id)}
              onEdit={(o) => setEditingOffer(o)}
              onDelete={(o) => setDeletingOffer(o)}
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
      {editingOffer && (
        <ProviderDialog
          open={true}
          onOpenChange={(o) => { if (!o) setEditingOffer(null); }}
          title={t("scrap.offer.editTitle")}
          size="lg"
        >
          <OfferForm
            orderId={editingOffer.orderId}
            existingOffer={editingOffer}
            onDone={() => setEditingOffer(null)}
          />
        </ProviderDialog>
      )}

      {/* Delete confirm dialog — defer-mounted */}
      {deletingOffer && (
        <ProviderDialog
          open={true}
          onOpenChange={(o) => { if (!o) setDeletingOffer(null); }}
          title={t("scrap.offer.deleteConfirmTitle")}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-ink-body)]">{t("scrap.offer.deleteConfirmBody")}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingOffer(null)}
                disabled={deleteMutation.isPending}
                className={[
                  "flex-1 rounded-[var(--radius-md)] border border-[var(--color-divider)]",
                  "py-2 text-sm font-medium text-[var(--color-ink-body)]",
                  "hover:bg-[var(--color-surface-2)]",
                  "disabled:opacity-50",
                ].join(" ")}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className={[
                  "flex-1 inline-flex items-center justify-center gap-2",
                  "rounded-[var(--radius-md)] bg-[var(--color-danger-500)]",
                  "py-2 text-sm font-semibold text-white",
                  "hover:opacity-90",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </ProviderDialog>
      )}
    </div>
  );
}
