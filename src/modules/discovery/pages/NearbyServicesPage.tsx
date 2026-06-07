import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Map as MapIcon, List, MapPin } from "lucide-react";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { useAppDispatch, useAppSelector } from "@app/store";
import {
  setViewMode,
  type ViewMode,
} from "../store/discoverySlice";
import { useGeolocation } from "../hooks/useGeolocation";
import { useNearbySearchQuery, useFavoritesQuery } from "../hooks/useDiscoveryQueries";
import { setFavorites } from "../store/discoverySlice";
import {
  NearbyFilters,
  NearbyFiltersDrawer,
  MobileFiltersButton,
  ActiveFiltersStrip,
} from "../components/NearbyFilters";
import { NearbyProviderCard } from "../components/NearbyProviderCard";
import { ProviderMapView } from "../components/ProviderMapView";
import { OriginPicker } from "../components/OriginPicker";
import { EmptyNearbyState } from "../components/EmptyNearbyState";
import { cn } from "@shared/lib/utils";

/**
 * /app/services/nearby — customer-facing nearby search.
 *
 * Layout:
 *  - mobile/tablet: stacked. Origin picker → results → filters drawer
 *    (opened by floating button).
 *  - desktop (lg+): two-column. Filters sidebar (sticky) on the start
 *    side, results grid + map on the end side.
 *
 * Behaviour:
 *  - On mount: try geolocation; on denial fall back to Riyadh.
 *  - Live query: `useNearbySearchQuery` watches Redux filters and the
 *    resolved origin, only enabled once an origin is set.
 *  - View mode toggle: list (default) or map. Persisted in Redux so
 *    the choice survives navigation.
 *  - Active filter strip + reset for one-tap clearing.
 */
export function NearbyServicesPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.discovery.filters);
  const viewMode = useAppSelector((s) => s.discovery.viewMode);
  const geo = useAppSelector((s) => s.discovery.geolocation);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const { request: requestGeo } = useGeolocation();

  // Bootstrap origin once on mount (idempotent — geolocation hook
  // guards itself if it has already been resolved).
  useEffect(() => {
    if (filters.lat == null || filters.lng == null) {
      void requestGeo();
    }
    // We *intentionally* depend on the request fn only — running this
    // hook on every filter change would re-request geolocation.
  }, [requestGeo, filters.lat, filters.lng]);

  const query = useNearbySearchQuery(filters);
  const favoritesQ = useFavoritesQuery();

  // Mirror server favorites into Redux for the heart button.
  useEffect(() => {
    if (favoritesQ.data) {
      dispatch(setFavorites(favoritesQ.data.map((f) => f.providerId)));
    }
  }, [favoritesQ.data, dispatch]);

  const origin = useMemo(
    () =>
      filters.lat != null && filters.lng != null
        ? { lat: filters.lat, lng: filters.lng }
        : null,
    [filters.lat, filters.lng],
  );

  const isReady = !!origin;

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
            {t("discovery.title")}
          </h1>
          <p className="text-sm text-ink-500 mt-1">{t("discovery.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <ViewModeSwitcher value={viewMode} onChange={(v) => dispatch(setViewMode(v))} />
          <MobileFiltersButton onOpen={() => setDrawerOpen(true)} />
        </div>
      </header>

      <OriginPicker />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Filters — desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 bg-white border border-ink-200 rounded-[var(--radius-lg)] p-5 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <NearbyFilters />
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <ActiveFiltersStrip />

          {!isReady && geo === "requesting" && (
            <LoadingState message={t("discovery.locating")} />
          )}

          {isReady && query.isLoading && <LoadingState message={t("common.loading")} />}

          {query.isError && (
            <ErrorState
              title={t("discovery.errorTitle")}
              description={t("discovery.errorDescription")}
              onRetry={() => void query.refetch()}
            />
          )}

          {isReady && query.data && query.data.length === 0 && <EmptyNearbyState />}

          {isReady && query.data && query.data.length > 0 && (
            <>
              <div className="flex items-center justify-between text-xs sm:text-sm text-ink-500">
                <span>
                  {t("discovery.resultCount", { count: query.data.length })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {t("discovery.filters.radiusValueKm", { km: filters.radiusKm })}
                </span>
              </div>

              {viewMode === "list" ? (
                <ResultsGrid providers={query.data} />
              ) : (
                origin && (
                  <ProviderMapView
                    origin={origin}
                    providers={query.data}
                    radiusKm={filters.radiusKm}
                  />
                )
              )}
            </>
          )}
        </main>
      </div>

      <NearbyFiltersDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

function ResultsGrid({ providers }: { providers: Parameters<typeof NearbyProviderCard>[0]["provider"][] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {providers.map((p) => (
        <li key={p.id}>
          <NearbyProviderCard provider={p} />
        </li>
      ))}
    </ul>
  );
}

function ViewModeSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex rounded-[var(--radius-sm)] border border-ink-200 bg-white overflow-hidden">
      <ToggleBtn active={value === "list"} onClick={() => onChange("list")} label={t("discovery.viewList")}>
        <List className="h-4 w-4" />
      </ToggleBtn>
      <ToggleBtn active={value === "map"} onClick={() => onChange("map")} label={t("discovery.viewMap")}>
        <MapIcon className="h-4 w-4" />
      </ToggleBtn>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "px-3 h-9 inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
        active ? "bg-brand-50 text-brand-600" : "text-ink-700 hover:bg-ink-100",
      )}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}


