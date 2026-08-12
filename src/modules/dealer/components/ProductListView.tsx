/**
 * @file ProductListView.tsx
 *
 * Dealer product list view — airy row-as-card vertical stack (not a tight table).
 * Each row is a ProviderCard surface with hover lift and action buttons.
 * Handles loading (skeleton rows), error state, and empty state internally.
 * Dealer-specific — lives in modules/dealer/components/.
 */

import { useTranslation } from "react-i18next";
import { Package, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { ProviderCard, ProviderSkeleton, ProviderEmptyState } from "@shared/provider-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@shared/lib/utils";
import type { Product } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProductListView}. */
export interface ProductListViewProps {
  products: Product[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCardClick: (product: Product) => void;
  onAddProduct?: () => void;
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function ProductRowSkeleton() {
  return (
    <ProviderCard padded={false} className="flex items-center gap-4 px-5 py-4">
      <ProviderSkeleton
        variant="block"
        width={64}
        height={64}
        className="shrink-0 rounded-[var(--radius-sm)]"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <ProviderSkeleton variant="line" width="50%" />
        <ProviderSkeleton variant="line" width="30%" />
      </div>
      <div className="hidden items-center gap-6 sm:flex">
        <ProviderSkeleton variant="line" width={80} />
        <ProviderSkeleton variant="line" width={60} />
      </div>
      <div className="flex shrink-0 gap-1">
        <ProviderSkeleton variant="circle" width={32} height={32} />
        <ProviderSkeleton variant="circle" width={32} height={32} />
      </div>
    </ProviderCard>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Dealer product list view — airy row-as-card vertical stack. */
export function ProductListView({
  products,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onCardClick,
  onAddProduct,
}: ProductListViewProps) {
  const { t, i18n } = useTranslation();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-[var(--color-muted)]">{t("common.errorTitle")}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t("common.errorRetry")}
          </Button>
        )}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <ProviderEmptyState
        icon={<Package className="h-8 w-8" aria-hidden />}
        title={t("dealer.products.emptyTitle")}
        description={t("dealer.products.emptyDescription")}
        action={
          onAddProduct ? (
            <Button onClick={onAddProduct}>
              <Plus className="me-2 h-4 w-4" aria-hidden />
              {t("dealer.products.addBtn")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="provider-fade-up"
          style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
        >
          <ProviderCard
            padded={false}
            style={{
              transition:
                "transform var(--dur-base) var(--ease-provider), box-shadow var(--dur-base) var(--ease-provider)",
            }}
            className={cn(
              "flex items-center gap-4 px-5 py-4",
              "hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)]",
            )}
          >
            {/* Clickable area: icon + name + desktop meta */}
            <div
              role="button"
              tabIndex={0}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 focus-visible:outline-none"
              onClick={() => onCardClick(product)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onCardClick(product);
              }}
            >
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]"
                aria-hidden
              >
                <Wrench className="h-6 w-6 text-[var(--color-muted)]" />
              </div>

              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-[var(--color-ink-body)]">
                  {product.serviceName}
                </span>
                {product.notes && (
                  <span className="truncate text-xs text-[var(--color-muted)]">{product.notes}</span>
                )}
              </div>

              {/* Price · Quantity — hidden on mobile */}
              <div className="ms-auto hidden items-center gap-6 sm:flex">
                <span className="tabular-nums text-sm font-semibold text-[var(--color-brand-orange)]">
                  {formatCurrency(product.price)}
                </span>
                <span
                  className={cn(
                    "tabular-nums text-sm",
                    product.quantity === 0 && "font-medium text-[var(--color-warning-500)]",
                  )}
                >
                  {product.quantity === 0 ? t("dealer.products.outOfStock") : product.quantity}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div
              className="flex shrink-0 items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
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
        </div>
      ))}
    </div>
  );
}
