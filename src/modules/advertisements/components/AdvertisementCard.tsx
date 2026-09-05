/**
 * @file AdvertisementCard.tsx
 * @description Visual card for one advertisement, used in the cards view of
 * the admin Advertisements page. Renders the same {@link Advertisement}
 * view-model consumed by the table columns in AdminAdvertisementsPage — a
 * single source of truth so a future field shows up in both views with a
 * one-line change.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Pencil, Trash2, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@shared/auth/Can";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import type { Advertisement } from "../types";

/** Best-effort hostname for the deepLink chip; falls back to the raw link. */
function getLinkHost(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

interface AdvertisementCardProps {
  advertisement: Advertisement;
  onEdit: (advertisement: Advertisement) => void;
  onDelete: (advertisement: Advertisement) => void;
  onToggleActive: (advertisement: Advertisement, isActive: boolean) => void;
  isToggling?: boolean;
}

export function AdvertisementCard({
  advertisement,
  onEdit,
  onDelete,
  onToggleActive,
  isToggling = false,
}: AdvertisementCardProps) {
  const { t, i18n } = useTranslation();
  const [imageBroken, setImageBroken] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-[var(--shadow-1)] transition-all duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-surface-2)]">
        {advertisement.image && !imageBroken ? (
          <img
            src={advertisement.image}
            alt={advertisement.title}
            onError={() => setImageBroken(true)}
            className="h-full w-full object-cover transition-transform duration-200 motion-reduce:transition-none group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--color-muted)]">
            <ImageOff className="h-8 w-8" aria-hidden />
            <span className="text-xs">{t("superAdmin.ads.card.noImage")}</span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
          <Badge tone={advertisement.isActive ? "success" : "neutral"}>
            {advertisement.isActive
              ? t("superAdmin.ads.status.active")
              : t("superAdmin.ads.status.inactive")}
          </Badge>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 p-2 opacity-0 transition-opacity duration-150 motion-reduce:transition-none focus-within:opacity-100 group-hover:opacity-100">
          <Can permission="ads.edit">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => onEdit(advertisement)}
              aria-label={t("common.edit")}
            >
              <Pencil className="size-4" />
            </Button>
          </Can>
          <Can permission="ads.delete">
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={() => onDelete(advertisement)}
              aria-label={t("common.delete")}
            >
              <Trash2 className="size-4" />
            </Button>
          </Can>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-[var(--color-ink-body)]">
          {advertisement.title}
        </h3>

        <a
          href={advertisement.deepLink}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          aria-label={t("superAdmin.ads.card.openLink", { host: getLinkHost(advertisement.deepLink) })}
          className="inline-flex w-fit max-w-full items-center gap-1 truncate rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-xs text-[var(--color-brand-blue)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-brand-blue)_10%,var(--color-surface-2))]"
        >
          <ExternalLink className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{getLinkHost(advertisement.deepLink)}</span>
        </a>

        <div className="mt-1 flex items-center justify-between border-t border-[var(--color-divider)] pt-3">
          <span className="text-xs tabular-nums text-[var(--color-muted)]">
            {formatOrderDate(advertisement.createdAt, i18n.language)}
          </span>

          <Can permission="ads.edit" fallback={null}>
            <label className="flex items-center gap-2">
              <span className="sr-only">{t("superAdmin.ads.card.quickToggleLabel")}</span>
              <Switch
                size="sm"
                checked={advertisement.isActive}
                disabled={isToggling}
                onCheckedChange={(checked) => onToggleActive(advertisement, checked)}
                aria-label={t("superAdmin.ads.card.quickToggleLabel")}
              />
            </label>
          </Can>
        </div>
      </div>
    </div>
  );
}

/** Loading placeholder matching {@link AdvertisementCard}'s layout. */
export function AdvertisementCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-[var(--shadow-1)]">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <div className="mt-1 flex items-center justify-between border-t border-[var(--color-divider)] pt-3">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
