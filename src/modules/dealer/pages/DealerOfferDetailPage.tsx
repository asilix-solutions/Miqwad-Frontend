/**
 * @file DealerOfferDetailPage.tsx
 *
 * Dealer offer detail — READ-ONLY (Stage 1). A dedicated page (not a dialog)
 * because the discount-line breakdown is a table that deserves room and a
 * shareable URL. Backed by `GET /api/Offers/{id}`.
 *
 * Header: title + derived status pill + date window. Body: the fixed-SAR
 * discount lines — service name, original price, discount, final price (all
 * via `formatCurrency`) with a clear saving cue. No edit/delete this stage.
 * Handles loading / error / not-found.
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgePercent, Tag, RotateCw, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProviderPageHeader,
  ProviderCard,
  ProviderStatusPill,
  ProviderDataView,
  ProviderEmptyState,
  ProviderSkeleton,
} from "@shared/provider-ui";
import type { ColumnDef } from "@shared/provider-ui";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import { useOffer } from "../hooks/useOfferQueries";
import type { OfferItem } from "../types";
import { computeOfferStatus, OFFER_STATUS_META } from "../offerStatus";
import { OfferFormDialog } from "../components/OfferFormDialog";
import { DeleteOfferDialog } from "../components/DeleteOfferDialog";

export function DealerOfferDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { offerId = "" } = useParams<{ offerId: string }>();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: offer, isLoading, isError, refetch } = useOffer(offerId);

  const isRTL = i18n.dir() === "rtl";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const money = (v: number) => formatCurrency(v, i18n.language);

  const now = useMemo(() => new Date(), []);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <ProviderSkeleton width="40%" height={24} />
        <ProviderCard className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProviderSkeleton key={i} width={`${55 + i * 8}%`} />
          ))}
        </ProviderCard>
      </div>
    );
  }

  // ── Error / not-found ─────────────────────────────────────────────────────
  if (isError || !offer) {
    return (
      <ProviderEmptyState
        icon={<Tag className="h-8 w-8" aria-hidden />}
        title={t("dealer.offers.notFound")}
        description={t("dealer.offers.notFoundDesc")}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => { void refetch(); }}>
              <RotateCw className="me-2 h-4 w-4" aria-hidden />
              {t("common.retry")}
            </Button>
            <Link to="/provider/dealer/offers">
              <Button variant="ghost">
                <BackArrow className="me-2 h-4 w-4" aria-hidden />
                {t("dealer.offers.backToOffers")}
              </Button>
            </Link>
          </div>
        }
      />
    );
  }

  const status = computeOfferStatus(offer, now);
  const meta = OFFER_STATUS_META[status];
  const totalSaving = offer.items.reduce((s, it) => s + it.discountAmount, 0);

  const columns: ColumnDef<OfferItem>[] = [
    {
      key: "service",
      header: t("dealer.offers.colService"),
      primary: true,
      render: (item) => (
        <span className="text-sm font-medium text-[var(--color-ink-body)]">
          {item.serviceName || t("dealer.offers.unnamedService")}
        </span>
      ),
    },
    {
      key: "originalPrice",
      header: t("dealer.offers.colOriginalPrice"),
      align: "end",
      hideOnMobile: true,
      render: (item) => (
        <span className="text-sm tabular-nums text-[var(--color-muted)] line-through" dir="ltr">
          {money(item.originalPrice)}
        </span>
      ),
    },
    {
      key: "discountAmount",
      header: t("dealer.offers.colDiscount"),
      align: "end",
      render: (item) => (
        <span className="text-sm tabular-nums text-[var(--color-brand-orange)]" dir="ltr">
          - {money(item.discountAmount)}
        </span>
      ),
    },
    {
      key: "discountedPrice",
      header: t("dealer.offers.colFinalPrice"),
      align: "end",
      render: (item) => (
        <span className="text-sm font-semibold tabular-nums text-[var(--color-ink-body)]" dir="ltr">
          {money(item.discountedPrice)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/provider/dealer/offers"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink-body)]"
      >
        <BackArrow className="h-4 w-4" aria-hidden />
        {t("dealer.offers.backToOffers")}
      </Link>

      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<BadgePercent className="h-5 w-5" aria-hidden />}
          title={offer.title || t("dealer.offers.untitled")}
          subtitle={`${formatOrderDate(offer.startDate, i18n.language)} — ${formatOrderDate(
            offer.endDate,
            i18n.language,
          )}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ProviderStatusPill label={t(meta.labelKey)} tone={meta.tone} />
              <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" aria-hidden />
                {t("dealer.offers.editCta")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t("dealer.offers.delete.cta")}
              </Button>
            </div>
          }
        />
      </div>

      {editOpen && (
        <OfferFormDialog mode="edit" offer={offer} open={editOpen} onOpenChange={setEditOpen} />
      )}
      {deleteOpen && (
        <DeleteOfferDialog
          offer={offer}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={() => navigate("/provider/dealer/offers")}
        />
      )}

      <div className="provider-fade-up space-y-4" style={{ animationDelay: "40ms" }}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {t("dealer.offers.linesHeading")}
          </h2>
          <span className="text-xs text-[var(--color-muted)]">
            {t("dealer.offers.servicesCount", { count: offer.items.length })}
          </span>
        </div>

        <ProviderDataView<OfferItem>
          columns={columns}
          rows={offer.items}
          getRowKey={(item) => item.id}
          emptyState={
            <ProviderEmptyState
              icon={<Tag className="h-8 w-8" aria-hidden />}
              title={t("dealer.offers.noLines")}
            />
          }
        />

        {offer.items.length > 0 && (
          <ProviderCard className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-[var(--color-ink-body)]">
              {t("dealer.offers.totalSaving")}
            </span>
            <span
              className="text-base font-bold tabular-nums text-[var(--color-brand-orange)]"
              dir="ltr"
            >
              - {money(totalSaving)}
            </span>
          </ProviderCard>
        )}
      </div>
    </div>
  );
}
