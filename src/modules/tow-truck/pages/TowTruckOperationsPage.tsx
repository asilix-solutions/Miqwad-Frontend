import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Network,
  RefreshCw,
  Route,
  Truck,
  Search,
} from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Button } from "@/components/ui/button";
import { useTowTruckDetail, useTowTruckQueue } from "../hooks/useTowTruckQueries";
import { TowTruckQuickPreviewDrawer } from "../components/TowTruckQuickPreviewDrawer";
import { TowTruckTable } from "../components/TowTruckTable";
import { TowTruckMobileList } from "../components/TowTruckMobileList";
import { TowTruckInterCityTable } from "../components/TowTruckInterCityTable";
import { TowTruckInterCityMobileList } from "../components/TowTruckInterCityMobileList";
import { TowTruckCorridorExplorer } from "../components/TowTruckCorridorExplorer";
import { TowTruckNetworkModal } from "../components/TowTruckNetworkModal";
import { useAvailableRoadsQuery } from "@modules/admin/hooks/useRoadsQueries";
import {
  TowTruckQueueSearchFilter,
  type TowTruckLocalFilterKey,
  type TowTruckLocalCounts,
} from "../components/TowTruckQueueSearchFilter";
import {
  resolveTowTruckWorkspace,
  workspaceToServiceType,
} from "../lib/towTruckWorkspace";
import { TowTruckOperationsNav } from "../components/TowTruckOperationsNav";
import { formatTowTruckSyncTime } from "../lib/towTruckDate";
import { readFailureMessage } from "../lib/assignmentFeedback";
import "../towTruck.css";

function Loading() {
  const { t } = useTranslation();
  return (
    <div className="tow-loading" role="status">
      <span className="sr-only">{t("towTruck.loading")}</span>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="tow-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

function ReadError({
  retry,
  stale = false,
  error,
}: {
  retry: () => void;
  stale?: boolean;
  error: unknown;
}) {
  const { t } = useTranslation();
  return (
    <div className="tow-read-error" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <div>
        <strong>{t(`towTruck.${stale ? "stale" : "errorTitle"}`)}</strong>
        <p>{t(`towTruck.${readFailureMessage(error)}`)}</p>
        <Button variant="outline" size="sm" onClick={retry}>
          {t("towTruck.retry")}
        </Button>
      </div>
    </div>
  );
}

export function TowTruckOperationsPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeLocalFilter, setActiveLocalFilter] = useState<TowTruckLocalFilterKey>("all");

  const [params, setParams] = useSearchParams();

  const workspace = resolveTowTruckWorkspace(location.pathname);
  const numericServiceType = workspaceToServiceType(workspace);

  const [selectedCorridorId, setSelectedCorridorId] = useState<number | null>(null);
  const [prevWorkspace, setPrevWorkspace] = useState(workspace);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const availableRoadsQuery = useAvailableRoadsQuery();

  if (prevWorkspace !== workspace) {
    setPrevWorkspace(workspace);
    setSelectedCorridorId(null);
  }

  // Backward-compatibility: redirect legacy ?serviceType=intracity or ?serviceType=intercity
  useEffect(() => {
    const rawServiceType = params.get("serviceType");
    if (rawServiceType === "intracity" || rawServiceType === "intercity") {
      const nextParams = new URLSearchParams(params);
      nextParams.delete("serviceType");
      const qs = nextParams.toString();
      navigate(`/admin/tow-truck/${rawServiceType}${qs ? `?${qs}` : ""}`, {
        replace: true,
      });
    }
  }, [params, navigate]);

  const previewId = params.get("preview") || params.get("orderId");
  const validPreviewId =
    !!previewId && /^[1-9]\d*$/.test(previewId) && Number.isSafeInteger(Number(previewId));

  const requestedPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const trackSearch = params.get("trackNumber") ?? "";

  const queue = useTowTruckQueue(page, trackSearch, numericServiceType);
  const detail = useTowTruckDetail(validPreviewId ? previewId : undefined);

  const queueRef = useRef<HTMLDivElement>(null);
  const queueHeading = useRef<HTMLHeadingElement>(null);
  const returnTarget = useRef<string | undefined>(undefined);
  const scrollPosition = useRef(0);
  const totalPages = Math.max(1, queue.data?.totalPages ?? 1);
  const updating = queue.isFetching || detail.isFetching;
  const updatedAt = queue.dataUpdatedAt;

  const syncTime = formatTowTruckSyncTime(updatedAt, i18n.language);
  const updatedText = syncTime
    ? t("towTruck.updated", { time: syncTime })
    : t("towTruck.notUpdated");

  useEffect(() => {
    if (
      queue.data &&
      !queue.isPlaceholderData &&
      !queue.isError &&
      page > Math.max(1, queue.data.totalPages)
    ) {
      const next = new URLSearchParams(params);
      next.set("page", String(Math.max(1, queue.data.totalPages)));
      setParams(next, { replace: true });
    }
  }, [queue.data, queue.isPlaceholderData, queue.isError, page, params, setParams]);

  const restoreQueueFocus = () => {
    const row = queueRef.current?.querySelector<HTMLElement>(
      `[data-order-id="${returnTarget.current}"]`,
    );
    (row ?? queueHeading.current)?.focus({ preventScroll: true });
    window.scrollTo({ top: scrollPosition.current, behavior: "instant" });
  };

  const refresh = () => {
    void queue.refetch();
    if (validPreviewId) void detail.refetch();
  };

  const changePage = (value: number) => {
    const next = new URLSearchParams(params);
    if (value > 1) next.set("page", String(value));
    else next.delete("page");
    setParams(next);
    queueHeading.current?.focus({ preventScroll: true });
    queueRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  };

  const handleTrackSearchSubmit = (value: string) => {
    const next = new URLSearchParams(params);
    if (value.trim()) {
      next.set("trackNumber", value.trim());
    } else {
      next.delete("trackNumber");
    }
    next.delete("page");
    setParams(next);
  };

  const handleTrackSearchClear = () => {
    const next = new URLSearchParams(params);
    next.delete("trackNumber");
    next.delete("page");
    setParams(next);
  };

  const rawItems = useMemo(() => queue.data?.items ?? [], [queue.data?.items]);

  const previewOrder = useMemo(() => {
    if (!previewId || !validPreviewId) return null;
    return detail.data ?? rawItems.find((o) => o.id === previewId) ?? null;
  }, [previewId, validPreviewId, detail.data, rawItems]);

  const localCounts: TowTruckLocalCounts = useMemo(
    () => ({
      all: rawItems.length,
      unassigned: rawItems.filter((o) => o.assignment === "unassigned").length,
      assigned: rawItems.filter((o) => o.assignment === "assigned").length,
      paid: rawItems.filter((o) => o.paymentStatus === "Paid").length,
      attention: rawItems.filter((o) => o.stage === "checkDetails").length,
    }),
    [rawItems],
  );

  const displayedOrders = useMemo(() => {
    switch (activeLocalFilter) {
      case "unassigned":
        return rawItems.filter((o) => o.assignment === "unassigned");
      case "assigned":
        return rawItems.filter((o) => o.assignment === "assigned");
      case "paid":
        return rawItems.filter((o) => o.paymentStatus === "Paid");
      case "attention":
        return rawItems.filter((o) => o.stage === "checkDetails");
      default:
        return rawItems;
    }
  }, [rawItems, activeLocalFilter]);

  const handleSelectOrder = (id: string) => {
    scrollPosition.current = window.scrollY;
    returnTarget.current = id;
    const next = new URLSearchParams(params);
    next.set("preview", id);
    setParams(next);
  };

  const handleClosePreview = () => {
    const next = new URLSearchParams(params);
    next.delete("preview");
    next.delete("orderId");
    setParams(next, { replace: true });
    restoreQueueFocus();
  };

  const subtitleText =
    workspace === "intracity"
      ? t("towTruck.subtitleIntraCity")
      : workspace === "intercity"
      ? t("towTruck.subtitleInterCity")
      : t("towTruck.subtitleAll");

  return (
    <div className="tow-workspace" dir={i18n.dir()}>
      {/* Contextual Breadcrumb */}
      <nav
        aria-label={t("towTruck.breadcrumbLabel")}
        className="flex items-center gap-1.5 text-xs text-ink-500 mb-2 select-none"
      >
        <Link
          to="/admin/dashboard"
          className="hover:text-ink-900 transition-colors"
        >
          {t("towTruck.breadcrumbDashboard")}
        </Link>
        <ChevronLeft
          size={12}
          className="rtl:rotate-0 rotate-180 text-ink-400 shrink-0"
          aria-hidden="true"
        />
        <Link
          to="/admin/tow-truck"
          className={cn(
            "transition-colors",
            workspace === "all"
              ? "font-semibold text-ink-900 pointer-events-none"
              : "hover:text-ink-900",
          )}
          aria-current={workspace === "all" ? "page" : undefined}
        >
          {t("towTruck.breadcrumbTowTruck")}
        </Link>
        {workspace !== "all" && (
          <>
            <ChevronLeft
              size={12}
              className="rtl:rotate-0 rotate-180 text-ink-400 shrink-0"
              aria-hidden="true"
            />
            <span
              className="font-semibold text-[var(--color-brand-blue)]"
              aria-current="page"
            >
              {workspace === "intracity"
                ? t("towTruck.navIntraCityBadge")
                : t("towTruck.navInterCityBadge")}
            </span>
          </>
        )}
      </nav>

      {/* Compact Contextual Header */}
      {workspace === "intercity" ? (
        <header className="tow-page-header">
          <div className="tow-page-heading">
            <div className="tow-brand-icon bg-[var(--color-brand-blue)]">
              <Route size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-brand-blue)]">
                  {t("towTruck.interCityHeaderTitle")}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs bg-blue-50 border-blue-200 text-blue-800">
                  <Route size={12} className="shrink-0 text-blue-600" aria-hidden="true" />
                  <span>{t("towTruck.navInterCityBadge")}</span>
                </span>
              </div>
              <p className="tow-subtitle">{t("towTruck.interCityHeaderSubtitle")}</p>
            </div>
          </div>
          <div className="tow-page-actions flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNetworkModalOpen(true)}
              className="h-8 text-xs font-semibold text-[var(--color-brand-blue)] border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 gap-1.5"
              aria-label={t("towTruck.viewNetworkAriaLabel")}
            >
              <Network size={14} className="text-blue-600 shrink-0" aria-hidden="true" />
              <span>{t("towTruck.viewNetwork")}</span>
            </Button>
            <Link
              to="/admin/reference?tab=routes"
              className="tow-general-link inline-flex items-center gap-1.5"
            >
              <Route size={14} aria-hidden="true" />
              <span>{t("towTruck.intercityRoutesAdmin")}</span>
            </Link>
            <Link to="/admin/orders" className="tow-general-link">
              <span>{t("towTruck.allOrders")}</span>
            </Link>
          </div>
        </header>
      ) : (
        <header className="tow-page-header">
          <div className="tow-page-heading">
            <div className="tow-brand-icon">
              <Truck size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-brand-blue)]">
                  {t("towTruck.title")}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs",
                    workspace === "intracity"
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-ink-100/70 border-ink-200 text-ink-700",
                  )}
                >
                  {workspace === "intracity" ? (
                    <MapPin size={12} className="shrink-0 text-amber-600" aria-hidden="true" />
                  ) : (
                    <Truck size={12} className="shrink-0 text-ink-500" aria-hidden="true" />
                  )}
                  <span>
                    {workspace === "intracity"
                      ? t("towTruck.navIntraCityBadge")
                      : t("towTruck.navAllBadge")}
                  </span>
                </span>
              </div>
              <p className="tow-subtitle">{subtitleText}</p>
            </div>
          </div>
          <div className="tow-page-actions flex items-center gap-2">
            <Link
              to="/admin/reference?tab=routes"
              className="tow-general-link inline-flex items-center gap-1.5"
            >
              <Route size={14} aria-hidden="true" />
              <span>{t("towTruck.intercityRoutesAdmin")}</span>
            </Link>
            <Link to="/admin/orders" className="tow-general-link">
              <span>{t("towTruck.allOrders")}</span>
            </Link>
          </div>
        </header>
      )}

      {/* Mobile Workspace Switcher: 1-tap switching without opening drawer, hidden on desktop where AdminSidebar is primary */}
      <TowTruckOperationsNav
        activeWorkspace={workspace}
        trackSearch={trackSearch}
        className="mb-3.5 lg:hidden"
      />

      {/* InterCity Corridor Exploration Layer (Phase 2C.2) */}
      {workspace === "intercity" && (
        <TowTruckCorridorExplorer
          selectedCorridorId={selectedCorridorId}
          onSelectCorridor={setSelectedCorridorId}
          onOpenNetworkView={() => setIsNetworkModalOpen(true)}
        />
      )}

      <div className="tow-workbench">
        <section
          ref={queueRef}
          className="tow-queue-panel"
          aria-labelledby="tow-queue-heading"
        >
          <div className="tow-queue-header">
            <div>
              <h2 id="tow-queue-heading" ref={queueHeading} tabIndex={-1}>
                {t("towTruck.queue")}
              </h2>
              <p className="tow-queue-caption">
                {t("towTruck.queueCaption", {
                  total: queue.data?.total ?? 0,
                  batch: queue.data?.items.length ?? 0,
                })}
              </p>
            </div>
            <div className="tow-queue-actions">
              <span className="tow-queue-sync" role="status">
                {queue.isFetching ? t("towTruck.syncing") : updatedText}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={updating}
                onClick={refresh}
                aria-label={t("towTruck.refreshQueue")}
              >
                <RefreshCw
                  size={15}
                  className={updating ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                <span>{t("towTruck.refresh")}</span>
              </Button>
            </div>
          </div>



          {/* Search & Local Filter Bar */}
          <TowTruckQueueSearchFilter
            trackSearchValue={trackSearch}
            onTrackSearchSubmit={handleTrackSearchSubmit}
            onTrackSearchClear={handleTrackSearchClear}
            isSearching={queue.isFetching}
            activeLocalFilter={activeLocalFilter}
            onLocalFilterChange={setActiveLocalFilter}
            localCounts={localCounts}
          />

          <div className="tow-queue-content">
            {queue.isError && (
              <ReadError retry={refresh} stale={!!queue.data} error={queue.error} />
            )}

            {queue.isPending ? (
              <Loading />
            ) : rawItems.length > 0 && displayedOrders.length > 0 ? (
              workspace === "intercity" ? (
                <>
                  {/* Desktop View: Specialized InterCity Operations Table */}
                  <TowTruckInterCityTable
                    orders={displayedOrders}
                    selectedOrderId={previewId ?? undefined}
                    onSelectOrder={handleSelectOrder}
                    className="hidden md:block"
                  />

                  {/* Mobile View: Specialized InterCity Operations Cards */}
                  <TowTruckInterCityMobileList
                    orders={displayedOrders}
                    selectedOrderId={previewId ?? undefined}
                    onSelectOrder={handleSelectOrder}
                    className="md:hidden"
                  />
                </>
              ) : (
                <>
                  {/* Desktop View: Operations Table */}
                  <TowTruckTable
                    orders={displayedOrders}
                    selectedOrderId={previewId ?? undefined}
                    onSelectOrder={handleSelectOrder}
                    className="hidden md:block"
                  />

                  {/* Mobile View: Operations Cards */}
                  <TowTruckMobileList
                    orders={displayedOrders}
                    selectedOrderId={previewId ?? undefined}
                    onSelectOrder={handleSelectOrder}
                    className="md:hidden"
                  />
                </>
              )
            ) : rawItems.length > 0 && displayedOrders.length === 0 ? (
              /* Local Filter Zero State */
              <div className="tow-empty py-12 text-center">
                <AlertCircle size={32} className="mx-auto text-ink-400 mb-2" aria-hidden="true" />
                <h3 className="font-semibold text-ink-800 text-sm">{t("towTruck.noFilterResults")}</h3>
                <p className="text-xs text-ink-500 mt-1 mb-4">
                  {t("towTruck.localFilterScope", { count: localCounts.all })}
                </p>
                <Button variant="outline" size="sm" onClick={() => setActiveLocalFilter("all")}>
                  {t("towTruck.resetFilter")}
                </Button>
              </div>
            ) : (
              !queue.isError && (
                /* Global, Service-Type, or Search Zero State */
                <div className="tow-empty py-12 text-center">
                  {workspace !== "all" ? (
                    <>
                      <Route size={32} className="mx-auto text-ink-400 mb-2" aria-hidden="true" />
                      <h3 className="font-semibold text-ink-800 text-sm">
                        {t("towTruck.noServiceFilterResults")}
                      </h3>
                      <p className="text-xs text-ink-500 mt-1 mb-4">
                        {t("towTruck.emptyHint")}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            trackSearch
                              ? `/admin/tow-truck?trackNumber=${encodeURIComponent(trackSearch)}`
                              : "/admin/tow-truck",
                          )
                        }
                      >
                        {t("towTruck.resetFilter")}
                      </Button>
                    </>
                  ) : trackSearch ? (
                    <>
                      <Search size={32} className="mx-auto text-ink-400 mb-2" aria-hidden="true" />
                      <h3 className="font-semibold text-ink-800 text-sm">
                        {t("towTruck.noSearchResults")}
                      </h3>
                      <p className="text-xs text-ink-500 mt-1 mb-4">
                        <bdi>{trackSearch}</bdi>
                      </p>
                      <Button variant="outline" size="sm" onClick={handleTrackSearchClear}>
                        {t("towTruck.clearSearch")}
                      </Button>
                    </>
                  ) : page > 1 ? (
                    <>
                      <Truck size={32} className="mx-auto text-ink-400 mb-2" aria-hidden="true" />
                      <h3 className="font-semibold text-ink-800 text-sm">{t("towTruck.emptyPage")}</h3>
                      <p className="text-xs text-ink-500 mt-1 mb-4">{t("towTruck.emptyHint")}</p>
                      <Button variant="outline" size="sm" onClick={() => changePage(1)}>
                        {t("towTruck.firstPage")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Truck size={32} className="mx-auto text-ink-400 mb-2" aria-hidden="true" />
                      <h3 className="font-semibold text-ink-800 text-sm">{t("towTruck.emptyTitle")}</h3>
                      <p className="text-xs text-ink-500 mt-1">{t("towTruck.emptyHint")}</p>
                    </>
                  )}
                </div>
              )
            )}
          </div>

          {/* Pagination */}
          {queue.data && totalPages > 1 && (
            <nav className="tow-pagination" aria-label={t("towTruck.pagination")}>
              <Button
                variant="ghost"
                size="icon"
                disabled={page <= 1 || queue.isFetching}
                aria-label={t("towTruck.previous")}
                onClick={() => changePage(page - 1)}
              >
                <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
              </Button>
              <span>{t("towTruck.pageOf", { page, total: totalPages })}</span>
              <Button
                variant="ghost"
                size="icon"
                disabled={page >= totalPages || queue.isFetching}
                aria-label={t("towTruck.next")}
                onClick={() => changePage(page + 1)}
              >
                <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
              </Button>
            </nav>
          )}
        </section>

        {/* Quick Preview Drawer */}
        <TowTruckQuickPreviewDrawer
          open={validPreviewId}
          order={previewOrder}
          isLoading={validPreviewId && detail.isPending && !previewOrder}
          isError={validPreviewId && (detail.isError || (!detail.isPending && !previewOrder))}
          onClose={handleClosePreview}
          onRefresh={() => void detail.refetch()}
          isRefreshing={detail.isFetching}
        />
      </div>

      {/* On-Demand InterCity Transport Network Modal (Phase 2C.2) */}
      {workspace === "intercity" && (
        <TowTruckNetworkModal
          open={isNetworkModalOpen}
          onClose={() => setIsNetworkModalOpen(false)}
          roads={availableRoadsQuery.data ?? []}
          selectedCorridorId={selectedCorridorId}
          onSelectCorridor={setSelectedCorridorId}
        />
      )}
    </div>
  );
}
