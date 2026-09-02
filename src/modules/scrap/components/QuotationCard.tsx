/**
 * @file QuotationCard.tsx
 *
 * Card for a single submitted quotation on the "My Offers" page. Shows the
 * quotation name, notes, compatibility, attachment count and submitted date
 * from the live `/api/request-quotations` shape. View-request / edit / delete
 * actions are delegated to the parent.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useTranslation } from "react-i18next";
import { Calendar, Pencil, Trash2, Paperclip } from "lucide-react";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import type { RequestQuotation, SalvageOrder } from "../types";

export interface QuotationCardProps {
  quotation: RequestQuotation;
  /** The salvage order this quotation targets, when resolvable from the fetched list. */
  order?: SalvageOrder;
  onViewRequest: (orderId: string) => void;
  onEdit: (quotation: RequestQuotation) => void;
  onDelete: (quotation: RequestQuotation) => void;
}

/** Card representing a single submitted quotation. */
export function QuotationCard({
  quotation,
  order,
  onViewRequest,
  onEdit,
  onDelete,
}: QuotationCardProps) {
  const { t, i18n } = useTranslation();

  const vehicleLabel = order
    ? [order.brand, order.model, order.year].filter(Boolean).join(" · ")
    : undefined;

  return (
    <article
      className={[
        "flex flex-col gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5",
        "shadow-[var(--shadow-provider-sm)]",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)]",
      ].join(" ")}
      style={{
        transition:
          "transform var(--dur-base) var(--ease-provider), box-shadow var(--dur-base) var(--ease-provider)",
      }}
    >
      <div className="flex flex-col gap-1">
        <p className="truncate text-base font-semibold leading-snug text-[var(--color-ink-body)]">
          {quotation.name}
        </p>
        {order && (
          <p className="text-sm text-[var(--color-muted)]">
            {order.partName}
            {vehicleLabel ? ` · ${vehicleLabel}` : ""}
          </p>
        )}
        {quotation.notes && (
          <p className="line-clamp-2 whitespace-pre-line text-xs text-[var(--color-muted)]">
            {quotation.notes}
          </p>
        )}
        {quotation.isCompatibleWith && (
          <p className="text-xs text-[var(--color-muted)]">
            {t("scrap.offer.isCompatibleWithLabel")}: {quotation.isCompatibleWith}
          </p>
        )}
        {quotation.attachments.length > 0 && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <Paperclip className="h-3.5 w-3.5" aria-hidden />
            {quotation.attachments.length}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-divider)] pt-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {t("scrap.myOffers.offeredOn")} {formatOrderDate(quotation.createdAt, i18n.language)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewRequest(quotation.orderId)}
            className={[
              "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold",
              "bg-[var(--color-brand-50,#fff4f0)] text-[var(--color-brand-orange)]",
              "hover:bg-[var(--color-brand-100,#fde8df)]",
              "transition-colors duration-[var(--dur-fast)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            {t("scrap.myOffers.viewRequest")}
          </button>
          <button
            type="button"
            onClick={() => onEdit(quotation)}
            aria-label={t("scrap.myOffers.edit")}
            className={[
              "rounded-[var(--radius-sm)] p-1.5 text-[var(--color-ink-body)]",
              "hover:bg-[var(--color-surface-2)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(quotation)}
            aria-label={t("scrap.myOffers.delete")}
            className={[
              "rounded-[var(--radius-sm)] p-1.5 text-[var(--color-danger-500)]",
              "hover:bg-[var(--color-danger-50)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger-500)]/40",
            ].join(" ")}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
