import { useTranslation } from "react-i18next";
import { MapPinOff } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { useAppDispatch } from "@app/store";
import { resetFilters, setRadius } from "../store/discoverySlice";

/**
 * Empty state for the nearby search page — shown when filters yield 0
 * results. Offers two recovery actions: widen the radius (50km) or
 * reset all filters.
 */
export function EmptyNearbyState() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-ink-200 bg-white p-8 sm:p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100">
        <MapPinOff className="h-6 w-6 text-ink-500" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-base font-semibold text-ink-900">
          {t("discovery.empty.title")}
        </h3>
        <p className="text-sm text-ink-500 max-w-sm">
          {t("discovery.empty.description")}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => dispatch(setRadius(50))}>
          {t("discovery.empty.widenRadius")}
        </Button>
        <Button variant="primary" size="sm" onClick={() => dispatch(resetFilters())}>
          {t("discovery.empty.resetFilters")}
        </Button>
      </div>
    </div>
  );
}
