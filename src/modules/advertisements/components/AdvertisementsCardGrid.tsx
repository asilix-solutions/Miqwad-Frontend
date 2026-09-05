/**
 * @file AdvertisementsCardGrid.tsx
 * @description Cards view for the admin Advertisements list — a responsive
 * grid of {@link AdvertisementCard}s, with matching skeleton/error states.
 * Reads the same `useAdvertisementsList` data as the table view (no
 * duplicate fetching); the empty state is handled by the page (shared with
 * the table view).
 */
import { useTranslation } from "react-i18next";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdvertisementCard, AdvertisementCardSkeleton } from "./AdvertisementCard";
import type { Advertisement } from "../types";

const SKELETON_COUNT = 8;

interface AdvertisementsCardGridProps {
  items: Advertisement[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (advertisement: Advertisement) => void;
  onDelete: (advertisement: Advertisement) => void;
  onToggleActive: (advertisement: Advertisement, isActive: boolean) => void;
  togglingId?: string | null;
}

export function AdvertisementsCardGrid({
  items,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onToggleActive,
  togglingId = null,
}: AdvertisementsCardGridProps) {
  const { t } = useTranslation();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] px-6 py-16 text-center shadow-[var(--shadow-1)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-danger-500)_10%,transparent)]">
          <AlertCircle className="h-9 w-9 text-[var(--color-danger-500)]" />
        </div>
        <span className="text-sm font-medium text-[var(--color-ink-body)]">
          {t("superAdmin.ads.errorTitle")}
        </span>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCw className="size-4" />
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <AdvertisementCardSkeleton key={`ad-skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <AdvertisementCard
          key={item.id}
          advertisement={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          isToggling={togglingId === item.id}
        />
      ))}
    </div>
  );
}
