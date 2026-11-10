/** Decision-first, read-only preview. The exported name preserves existing queue integration. */
import { useCallback, useRef, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@app/store";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { handleOrderLinkClick, safeQueueUrl } from "../lib/queueContinuity";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { previewRestrictions, previewLocations } from "../lib/previewPresentation";
import { readRemovalEvidence } from "../lib/reassignment";
import { driverOperationBlocks, initialOperationBlocks } from "../lib/driverOperationGuards";
import { cancellationBlocks } from "../lib/cancellationJournal";
import {
  TowTruckOrderStatusBadge,
  TowTruckAssignmentBadge,
  TowTruckServiceTypeBadge,
  TowTruckPaymentStatusBadge,
} from "./TowTruckStatusBadge";

interface Props {
  open: boolean;
  order: TowTruckOrder | null | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  fromQueue: string;
  returnScrollY?: number;
  onRestoreFocus: () => void;
}

export function TowTruckQuickPreviewDrawer({
  open,
  order,
  isLoading = false,
  isError = false,
  onClose,
  onRefresh,
  isRefreshing = false,
  fromQueue,
  returnScrollY,
  onRestoreFocus,
}: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const actor = useAppSelector((state) => state.auth.user?.id) ?? "";
  const qc = useQueryClient();
  const subscribe = useCallback(
    (notify: () => void) => {
      const unsubscribe = qc.getQueryCache().subscribe(notify);
      window.addEventListener("storage", notify);
      window.addEventListener("focus", notify);
      return () => {
        unsubscribe();
        window.removeEventListener("storage", notify);
        window.removeEventListener("focus", notify);
      };
    },
    [qc],
  );
  const snapshot = useCallback(() => {
    if (!open || !order) return "[]";
    const restrictions = previewRestrictions(order, readRemovalEvidence(actor, order.id));
    // Read existing actor-scoped locks only; never initialize mutation hooks or clear journals.
    if (driverOperationBlocks(qc, actor)) restrictions.unshift("p3rDriverLock");
    if (initialOperationBlocks(qc, actor)) restrictions.unshift("p3rAssignmentLock");
    if (cancellationBlocks(qc, actor, order.id)) restrictions.unshift("p3rCancellationLock");
    return JSON.stringify(restrictions);
  }, [actor, open, order, qc]);
  const warnings: string[] = JSON.parse(useSyncExternalStore(subscribe, snapshot, () => "[]"));
  const showOrder = !!order && !isLoading;
  const pendingCustomer = order?.paymentPending && order.assignment === "assigned";
  const showPayment =
    order &&
    (pendingCustomer ||
      order.isInterCity ||
      !order.paymentStatus ||
      ["Failed", "Refunded"].includes(order.paymentStatus));
  return (
    <Dialog modal open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal>
        <DialogOverlay className="tow-preview-overlay" />
        <DialogPrimitive.Content
          data-tow-preview="true"
          className="tow-decision-preview"
          dir={i18n.dir()}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            titleRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
        >
          <header className="tow-decision-preview-header">
            <div>
              <DialogDescription>{t("towTruck.p3rReadOnly")}</DialogDescription>
              <DialogTitle ref={titleRef} tabIndex={-1}>
                {t("towTruck.quickPreviewTitle")} {showOrder && <bdi>{order.number}</bdi>}
              </DialogTitle>
              {showOrder && (
                <div className="tow-decision-preview-service">
                  <span className="sr-only">{t("towTruck.serviceType")}: </span>
                  <TowTruckServiceTypeBadge serviceType={order.serviceType} />
                </div>
              )}
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                aria-label={t("towTruck.closePreview")}
              >
                <X aria-hidden="true" size={18} />
              </Button>
            </DialogClose>
          </header>
          <div className="tow-decision-preview-body">
            {isLoading ? (
              <p role="status">{t("towTruck.loading")}</p>
            ) : !order ? (
              <div role="alert">
                <h3>{t(isError ? "towTruck.errorTitle" : "towTruck.orderNotFound")}</h3>
                <p>{t(isError ? "towTruck.previewReadError" : "towTruck.orderNotFoundDesc")}</p>
              </div>
            ) : (
              <>
                {isError && (
                  <p className="tow-decision-preview-warning" role="alert">
                    {t("towTruck.stale")}
                  </p>
                )}
                <div className="tow-decision-preview-status">
                  <span>
                    <span className="sr-only">{t("towTruck.orderStatus")}: </span>
                    <TowTruckOrderStatusBadge status={order.status} />
                  </span>
                  <span>
                    <span className="sr-only">{t("towTruck.assignment")}: </span>
                    <TowTruckAssignmentBadge
                      assignment={order.assignment}
                      driverName={order.driverName}
                    />
                  </span>
                </div>
                <section
                  aria-label={t("towTruck.nextAction")}
                  className="tow-decision-preview-guidance"
                >
                  <h3>{t("towTruck.nextAction")}</h3>
                  <p>
                    {t(
                      pendingCustomer
                        ? "towTruck.pendingCustomerHint"
                        : "towTruck.p3rReviewGuidance",
                    )}
                  </p>
                </section>
                {warnings.length > 0 && (
                  <ul
                    className="tow-decision-preview-warning"
                    aria-label={t("towTruck.p3rRestrictions")}
                  >
                    {warnings.map((key) => (
                      <li key={key}>{t(`towTruck.${key}`)}</li>
                    ))}
                  </ul>
                )}
                <dl className="tow-decision-preview-route">
                  {previewLocations(order).map(({ label, value }) => (
                    <div key={label}>
                      <dt>{t(`towTruck.${label}`)}</dt>
                      <dd>{value ?? t("towTruck.f1LocationMissing")}</dd>
                    </div>
                  ))}
                </dl>
                {showPayment && (
                  <div className="tow-decision-preview-payment">
                    <span>{t("towTruck.payment")}</span>
                    <TowTruckPaymentStatusBadge paymentStatus={order.paymentStatus} />
                  </div>
                )}
                {/* Free-text notes have no verified safety classification; do not silently hide them. */}
                {order.notes && (
                  <section className="tow-decision-preview-notes">
                    <h3>{t("towTruck.notes")}</h3>
                    <p>{order.notes}</p>
                  </section>
                )}
              </>
            )}
            {onRefresh && !isLoading && (
              <Button
                variant="ghost"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="min-h-11"
              >
                <RefreshCw size={15} aria-hidden="true" />
                {t(
                  isRefreshing
                    ? "towTruck.loading"
                    : isError || !order
                      ? "towTruck.retry"
                      : "towTruck.refresh",
                )}
              </Button>
            )}
          </div>
          {showOrder && (
            <footer className="tow-decision-preview-footer">
              <Button asChild className="min-h-11 w-full">
                <Link
                  to={`/admin/tow-truck/${order.id}`}
                  state={{ fromQueue: safeQueueUrl(fromQueue) ?? "/admin/tow-truck" }}
                  onClick={(event) =>
                    handleOrderLinkClick(
                      event,
                      navigate,
                      fromQueue,
                      order.id,
                      "preview",
                      returnScrollY,
                    )
                  }
                >
                  {t("towTruck.openFullWorkspace")}
                </Link>
              </Button>
            </footer>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
