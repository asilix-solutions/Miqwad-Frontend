/**
 * @file PartCard.tsx
 *
 * Scrap-specific part card for the catalog grid view.
 * A "part" is a priced service offering — no image/sku/condition beyond
 * what's uploaded, so the card leads with the service name and a
 * quantity/price summary. Reuses ProviderCard from provider-ui.
 * Scrap-specific — lives in modules/scrap/components/.
 */

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Wrench } from "lucide-react";
import { ProviderCard } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import type { ProviderService } from "@shared/provider-services";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link PartCard}. */
export interface PartCardProps {
  part: ProviderService;
  onEdit: (part: ProviderService) => void;
  onDelete: (part: ProviderService) => void;
  onCardClick: (part: ProviderService) => void;
  /** CSS style forwarded for stagger animation-delay. */
  style?: CSSProperties;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Scrap part card for the grid view. */
export function PartCard({ part, onEdit, onDelete, onCardClick, style }: PartCardProps) {
  const { t, i18n } = useTranslation();

  const cardStyle: CSSProperties = {
    transition:
      "transform var(--dur-base) var(--ease-provider), box-shadow var(--dur-base) var(--ease-provider)",
    ...style,
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);

  return (
    <ProviderCard
      padded={false}
      style={cardStyle}
      className={cn(
        "provider-fade-up flex flex-col overflow-hidden",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)]",
      )}
    >
      {/* ── Clickable area: icon + part details ─────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        className="flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-orange)]/50"
        onClick={() => onCardClick(part)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onCardClick(part);
        }}
      >
        <div
          className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-t-[var(--radius-lg)] bg-[var(--color-surface-2)]"
          aria-hidden
        >
          {part.images[0] ? (
            <img src={part.images[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <Wrench className="h-10 w-10 text-[var(--color-muted)]" />
          )}
        </div>

        <div className="flex flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--color-ink-body)]">
            {part.serviceName}
          </h3>

          {part.isCompatibleWith && (
            <p className="line-clamp-1 text-xs text-[var(--color-muted)]">{part.isCompatibleWith}</p>
          )}

          <span className="tabular-nums text-base font-semibold text-[var(--color-brand-orange)]">
            {formatCurrency(part.price)}
          </span>

          <div className="flex items-center justify-between gap-2">
            {part.quantity === 0 ? (
              <span className="text-xs font-medium text-[var(--color-warning-500)]">
                {t("scrap.parts.outOfStock")}
              </span>
            ) : (
              <span className="text-xs text-[var(--color-muted)]">
                {t("scrap.parts.colQuantity")}: {part.quantity}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Action bar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-end gap-0.5 border-t border-[var(--color-divider)] px-4 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          title={t("common.edit")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
          onClick={() => onEdit(part)}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          title={t("common.delete")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-danger-500)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-danger-50)]"
          onClick={() => onDelete(part)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </ProviderCard>
  );
}
