import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Car,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RefreshCw,
  Truck,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@modules/orders/lib/formatRelativeDate";
import { useTowTruckDetail, useTowTruckQueue } from "../hooks/useTowTruckQueries";
import { TowTruckDetail } from "../components/TowTruckDetail";
import { readFailureMessage } from "../lib/assignmentFeedback";
import "../towTruck.css";

function Loading({ detail = false }: { detail?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`tow-loading ${detail ? "tow-loading-detail" : ""}`} role="status">
      <span className="sr-only">{t(`towTruck.${detail ? "loadingDetail" : "loading"}`)}</span>
      {Array.from({ length: detail ? 5 : 4 }, (_, i) => (
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
  const navigate = useNavigate();
  const route = useLocation();
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const dialogScroll = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const stayButton = useRef<HTMLButtonElement>(null);
  const queueKey = useRef<string | null>(null);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (dirty || busy) && currentLocation.pathname !== nextLocation.pathname,
  );
  useBeforeUnload(
    useCallback(
      (event) => {
        if (dirty || busy) event.preventDefault();
      },
      [dirty, busy],
    ),
  );
  const { orderId } = useParams<{ orderId: string }>();
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const queue = useTowTruckQueue(page);
  const detail = useTowTruckDetail(orderId);
  const queueRef = useRef<HTMLDivElement>(null);
  const queueHeading = useRef<HTMLHeadingElement>(null);
  const returnTarget = useRef<string | undefined>(undefined);
  const scrollPosition = useRef(0);
  const search = route.search;
  const validId = !!orderId && /^[1-9]\d*$/.test(orderId) && Number.isSafeInteger(Number(orderId));
  const totalPages = Math.max(1, queue.data?.totalPages ?? 1);
  const updating = queue.isFetching || detail.isFetching;
  const updatedAt = orderId ? detail.dataUpdatedAt : queue.dataUpdatedAt;
  const updatedText = updatedAt
    ? t("towTruck.updated", {
        time: new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" }).format(
          updatedAt,
        ),
      })
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

  useEffect(() => {
    if (!orderId) queueKey.current = route.key;
  }, [orderId, route.key]);
  useEffect(() => {
    if (blocker.state === "blocked") stayButton.current?.focus();
  }, [blocker.state]);

  useEffect(() => {
    if (orderId) {
      dialogScroll.current?.scrollTo({ top: 0, behavior: "instant" });
      closeButton.current?.focus({ preventScroll: true });
    }
  }, [orderId]);

  useEffect(() => {
    if (blocker.state === "blocked" && !busy && !dirty) blocker.proceed();
  }, [blocker, busy, dirty]);

  const close = () => {
    if (busy) return;
    // Only go back when this mounted queue created the history entry.
    // Direct links / reloaded details have a deterministic queue destination.
    if (queueKey.current && route.state?.towQueueKey === queueKey.current) navigate(-1);
    else navigate(`/admin/tow-truck${search}`, { replace: true });
  };
  const restoreQueueFocus = () => {
    const link = queueRef.current?.querySelector<HTMLAnchorElement>(
      `a[data-order-id="${returnTarget.current}"]`,
    );
    (link ?? queueHeading.current)?.focus({ preventScroll: true });
    window.scrollTo({ top: scrollPosition.current, behavior: "instant" });
  };

  const refresh = () => {
    void queue.refetch();
    if (validId) void detail.refetch();
  };
  const changePage = (value: number) => {
    const next = new URLSearchParams(params);
    if (value > 1) next.set("page", String(value));
    else next.delete("page");
    setParams(next);
    queueHeading.current?.focus({ preventScroll: true });
    queueRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  };
  return (
    <div className="tow-workspace" dir={i18n.dir()}>
      <header className="tow-page-header">
        <div className="tow-page-heading">
          <div className="tow-brand-icon">
            <Truck size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="tow-eyebrow">{t("towTruck.eyebrow")}</p>
            <h1>{t("towTruck.title")}</h1>
            <p className="tow-subtitle">{t("towTruck.subtitle")}</p>
          </div>
        </div>
        <div className="tow-page-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar")}
          >
            {t("towTruck.language")}
          </Button>
          <Link to="/admin/orders" className="tow-general-link">
            {t("towTruck.generalOrders")}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <div className="tow-sync-row">
        <span role="status" aria-live="polite">
          {updating ? t("towTruck.refreshing") : updatedText}
        </span>
        <Button variant="outline" size="sm" disabled={updating} onClick={refresh}>
          <RefreshCw
            size={15}
            className={updating ? "motion-safe:animate-spin" : ""}
            aria-hidden="true"
          />
          {t("towTruck.refresh")}
        </Button>
      </div>
      <div className="tow-workbench">
        <section className="tow-queue-panel" aria-labelledby="tow-queue-title" ref={queueRef}>
          <header className="tow-queue-header">
            <div>
              <h2 id="tow-queue-title" ref={queueHeading} tabIndex={-1}>
                {t("towTruck.queue")}
              </h2>
              <p className="tow-hint">{t("towTruck.queueHint")}</p>
            </div>
            {queue.data && !queue.isPlaceholderData && (
              <span className="tow-total">{t("towTruck.total", { count: queue.data.total })}</span>
            )}
          </header>
          {queue.isError && (
            <ReadError
              retry={() => void queue.refetch()}
              stale={!!queue.data}
              error={queue.error}
            />
          )}
          <div aria-busy={queue.isFetching}>
            {queue.isPending || queue.isPlaceholderData ? (
              <Loading />
            ) : queue.data && queue.data.items.length ? (
              <ul className="tow-queue-list">
                {queue.data.items.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/admin/tow-truck/${order.id}${search}`}
                      state={{ towQueueKey: route.key }}
                      data-order-id={order.id}
                      className={`tow-request ${orderId === order.id ? "tow-request-selected" : ""}`}
                      aria-current={orderId === order.id ? "true" : undefined}
                      aria-label={t("towTruck.open", { number: order.number })}
                      aria-describedby={`tow-route-${order.id} tow-states-${order.id}`}
                      onClick={() => {
                        if (!orderId) scrollPosition.current = window.scrollY;
                        returnTarget.current = order.id;
                      }}
                    >
                      <div className="tow-request-top">
                        <strong>
                          <bdi>{order.number}</bdi>
                        </strong>
                        <time
                          dateTime={order.createdAt ?? undefined}
                          title={order.createdAt ?? undefined}
                        >
                          {order.createdAt
                            ? formatRelativeDate(order.createdAt, i18n.language)
                            : t("towTruck.missing")}
                        </time>
                      </div>
                      <div className="tow-queue-route" id={`tow-route-${order.id}`}>
                        <span>
                          <MapPin size={14} aria-hidden="true" />
                          <span>
                            <small>{t("towTruck.originShort")}</small>
                            {order.origin.title ??
                              order.origin.description ??
                              t("towTruck.missing")}
                          </span>
                        </span>
                        <span>
                          <span className="tow-destination-dot" aria-hidden="true" />
                          <span>
                            <small>{t("towTruck.destination")}</small>
                            {order.destination.title ??
                              order.destination.description ??
                              t("towTruck.missing")}
                          </span>
                        </span>
                      </div>
                      <div className="tow-request-customer">
                        <p className="tow-request-person">
                          {order.customer ?? t("towTruck.customerMissing")}
                        </p>
                        <p className="tow-request-vehicle">
                          <Car size={14} aria-hidden="true" />
                          <span>
                            {order.vehicle ?? order.plate ?? t("towTruck.vehicleMissing")}
                          </span>
                        </p>
                      </div>
                      <div className="tow-request-states" id={`tow-states-${order.id}`}>
                        <span>
                          {t("towTruck.orderStatus")}
                          <strong>
                            {order.status
                              ? t(`orders.status.${order.status}`)
                              : t("towTruck.statusUnknown")}
                          </strong>
                        </span>
                        <span>
                          {t("towTruck.payment")}
                          <strong>
                            {t(
                              order.paymentPending
                                ? "towTruck.paymentPending"
                                : "towTruck.paymentUnknown",
                            )}
                          </strong>
                        </span>
                        <span>
                          {t("towTruck.assignment")}
                          <strong>
                            {order.assignment === "assigned"
                              ? (order.driverName ?? t("towTruck.assigned"))
                              : t(`towTruck.${order.assignment}`)}
                          </strong>
                        </span>
                      </div>
                      <div className="tow-request-bottom">
                        <span>
                          <AlertCircle size={13} aria-hidden="true" />
                          {t(`towTruck.${order.stage}`)}
                        </span>
                        <ArrowRight size={16} className="rtl:rotate-180" aria-hidden="true" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              !queue.isError && (
                <div className="tow-empty">
                  <Truck size={32} aria-hidden="true" />
                  <h3>{t(`towTruck.${page > 1 ? "emptyPage" : "emptyTitle"}`)}</h3>
                  <p>{t("towTruck.emptyHint")}</p>
                  {page > 1 && (
                    <Button variant="outline" onClick={() => changePage(1)}>
                      {t("towTruck.firstPage")}
                    </Button>
                  )}
                </div>
              )
            )}
          </div>
          {queue.data && (
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
        <Dialog.Root
          open={!!orderId}
          onOpenChange={(open) => {
            if (!open) close();
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="tow-dialog-backdrop" />
            <Dialog.Content
              className="tow-workspace tow-order-dialog"
              dir={i18n.dir()}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                closeButton.current?.focus();
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                restoreQueueFocus();
              }}
              onPointerDownOutside={(event) => event.preventDefault()}
            >
              <header className="tow-dialog-toolbar">
                <div>
                  <Dialog.Title>{t("towTruck.dialogTitle")}</Dialog.Title>
                  <Dialog.Description>{t("towTruck.dialogHint")}</Dialog.Description>
                </div>
                <Button ref={closeButton} variant="outline" disabled={busy} onClick={close}>
                  <X size={18} aria-hidden="true" />
                  {t("towTruck.back")}
                </Button>
              </header>
              {blocker.state === "blocked" && (
                <div className="tow-discard" role="alert">
                  <p>{t(busy ? "towTruck.assignmentStay" : "towTruck.discardPrompt")}</p>
                  <div className="tow-form-actions">
                    <Button
                      ref={stayButton}
                      variant="outline"
                      onClick={() => {
                        blocker.reset();
                        closeButton.current?.focus();
                      }}
                    >
                      {t("towTruck.keepDraft")}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={() => {
                        setDirty(false);
                        blocker.proceed();
                      }}
                    >
                      {t("towTruck.discardDraft")}
                    </Button>
                  </div>
                </div>
              )}
              <div className="tow-dialog-scroll" ref={dialogScroll}>
                {!validId ? (
                  <div className="tow-empty" role="alert">
                    <AlertCircle size={28} aria-hidden="true" />
                    <h2>{t("towTruck.invalidOrder")}</h2>
                    <p>{t("towTruck.invalidLink")}</p>
                  </div>
                ) : (
                  <>
                    <div className="tow-dialog-sync">
                      <span role="status">
                        {detail.isFetching ? t("towTruck.refreshing") : updatedText}
                      </span>
                      <Button
                        variant="ghost"
                        disabled={detail.isFetching}
                        onClick={() => void detail.refetch()}
                      >
                        <RefreshCw size={16} aria-hidden="true" />
                        {t("towTruck.refresh")}
                      </Button>
                    </div>
                    {detail.isError && (
                      <ReadError
                        retry={() => void detail.refetch()}
                        stale={!!detail.data}
                        error={detail.error}
                      />
                    )}
                    {detail.isPending ? (
                      <Loading detail />
                    ) : detail.data ? (
                      <TowTruckDetail
                        key={detail.data.id}
                        order={detail.data}
                        onDirtyChange={setDirty}
                        onBusyChange={setBusy}
                        stale={detail.isError || detail.isFetching}
                      />
                    ) : null}
                  </>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
