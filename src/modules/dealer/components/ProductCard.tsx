/**
 * @file ProductCard.tsx
 *
 * Dealer-specific product card for the card grid view.
 * Reuses ProviderCard / ProviderStatusPill from provider-ui.
 * Dealer-specific — lives in modules/dealer/components/.
 */

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Package, Pencil, Power, Trash2 } from "lucide-react";
import { ProviderCard, ProviderStatusPill } from "@shared/provider-ui";
import type { StatusPillTone } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import type { Product } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProductCard}. */
export interface ProductCardProps {
  product: Product;
  categoryLabel: string;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCardClick: (product: Product) => void;
  isTogglePending?: boolean;
  /** CSS style forwarded for stagger animation-delay. */
  style?: CSSProperties;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, StatusPillTone> = {
  active:       "success",
  draft:        "neutral",
  out_of_stock: "warning",
  archived:     "neutral",
};

// ── Component ─────────────────────────────────────────────────────────────────

/** Dealer product card for the grid view. */
export function ProductCard({
  product,
  onEdit,
  onToggleStatus,
  onDelete,
  onCardClick,
  isTogglePending,
  style,
}: ProductCardProps) {
  const { t, i18n } = useTranslation();

  const name = i18n.language === "ar" ? product.nameAr : product.nameEn;
  const isDimmed = product.status === "archived" || product.status === "draft";

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
        isDimmed && "opacity-60",
      )}
    >
      {/* ── Clickable area: image + product details ───────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        className="flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-orange)]/50"
        onClick={() => onCardClick(product)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onCardClick(product);
        }}
      >
        {/* Image / placeholder */}
        {product.images?.[0] ? (
          <div className="aspect-[4/3] w-full overflow-hidden rounded-t-[var(--radius-lg)]">
            <img
              src={product.images[0]}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-provider)] hover:scale-105"
            />
          </div>
        ) : (
          <div
            className="flex aspect-[4/3] w-full items-center justify-center rounded-t-[var(--radius-lg)] bg-[var(--color-surface-2)]"
            aria-hidden
          >
            <Package className="h-10 w-10 text-[var(--color-muted)]" />
          </div>
        )}

        {/* Product details */}
        <div className="flex flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--color-ink-body)]">
            {name}
          </h3>

          <span className="text-xs text-[var(--color-muted)]" dir="ltr">
            {product.sku}
          </span>

          <span className="tabular-nums text-base font-semibold text-[var(--color-brand-orange)]">
            {formatCurrency(product.price)}
          </span>

          <div className="flex items-center justify-between gap-2">
            <ProviderStatusPill
              label={t(`dealer.status.product.${product.status}`)}
              tone={STATUS_TONE[product.status] ?? "neutral"}
            />
            {product.stockQty === 0 ? (
              <span className="text-xs font-medium text-[var(--color-warning-500)]">
                {t("dealer.products.outOfStock")}
              </span>
            ) : (
              <span className="text-xs text-[var(--color-muted)]">
                {t("dealer.products.colStock")}: {product.stockQty}
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
          title={t("dealer.products.toggleStatusBtn")}
          disabled={isTogglePending}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)] disabled:opacity-40"
          onClick={() => onToggleStatus(product)}
        >
          <Power className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          title={t("common.edit")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
          onClick={() => onEdit(product)}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          title={t("common.delete")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-danger-500)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-danger-50)]"
          onClick={() => onDelete(product)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </ProviderCard>
  );
}
