import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MapPin, Star, ShieldCheck, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { NearbyProvider } from "../types";
import { FavoriteButton } from "./FavoriteButton";

interface Props {
  provider: NearbyProvider;
  /** When true, the card is rendered with reduced padding for the map popover. */
  compact?: boolean;
  className?: string;
}

/**
 * Card used in the nearby search list/grid and as the map popover body.
 *
 * Layout decisions:
 *  - 1 col on mobile, 2 on `sm`, 3 on `xl` — handled by the list parent.
 *  - Card itself is fully fluid so it works in either grid or stacked layout.
 *  - Favourite button positioned in the top corner; clicking it never
 *    navigates (handled by FavoriteButton via stopPropagation).
 */
export function NearbyProviderCard({ provider, compact, className }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  return (
    <Link
      to={`/app/services/providers/${provider.id}`}
      className={cn(
        "group block bg-white rounded-[var(--radius-lg)] border border-ink-200 hover:border-brand-300 hover:shadow-[var(--shadow-2)] transition-all",
        compact ? "p-3" : "p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Avatar / initial */}
          <div className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-[var(--radius-md)] bg-brand-50 text-brand-600 flex items-center justify-center font-display font-semibold text-lg">
            {provider.companyName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-base sm:text-lg font-semibold text-ink-900 truncate">
                {provider.companyName}
              </h3>
              {provider.isVerified && (
                <span
                  className="inline-flex items-center text-info-500"
                  title={t("discovery.verified")}
                  aria-label={t("discovery.verified")}
                >
                  <ShieldCheck className="h-4 w-4" />
                </span>
              )}
            </div>
            {provider.city && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm text-ink-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{provider.city}</span>
                <span className="text-ink-300" aria-hidden>•</span>
                <span className="whitespace-nowrap">
                  {t("discovery.distanceKm", { km: provider.distanceKm.toFixed(1) })}
                </span>
              </p>
            )}
          </div>
        </div>

        <FavoriteButton providerId={provider.id} size="sm" />
      </div>

      <div className="mt-3 flex items-center gap-3 flex-wrap text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1 text-warning-500 font-semibold">
          <Star className="h-4 w-4 fill-current" />
          {provider.rating > 0 ? provider.rating.toFixed(1) : t("discovery.noRating")}
          {provider.totalRatings > 0 && (
            <span className="text-ink-400 font-normal">
              ({provider.totalRatings})
            </span>
          )}
        </span>

        {provider.isOpenNow ? (
          <Badge tone="success" size="sm">
            <Clock className="h-3 w-3" />
            {t("discovery.openNow")}
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            <Clock className="h-3 w-3" />
            {t("discovery.closedNow")}
          </Badge>
        )}

        {provider.priceFrom != null && (
          <span className="ms-auto text-ink-700">
            <span className="text-ink-400">{t("discovery.priceFrom")}</span>{" "}
            <span className="font-semibold">
              {t("common.priceSar", { amount: provider.priceFrom })}
            </span>
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-ink-400">
          {t("discovery.viewDetails")}
        </span>
        <Chevron className="h-4 w-4 text-ink-300 group-hover:text-brand-500 transition-colors" aria-hidden />
      </div>
    </Link>
  );
}
