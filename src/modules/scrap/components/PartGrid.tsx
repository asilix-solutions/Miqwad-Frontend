/**
 * @file PartGrid.tsx
 *
 * Responsive card grid for the scrap parts catalog.
 * 1 → 2 → 3 → 4 column layout across breakpoints.
 * Handles loading (skeleton cards), error state, and empty state internally.
 * Scrap-specific — lives in modules/scrap/components/.
 */

import { useTranslation } from "react-i18next";
import { Package, Plus } from "lucide-react";
import { ProviderCard, ProviderSkeleton, ProviderEmptyState } from "@shared/provider-ui";
import { Button } from "@/components/ui/button";
import type { ProviderService } from "@shared/provider-services";
import { PartCard } from "./PartCard";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link PartGrid}. */
export interface PartGridProps {
  parts: ProviderService[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onEdit: (part: ProviderService) => void;
  onDelete: (part: ProviderService) => void;
  onCardClick: (part: ProviderService) => void;
  onAddPart?: () => void;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function PartCardSkeleton() {
  return (
    <ProviderCard padded={false} className="flex flex-col overflow-hidden">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-t-[var(--radius-lg)]">
        <ProviderSkeleton variant="block" height="100%" className="rounded-none" />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <ProviderSkeleton variant="line" width="75%" />
        <ProviderSkeleton variant="line" width="40%" />
        <div className="flex items-center justify-between gap-3">
          <ProviderSkeleton variant="line" width="35%" />
          <ProviderSkeleton variant="line" width="25%" />
        </div>
      </div>
      <div className="flex justify-end gap-1 border-t border-[var(--color-divider)] px-4 py-2">
        <ProviderSkeleton variant="circle" height={32} width={32} />
        <ProviderSkeleton variant="circle" height={32} width={32} />
      </div>
    </ProviderCard>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const STAGGER_CAP = 12;

/** Responsive 1→2→3→4 column grid of {@link PartCard}s. */
export function PartGrid({
  parts,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onCardClick,
  onAddPart,
}: PartGridProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <PartCardSkeleton key={i} />
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

  if (parts.length === 0) {
    return (
      <ProviderEmptyState
        icon={<Package className="h-8 w-8" aria-hidden />}
        title={t("scrap.parts.emptyTitle")}
        description={t("scrap.parts.emptyDescription")}
        action={
          onAddPart ? (
            <Button onClick={onAddPart}>
              <Plus className="me-2 h-4 w-4" aria-hidden />
              {t("scrap.parts.addBtn")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {parts.map((part, index) => (
        <PartCard
          key={part.id}
          part={part}
          onEdit={onEdit}
          onDelete={onDelete}
          onCardClick={onCardClick}
          style={{ animationDelay: `${Math.min(index, STAGGER_CAP) * 50}ms` }}
        />
      ))}
    </div>
  );
}
