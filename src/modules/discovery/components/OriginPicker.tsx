import { useTranslation } from "react-i18next";
import { MapPin, Crosshair } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@app/store";
import { setOrigin } from "../store/discoverySlice";
import { useGeolocation } from "../hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { KSA_CITIES } from "../types";
import { cn } from "@shared/lib/utils";

/**
 * Compact origin picker — surfaces the resolved search origin and lets
 * the user re-trigger geolocation or switch to a major Saudi city
 * (handy fallback when GPS is denied or unavailable).
 *
 * Visible at the top of the search page and inside the filters drawer.
 */
export function OriginPicker() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const f = useAppSelector((s) => s.discovery.filters);
  const geo = useAppSelector((s) => s.discovery.geolocation);
  const { request } = useGeolocation();
  const isAr = i18n.language === "ar";

  const currentCityKey = KSA_CITIES.find((c) => Math.abs(c.lat - (f.lat ?? 0)) < 0.05 && Math.abs(c.lng - (f.lng ?? 0)) < 0.05)?.key;

  return (
    <div className="rounded-[var(--radius-lg)] bg-white border border-ink-200 p-4">
      <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info-50 text-info-500 shrink-0">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-ink-500">
            {t("discovery.origin.searchingFrom")}
          </p>
          <p className="text-sm font-semibold text-ink-900 truncate">
            {currentCityKey
              ? isAr
                ? KSA_CITIES.find((c) => c.key === currentCityKey)?.nameAr
                : KSA_CITIES.find((c) => c.key === currentCityKey)?.nameEn
              : geo === "granted"
                ? t("discovery.origin.yourLocation")
                : t("discovery.origin.unknown")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void request()}
          disabled={geo === "requesting"}
        >
          <Crosshair className="h-4 w-4" />
          {geo === "requesting"
            ? t("discovery.origin.locating")
            : t("discovery.origin.useMyLocation")}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {KSA_CITIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => dispatch(setOrigin({ lat: c.lat, lng: c.lng }))}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              currentCityKey === c.key
                ? "bg-brand-50 border-brand-500 text-brand-600"
                : "bg-white border-ink-200 text-ink-700 hover:border-brand-300",
            )}
          >
            {isAr ? c.nameAr : c.nameEn}
          </button>
        ))}
      </div>
    </div>
  );
}
