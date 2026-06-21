/**
 * @file ProductGrid.tsx
 *
 * Responsive card grid for dealer products.
 * 1 → 2 → 3 → 4 column layout across breakpoints.
 * Handles loading (skeleton cards), error state, and empty state internally.
 * Dealer-specific — lives in modules/dealer/components/.
 */

import { useTranslation } from "react-i18next";
import { Package, Plus } from "lucide-react";
import { ProviderCard, ProviderSkeleton, ProviderEmptyState } from "@shared/provider-ui";
import { Button } from "@/components/ui/button";
import type { Product } from "../types";
import { ProductCard } from "./ProductCard";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProductGrid}. */
export interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  getCategoryLabel: (categoryId: string) => string;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCardClick: (product: Product) => void;
  isTogglePending?: boolean;
  onAddProduct?: () => void;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <ProviderCard padded={false} className="flex flex-col overflow-hidden">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-t-[var(--radius-lg)]">
        <ProviderSkeleton variant="block" height="100%" className="rounded-none" />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <ProviderSkeleton variant="line" width="75%" />
        <ProviderSkeleton variant="line" width="40%" />
        <ProviderSkeleton variant="line" width="55%" />
        <div className="flex items-center justify-between gap-3">
          <ProviderSkeleton variant="line" width="35%" />
          <ProviderSkeleton variant="line" width="25%" />
        </div>
      </div>
      <div className="flex justify-end gap-1 border-t border-[var(--color-divider)] px-4 py-2">
        <ProviderSkeleton variant="circle" height={32} width={32} />
        <ProviderSkeleton variant="circle" height={32} width={32} />
        <ProviderSkeleton variant="circle" height={32} width={32} />
      </div>
    </ProviderCard>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const STAGGER_CAP = 12;

/** Responsive 1→2→3→4 column grid of {@link ProductCard}s. */
export function ProductGrid({
  products,
  isLoading,
  isError,
  onRetry,
  getCategoryLabel,
  onEdit,
  onToggleStatus,
  onDelete,
  onCardClick,
  isTogglePending,
  onAddProduct,
}: ProductGridProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          categoryLabel={getCategoryLabel(product.categoryId)}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          onCardClick={onCardClick}
          isTogglePending={isTogglePending}
          style={{ animationDelay: `${Math.min(index, STAGGER_CAP) * 50}ms` }}
        />
      ))}
    </div>
  );
}
