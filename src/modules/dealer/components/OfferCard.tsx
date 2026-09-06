/**
 * @file OfferCard.tsx
 *
 * Dealer offer card for the offers list — READ-ONLY (Stage 1). The whole card
 * navigates to the offer detail page; it carries NO edit/delete actions
 * (those arrive in Stage 3).
 *
 * Dealer-specific for now, but written to be promotable to
 * `src/shared/provider-ui` later (workshop / scrap reuse). Self-contained:
 * formatters + i18n via `useTranslation`; status derived only through
 * `computeOfferStatus` + `OFFER_STATUS_META`.
 */

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CalendarRange, Tag, ArrowRight, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { ProviderCard, ProviderStatusPill } from "@shared/provider-ui";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import type { Offer } from "../types";
import { computeOfferStatus, OFFER_STATUS_META } from "../offerStatus";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link OfferCard}. */
export interface OfferCardProps {
  offer: Offer;
  /** Injected once per render by the list so status is stable across cards. */
  now: Date;
  /** Opens the edit dialog for this offer (Stage 3). */
  onEdit?: (offer: Offer) => void;
  /** Opens the delete-confirm dialog for this offer (Stage 3). */
  onDelete?: (offer: Offer) => void;
  /** CSS style forwarded from the list for stagger animation-delay. */
  style?: CSSProperties;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Dealer offer card — read-only summary surface for the offers list. */
export function OfferCard({ offer, now, onEdit, onDelete, style }: OfferCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isRTL = i18n.dir() === "rtl";
  const DetailArrow = isRTL ? ArrowLeft : ArrowRight;

  const status = computeOfferStatus(offer, now);
  const meta = OFFER_STATUS_META[status];

  const title = offer.title || t("dealer.offers.untitled");
  const serviceCount = offer.items.length;
  const maxDiscount = offer.items.reduce((m, it) => Math.max(m, it.discountAmount), 0);

  const goToDetail = () => navigate(`/provider/dealer/offers/${offer.id}`);
  const stop = (e: MouseEvent) => e.stopPropagation();
  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation();
    onEdit?.(offer);
  };
  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    onDelete?.(offer);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToDetail();
    }
  };

  const cardStyle: CSSProperties = {
    transition:
      "transform var(--dur-base) var(--ease-provider), box-shadow var(--dur-base) var(--ease-provider)",
    ...style,
  };

  return (
    <ProviderCard
      padded={false}
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={onKeyDown}
      style={cardStyle}
      className="provider-fade-up flex cursor-pointer flex-col overflow-hidden hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-orange)]"
    >
      {/* ── Header: title + status pill ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-sm font-semibold text-[var(--color-ink-body)]">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            <CalendarRange
              className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]"
              aria-hidden
            />
            <span className="text-xs text-[var(--color-muted)]">
              {formatOrderDate(offer.startDate, i18n.language)} —{" "}
              {formatOrderDate(offer.endDate, i18n.language)}
            </span>
          </div>
        </div>

        <ProviderStatusPill label={t(meta.labelKey)} tone={meta.tone} />
      </div>

      {/* ── Body: discount lines summary ─────────────────────────────────── */}
      <div className="flex flex-col gap-2 border-t border-[var(--color-divider)] px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {t("dealer.offers.summary", {
              count: serviceCount,
              amount: formatCurrency(maxDiscount, i18n.language),
            })}
          </span>
        </div>

        {offer.items.slice(0, 2).map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between gap-3 text-xs text-[var(--color-ink-body)]"
          >
            <span className="truncate">
              {it.serviceName || t("dealer.offers.unnamedService")}
            </span>
            <span className="shrink-0 tabular-nums text-[var(--color-brand-orange)]" dir="ltr">
              - {formatCurrency(it.discountAmount, i18n.language)}
            </span>
          </div>
        ))}
      </div>

      {/* ── Footer: row actions + view-detail affordance ─────────────────── */}
      <div className="flex items-center justify-between gap-2 border-t border-[var(--color-divider)] px-4 py-3">
        <div className="flex items-center gap-1" onClick={stop}>
          {onEdit && (
            <button
              type="button"
              onClick={handleEdit}
              aria-label={t("dealer.offers.editCta")}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label={t("dealer.offers.delete.cta")}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-500)]"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-brand-orange)]">
          {t("dealer.offers.viewDetail")}
          <DetailArrow className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </ProviderCard>
  );
}
