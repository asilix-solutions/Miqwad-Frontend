import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@app/store";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTowTruckDetail, useTowTruckQueue, TOW_PAGE_SIZE } from "../hooks/useTowTruckQueries";
import { TowTruckQuickPreviewDrawer } from "../components/TowTruckQuickPreviewDrawer";
import { TowTruckTable, type TowTruckQueueDirection } from "../components/TowTruckTable";
import { TowTruckMobileList } from "../components/TowTruckMobileList";
import { TowTruckInterCityTable } from "../components/TowTruckInterCityTable";
import { TowTruckInterCityMobileList } from "../components/TowTruckInterCityMobileList";
import { TowTruckCorridorExplorer } from "../components/TowTruckCorridorExplorer";
import { TowTruckNetworkModal } from "../components/TowTruckNetworkModal";
import { useAvailableRoadsQuery } from "@modules/admin/hooks/useRoadsQueries";
import { TowTruckQueueSearchFilter } from "../components/TowTruckQueueSearchFilter";
import { resolveTowTruckWorkspace, workspaceToServiceType } from "../lib/towTruckWorkspace";
import { formatTowTruckSyncTime } from "../lib/towTruckDate";
import { readFailureMessage } from "../lib/assignmentFeedback";
import { driverOperationBlocks, initialOperationBlocks } from "../lib/driverOperationGuards";
import { cancellationBlocks } from "../lib/cancellationJournal";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { readQueueReturn, safeQueueUrl, restoreQueuePosition } from "../lib/queueContinuity";
import "../towTruck.css";

// Advisory copy only. This function cannot authorize assignment or resolve an outcome.
function queueAdvice(
  order: TowTruckOrder,
  held: boolean,
): { title: string; reason: string; tone: TowTruckQueueDirection["tone"] } {
  if (held) return { title: "qVerifyRecord", reason: "qSessionHold", tone: "warning" };
  if (order.dispatchService === "unknown")
    return { title: "qVerifyService", reason: "qUnverifiedService", tone: "warning" };
  if (order.status === "Canceled" || order.status === "Received")
    return { title: "qReviewClosed", reason: "qReadOnlyAdvice", tone: "muted" };
  if (order.dispatchService === "intracity" && order.assignment === "unassigned")
    return { title: "qAssignmentBlocked", reason: "qLocalEligibility", tone: "blocked" };
  if (order.assignment === "unknown" || !order.status)
    return { title: "qVerifyOrder", reason: "qIncompleteState", tone: "warning" };
  if (order.isInterCity ? !order.hasInterCityRoute : order.stage === "checkDetails")
    return { title: "qReviewLocation", reason: "qLocationEvidence", tone: "warning" };
  if (!order.vehicle) return { title: "qReviewVehicle", reason: "qReadOnlyAdvice", tone: "review" };
  if (order.assignment === "assigned")
    return {
      title: "qReviewState",
      reason: order.dispatchService === "intracity" ? "qLocalReplacement" : "qDriverRecorded",
      tone: "muted",
    };
  return { title: "qReviewAssignment", reason: "qEligibilityInDetails", tone: "review" };
}

function Loading() {
  const { t } = useTranslation();
  return (
    <div className="tow-empty" role="status">
      <p>{t("towTruck.loading")}</p>
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

// Reference browsing stays secondary and mounts its read queries only on demand.
function QueueReferences() {
  const [selectedCorridorId, setSelectedCorridorId] = useState<number | null>(null);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const roads = useAvailableRoadsQuery();
  return (
    <>
      <TowTruckCorridorExplorer
        selectedCorridorId={selectedCorridorId}
        onSelectCorridor={setSelectedCorridorId}
        onOpenNetworkView={() => setIsNetworkModalOpen(true)}
      />
      <TowTruckNetworkModal
        open={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        roads={roads.data ?? []}
        selectedCorridorId={selectedCorridorId}
        onSelectCorridor={setSelectedCorridorId}
      />
    </>
  );
}

export function TowTruckOperationsPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const workspace = resolveTowTruckWorkspace(location.pathname);
  const numericServiceType = workspaceToServiceType(workspace);
  const [referencesOpen, setReferencesOpen] = useState(false);

  useEffect(() => {
    const rawServiceType = params.get("serviceType");
    if (rawServiceType === "intracity" || rawServiceType === "intercity") {
      const next = new URLSearchParams(params);
      next.delete("serviceType");
      const qs = next.toString();
      navigate(`/admin/tow-truck/${rawServiceType}${qs ? `?${qs}` : ""}`, { replace: true });
    }
  }, [params, navigate]);

  const previewId = params.get("preview") || params.get("orderId");
  const validPreviewId =
    !!previewId && /^[1-9]\d*$/.test(previewId) && Number.isSafeInteger(Number(previewId));
  const requestedPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const trackSearch = params.get("trackNumber")?.trim() ?? "";
  const queue = useTowTruckQueue(page, trackSearch, numericServiceType);
  const detail = useTowTruckDetail(validPreviewId ? previewId : undefined);
  const queueRef = useRef<HTMLDivElement>(null);
  const queueHeading = useRef<HTMLHeadingElement>(null);
  const restoredEntry = useRef<string | null>(null);
  const interruptedEntry = useRef<string | null>(null);
  const queueUrl = safeQueueUrl(`${location.pathname}${location.search}`) ?? "/admin/tow-truck";
  const returnContext = useMemo(() => readQueueReturn(location.state), [location.state]);
  const focusQueueHeading =
    !!location.state &&
    typeof location.state === "object" &&
    location.state.focusQueueHeading === true;
  const totalPages = Math.max(1, queue.data?.totalPages ?? 1);
  const updating = queue.isFetching || detail.isFetching;
  const hasCurrentData = !!queue.data && !queue.isPlaceholderData && queue.data.page === page;
  const syncTime = hasCurrentData
    ? formatTowTruckSyncTime(queue.dataUpdatedAt, i18n.language)
    : null;
  const updatedText = syncTime
    ? t("towTruck.updated", { time: syncTime })
    : t("towTruck.notUpdated");

  useEffect(() => {
    if (
      queue.data &&
      !queue.isPlaceholderData &&
      !queue.isError &&
      !queue.isFetching &&
      page > Math.max(1, queue.data.totalPages)
    ) {
      const next = new URLSearchParams(params);
      next.set("page", String(Math.max(1, queue.data.totalPages)));
      setParams(next, { replace: true });
    }
  }, [
    queue.data,
    queue.isPlaceholderData,
    queue.isError,
    queue.isFetching,
    page,
    params,
    setParams,
  ]);

  const restoreQueueFocus = useCallback(() => {
    if (
      validPreviewId ||
      restoredEntry.current === location.key ||
      interruptedEntry.current === location.key ||
      document.querySelector('[data-tow-preview][data-state="open"]')
    )
      return;
    if (queue.isPending || queue.isPlaceholderData || (!hasCurrentData && !queue.isError)) return;
    const context = returnContext?.url === queueUrl ? returnContext : null;
    if (restoreQueuePosition(queueRef.current, queueHeading.current, context)) {
      if (!context && focusQueueHeading) window.scrollTo({ top: 0, behavior: "instant" });
      restoredEntry.current = location.key;
    }
  }, [
    validPreviewId,
    location.key,
    queue.isPending,
    queue.isPlaceholderData,
    queue.isError,
    hasCurrentData,
    returnContext,
    focusQueueHeading,
    queueUrl,
  ]);

  useEffect(() => {
    if (
      validPreviewId ||
      (!returnContext && !focusQueueHeading) ||
      (returnContext && returnContext.url !== queueUrl)
    )
      return;
    // Do not steal focus if the operator starts another task while the list is loading.
    const interrupt = () => {
      interruptedEntry.current = location.key;
    };
    document.addEventListener("pointerdown", interrupt, { once: true });
    document.addEventListener("keydown", interrupt, { once: true });
    const frame = requestAnimationFrame(restoreQueueFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", interrupt);
      document.removeEventListener("keydown", interrupt);
    };
  }, [validPreviewId, returnContext, focusQueueHeading, queueUrl, location.key, restoreQueueFocus]);

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
    if (value.trim()) next.set("trackNumber", value.trim());
    else next.delete("trackNumber");
    next.delete("page");
    setParams(next);
  };
  const handleTrackSearchClear = () => handleTrackSearchSubmit("");
  // Never label a previous query's placeholder rows as current matches.
  const rawItems = useMemo(
    () => (hasCurrentData ? (queue.data?.items ?? []) : []),
    [hasCurrentData, queue.data?.items],
  );
  const previewOrder = useMemo(
    () =>
      !previewId || !validPreviewId ? null : detail.data?.id === previewId ? detail.data : null,
    [previewId, validPreviewId, detail.data],
  );

  const actor = useAppSelector((state) => state.auth.user?.id) ?? "";
  const qc = useQueryClient();
  const subscribe = useCallback((notify: () => void) => qc.getQueryCache().subscribe(notify), [qc]);
  const heldIds = useSyncExternalStore(
    subscribe,
    () => {
      if (!actor) return "";
      const sessionHeld = driverOperationBlocks(qc, actor) || initialOperationBlocks(qc, actor);
      return rawItems
        .filter((order) => sessionHeld || cancellationBlocks(qc, actor, order.id))
        .map((order) => order.id)
        .join(",");
    },
    () => "",
  );
  const directions = useMemo(() => {
    const held = new Set(heldIds.split(","));
    return Object.fromEntries(
      rawItems.map((order) => {
        const advice = queueAdvice(order, held.has(order.id));
        return [
          order.id,
          {
            ...advice,
            title: t(`towTruck.${advice.title}`),
            reason: t(`towTruck.${advice.reason}`),
          },
        ];
      }),
    );
  }, [rawItems, heldIds, t]);

  const handleSelectOrder = (id: string) => {
    const context = {
      url: queueUrl,
      orderId: id,
      control: "preview" as const,
      scrollY: window.scrollY,
    };
    // Both the underlying queue and the modal entry can restore on browser Back/Forward.
    navigate(queueUrl, { replace: true, state: { towQueueReturn: context } });
    const next = new URLSearchParams(queueUrl.split("?")[1]);
    next.set("preview", id);
    navigate(`${queueUrl.split("?")[0]}?${next}`, { state: { towQueueReturn: context } });
  };
  const handleClosePreview = () => {
    const context =
      returnContext?.url === queueUrl
        ? returnContext
        : validPreviewId
          ? {
              url: queueUrl,
              orderId: previewId,
              control: "preview" as const,
              scrollY: window.scrollY,
            }
          : null;
    navigate(queueUrl, { replace: true, state: { towQueueReturn: context } });
  };
  const listProps = {
    orders: rawItems,
    directions,
    fromQueue: queueUrl,
    selectedOrderId: previewId ?? undefined,
    onSelectOrder: handleSelectOrder,
  };
  const queueTitle = t(
    `towTruck.${workspace === "all" ? "qAllRequests" : workspace === "intracity" ? "navIntraCityBadge" : "navInterCityBadge"}`,
  );
  return (
    <div className="tow-workspace tow-queue-page" dir={i18n.dir()}>
      <header className="tow-q-heading">
        <h1>{t("towTruck.qOperationsTitle")}</h1>
      </header>

      <div className="tow-workbench">
        <section ref={queueRef} className="tow-queue-panel" aria-labelledby="tow-queue-heading">
          <div className="tow-q-tools">
            <div>
              <h2 id="tow-queue-heading" ref={queueHeading} tabIndex={-1}>
                {queueTitle}
              </h2>
              <p className="tow-q-minor">
                {t("towTruck.qNewestFirst")} ·{" "}
                <a href="#tow-queue-pages">{t("towTruck.qPageOptions")}</a>
              </p>
            </div>
            <TowTruckQueueSearchFilter
              trackSearchValue={trackSearch}
              onTrackSearchSubmit={handleTrackSearchSubmit}
              onTrackSearchClear={handleTrackSearchClear}
              isSearching={queue.isFetching}
            />
          </div>
          {trackSearch && (
            <p className="tow-q-search-context">
              {t("towTruck.searchActiveNotice")} <bdi>{trackSearch}</bdi>
            </p>
          )}
          <div className="tow-queue-content" aria-busy={queue.isFetching}>
            {queue.isError && (
              <ReadError retry={refresh} stale={hasCurrentData} error={queue.error} />
            )}
            {queue.isPlaceholderData ? (
              <div className="tow-empty" role="status">
                <p>{t("towTruck.qChangingResults")}</p>
              </div>
            ) : queue.isPending ? (
              <Loading />
            ) : rawItems.length > 0 ? (
              workspace === "intercity" ? (
                <>
                  <TowTruckInterCityTable {...listProps} />
                  <TowTruckInterCityMobileList {...listProps} />
                </>
              ) : (
                <>
                  <TowTruckTable {...listProps} />
                  <TowTruckMobileList {...listProps} />
                </>
              )
            ) : (
              !queue.isError && (
                <div className="tow-empty" role="status">
                  <Search size={28} aria-hidden="true" />
                  <h3>
                    {t(
                      `towTruck.${trackSearch ? "noSearchResults" : page > 1 ? "emptyPage" : workspace !== "all" ? "noServiceFilterResults" : "emptyTitle"}`,
                    )}
                  </h3>
                  <p>{t("towTruck.qEmptyRead")}</p>
                  {trackSearch ? (
                    <Button variant="outline" onClick={handleTrackSearchClear}>
                      {t("towTruck.clearSearch")}
                    </Button>
                  ) : page > 1 ? (
                    <Button variant="outline" onClick={() => changePage(1)}>
                      {t("towTruck.firstPage")}
                    </Button>
                  ) : null}
                </div>
              )
            )}
          </div>
          <footer className="tow-q-footer" id="tow-queue-pages" tabIndex={-1}>
            <div className="tow-q-read-info">
              <span role="status">
                {hasCurrentData
                  ? t("towTruck.qLoadedBatch", { count: rawItems.length })
                  : t("towTruck.notUpdated")}
              </span>
              <span>{queue.isFetching ? t("towTruck.syncing") : updatedText}</span>
              <button
                type="button"
                className="tow-q-refresh"
                disabled={updating}
                onClick={refresh}
                aria-label={t("towTruck.refreshQueue")}
              >
                <RefreshCw size={15} aria-hidden="true" />
                {t("towTruck.refresh")}
              </button>
            </div>
            <nav className="tow-q-pagination" aria-label={t("towTruck.pagination")}>
              <span>{t("towTruck.qPageSize", { count: TOW_PAGE_SIZE })}</span>
              <button
                type="button"
                disabled={!hasCurrentData || page <= 1 || queue.isFetching || queue.isError}
                aria-label={t("towTruck.previous")}
                onClick={() => changePage(page - 1)}
              >
                <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
              </button>
              <span aria-live="polite">
                {hasCurrentData ? t("towTruck.qPageNumber", { page }) : "—"}
              </span>
              <button
                type="button"
                disabled={
                  !hasCurrentData || page >= totalPages || queue.isFetching || queue.isError
                }
                aria-label={t("towTruck.next")}
                onClick={() => changePage(page + 1)}
              >
                <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
              </button>
            </nav>
          </footer>
        </section>
        <TowTruckQuickPreviewDrawer
          open={validPreviewId}
          order={previewOrder}
          isLoading={validPreviewId && detail.isPending && !previewOrder}
          isError={validPreviewId && (detail.isError || (!detail.isPending && !previewOrder))}
          onClose={handleClosePreview}
          onRestoreFocus={restoreQueueFocus}
          fromQueue={queueUrl}
          returnScrollY={returnContext?.url === queueUrl ? returnContext.scrollY : undefined}
          onRefresh={() => void detail.refetch()}
          isRefreshing={detail.isFetching}
        />
      </div>
      <div className="tow-q-secondary">
        <Link to="/admin/reference?tab=routes">{t("towTruck.intercityRoutesAdmin")}</Link>
        <Link to="/admin/orders">{t("towTruck.allOrders")}</Link>
      </div>
      {workspace === "intercity" && (
        <details
          className="tow-q-references"
          onToggle={(event) => setReferencesOpen(event.currentTarget.open)}
        >
          <summary>{t("towTruck.qBrowseReference")}</summary>
          {referencesOpen && <QueueReferences />}
        </details>
      )}
    </div>
  );
}
