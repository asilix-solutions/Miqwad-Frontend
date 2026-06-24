/**
 * @file ScrapOfferCard.tsx
 *
 * Price-hero offer card for the My Offers page.
 * Price is the visual centrepiece (large, brand-orange, formatCurrency).
 * Secondary info: part name, request number, vehicle, status pill, offered date.
 * "عرض الطلب" button opens the shared ScrapPartRequestDetailDialog inline.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useTranslation } from "react-i18next";
import { Tag, Calendar } from "lucide-react";
import { ProviderStatusPill } from "@shared/provider-ui";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { offerStatusTone } from "../lib/offerStatus";
import type { MyOffer } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatOfferedOn(isoString: string, lang: string): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(isoString));
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapOfferCardProps {
  offer: MyOffer;
  onViewRequest: (partRequestId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Price-hero card representing a single submitted offer. */
export function ScrapOfferCard({ offer, onViewRequest }: ScrapOfferCardProps) {
  const { t, i18n } = useTranslation();

  const vehicleLabel = [
    t(`scrap.profile.specializations.brand.${offer.vehicle.brand}`, {
      defaultValue: offer.vehicle.brand,
    }),
    offer.vehicle.model,
    String(offer.vehicle.year),
  ].join(" · ");

  const offeredOn = formatOfferedOn(offer.offeredAt, i18n.language);
  const statusTone = offerStatusTone(offer.status);

  return (
    <article
      className={[
        "group flex flex-col gap-4 rounded-[var(--radius-lg)]",
        "bg-[var(--color-surface)] p-5",
        "shadow-[var(--shadow-provider-sm)]",
        "transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-provider)]",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)]",
        "@media (prefers-reduced-motion: reduce) { transition: none; }",
      ].join(" ")}
      style={{
        transition:
          "transform var(--dur-base) var(--ease-provider), box-shadow var(--dur-base) var(--ease-provider)",
      }}
    >
      {/* ── Top row: price hero + status pill ─────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        {/* Price — the visual hero */}
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-[var(--font-display)] text-2xl font-bold leading-none"
            style={{ color: "var(--color-brand-orange)" }}
          >
            {formatCurrency(offer.offerPrice, i18n.language)}
          </span>
        </div>

        {/* Status pill */}
        <ProviderStatusPill
          tone={statusTone}
          label={t(`scrap.myOffers.status.${offer.status}`)}
        />
      </div>

      {/* ── Middle: part info ──────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <p className="truncate text-base font-semibold leading-snug text-[var(--color-ink-body)]">
          {offer.partName}
        </p>

        <p className="text-sm text-[var(--color-muted)]">{vehicleLabel}</p>

        <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-muted)]">
          <Tag className="h-3 w-3 shrink-0" aria-hidden />
          <span className="font-mono">{offer.requestNumber}</span>
        </div>
      </div>

      {/* ── Bottom row: offered date + action button ───────────────── */}
      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-divider)] pt-3">
        {/* Offered date */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {t("scrap.myOffers.offeredOn")} {offeredOn}
          </span>
        </div>

        {/* View request action */}
        <button
          type="button"
          onClick={() => onViewRequest(offer.partRequestId)}
          className={[
            "shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5",
            "text-xs font-semibold",
            "bg-[var(--color-brand-50,#fff4f0)] text-[var(--color-brand-orange)]",
            "transition-colors duration-[var(--dur-fast)]",
            "hover:bg-[var(--color-brand-100,#fde8df)]",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-[var(--color-brand-orange)]/40",
          ].join(" ")}
        >
          {t("scrap.myOffers.viewRequest")}
        </button>
      </div>
    </article>
  );
}
