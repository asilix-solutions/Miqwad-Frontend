import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useFavoritesQuery, useNearbySearchQuery } from "../hooks/useDiscoveryQueries";
import { NearbyProviderCard } from "../components/NearbyProviderCard";
import { FALLBACK_ORIGIN } from "../types";
import { useAppDispatch, useAppSelector } from "@app/store";
import { setFavorites } from "../store/discoverySlice";

/**
 * /app/favorites — list of providers the current user has favorited.
 *
 * Implementation note:
 *  - The favorites endpoint returns only providerIds. To render rich
 *    cards we piggy-back on the existing nearby search (using a very
 *    wide radius around the fallback origin) and then filter to the
 *    favorited set. This is intentional so we keep the favorites
 *    endpoint thin server-side; we can move to a dedicated
 *    `/favorites/providers` endpoint later without changing the UI.
 *
 * Responsive layout: same grid breakpoints as the nearby page.
 */
export function FavoritesPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const favoriteIds = useAppSelector((s) => s.discovery.favoriteIds);
  const favoritesQ = useFavoritesQuery();

  // Mirror the server favorites into Redux on load.
  useEffect(() => {
    if (favoritesQ.data) {
      dispatch(setFavorites(favoritesQ.data.map((f) => f.providerId)));
    }
  }, [favoritesQ.data, dispatch]);

  // Wide search so we fetch enough data to render each favorited card.
  // 200km radius around Riyadh covers all KSA seed data; for real users
  // the backend can answer this server-side.
  const wideSearch = useNearbySearchQuery({
    lat: FALLBACK_ORIGIN.lat,
    lng: FALLBACK_ORIGIN.lng,
    radiusKm: 200,
    categoryId: null,
    minRating: 0,
    priceBand: null,
    openNowOnly: false,
    q: "",
  });

  const cards = useMemo(() => {
    if (!wideSearch.data) return [];
    return wideSearch.data.filter((p) => favoriteIds.includes(p.id));
  }, [wideSearch.data, favoriteIds]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
          {t("discovery.favorites.title")}
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          {t("discovery.favorites.subtitle")}
        </p>
      </header>

      {(favoritesQ.isLoading || wideSearch.isLoading) && <LoadingState />}

      {(favoritesQ.isError || wideSearch.isError) && (
        <ErrorState
          title={t("common.errorTitle")}
          description={t("common.errorRetry")}
          onRetry={() => {
            void favoritesQ.refetch();
            void wideSearch.refetch();
          }}
        />
      )}

      {!favoritesQ.isLoading && !wideSearch.isLoading && cards.length === 0 && (
        <EmptyState
          icon={<Heart className="h-6 w-6 text-ink-500" />}
          title={t("discovery.favorites.empty.title")}
          description={t("discovery.favorites.empty.description")}
          action={
            <Button asChild>
              <Link to="/app/services/nearby">
                {t("discovery.favorites.empty.cta")}
              </Link>
            </Button>
          }
        />
      )}

      {cards.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {cards.map((p) => (
            <li key={p.id}>
              <NearbyProviderCard provider={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
