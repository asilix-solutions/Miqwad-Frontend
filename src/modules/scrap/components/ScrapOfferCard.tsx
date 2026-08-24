/**
 * @file ScrapOfferCard.tsx
 *
 * Card for a single submitted offer on the My Offers page.
 * Shows the provider-service name and neutral start/end dates from the
 * confirmed /api/Offers response shape (2026-08-23 contract).
 * Edit/delete actions and "view request" linking are preserved unchanged.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useTranslation } from "react-i18next";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import type { Offer, SalvageOrder } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(isoString: string, lang: string): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(isoString));
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapOfferCardProps {
  offer: Offer;
  /** The salvage order this offer targets, when resolvable from the fetched list. */
  order?: SalvageOrder;
  onViewRequest: (orderId: string) => void;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Card representing a single submitted offer. */
export function ScrapOfferCard({ offer, order, onViewRequest, onEdit, onDelete }: ScrapOfferCardProps) {
  const { t, i18n } = useTranslation();

  const vehicleLabel = order
    ? [order.brand, order.model, order.year].filter(Boolean).join(" · ")
    : undefined;

  const offeredOn = formatDate(offer.createdAt, i18n.language);
  const serviceName = offer.providerService?.serviceName ?? "—";

  return (
    <article
      className={[
        "flex flex-col gap-4 rounded-[var(--radius-lg)]",
        "bg-[var(--color-surface)] p-5",
        "shadow-[var(--shadow-provider-sm)]",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)]",
      ].join(" ")}
      style={{
        transition:
          "transform var(--dur-base) var(--ease-provider), box-shadow var(--dur-base) var(--ease-provider)",
      }}
    >
      {/* ── Header: service name + order context ───────────────────────── */}
      <div className="flex flex-col gap-1">
        <p className="truncate text-base font-semibold leading-snug text-[var(--color-ink-body)]">
          {serviceName}
        </p>
        {order && (
          <p className="text-sm text-[var(--color-muted)]">
            {order.partName}
            {vehicleLabel ? ` · ${vehicleLabel}` : ""}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--color-muted)]">
          <span>
            {t("scrap.offer.startDateLabel")}: {formatDate(offer.startDate, i18n.language)}
          </span>
          <span>
            {t("scrap.offer.endDateLabel")}: {formatDate(offer.endDate, i18n.language)}
          </span>
        </div>
      </div>

      {/* ── Bottom row: offered date + actions ──────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-divider)] pt-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {t("scrap.myOffers.offeredOn")} {offeredOn}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewRequest(offer.orderId)}
            className={[
              "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold",
              "bg-[var(--color-brand-50,#fff4f0)] text-[var(--color-brand-orange)]",
              "hover:bg-[var(--color-brand-100,#fde8df)]",
              "transition-colors duration-[var(--dur-fast)]",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            {t("scrap.myOffers.viewRequest")}
          </button>
          <button
            type="button"
            onClick={() => onEdit(offer)}
            aria-label={t("scrap.myOffers.edit")}
            className={[
              "rounded-[var(--radius-sm)] p-1.5 text-[var(--color-ink-body)]",
              "hover:bg-[var(--color-surface-2)]",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(offer)}
            aria-label={t("scrap.myOffers.delete")}
            className={[
              "rounded-[var(--radius-sm)] p-1.5 text-[var(--color-danger-500)]",
              "hover:bg-[var(--color-danger-50)]",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[var(--color-danger-500)]/40",
            ].join(" ")}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
