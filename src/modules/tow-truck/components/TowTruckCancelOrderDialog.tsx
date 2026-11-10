/**
 * @file TowTruckCancelOrderDialog.tsx
 * @description Accessible confirmation dialog for cancelling an IntraCity Tow Truck order.
 * Communicates:
 * 1. Selected order number.
 * 2. Entire order cancellation (not just driver removal).
 * 3. Read-only recovery without replaying uncertain cancellations.
 * 4. Irreversibility.
 * Differentiates destructive confirm from safe cancel/close and guards against duplicate submits.
 */
import { useTranslation } from "react-i18next";
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TowTruckOrder } from "../lib/towTruckModel";
import type { TowTruckCancellation } from "../hooks/useTowTruckCancellation";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";

interface Props {
  order: TowTruckOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancellation: TowTruckCancellation;
}

export function TowTruckCancelOrderDialog({ order, open, onOpenChange, cancellation }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);

  const { state, busy, isConflict, isUncertain, cancel, reconcile, reset } = cancellation;

  const handleOpenChange = (nextOpen: boolean) => {
    if (busy) return;
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const isSuccess = state.phase === "success";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="md"
        className="gap-5"
        dir={i18n.dir()}
        aria-describedby="cancel-order-dialog-desc"
      >
        <DialogHeader className={isAr ? "text-right" : "text-left"}>
          <div className="flex items-center gap-3">
            <div className="bg-danger-100 text-danger-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <XCircle size={22} aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-ink-900 text-lg font-bold">
                {t("towTruck.cancelOrderTitle")}
              </DialogTitle>
              <span className="text-ink-500 text-xs font-normal">
                {t("towTruck.identity")}: <bdi>#{order.id}</bdi>
              </span>
            </div>
          </div>
          <DialogDescription id="cancel-order-dialog-desc" className="sr-only">
            {t("towTruck.cancelOrderDescription", { orderNumber: order.number })}
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="text-ink-700 space-y-4 text-xs">
          {/* Order Callout */}
          <div className="border-ink-200 bg-ink-50/60 flex items-center justify-between gap-3 rounded-xl border p-3.5">
            <span className="text-ink-800 font-semibold">{t("towTruck.orderNumber")}:</span>
            <span className="text-brand-blue text-sm font-bold">
              <bdi>{order.number}</bdi>
            </span>
          </div>

          {/* Blocked reason feedback when cancellation cannot be executed */}
          {!isSuccess && !cancellation.canCancel && state.phase === "idle" && (
            <div
              className="border-warning-300 bg-warning-50 flex items-start gap-3 rounded-xl border p-4"
              role="alert"
            >
              <AlertCircle
                size={18}
                className="text-warning-600 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-warning-900 font-bold">{t("towTruck.cancelUnavailableTitle")}</p>
                <p className="text-warning-700 text-[11px] leading-relaxed">
                  {order.paymentCode === 2 || order.paymentStatus === "Paid"
                    ? t("towTruck.cancelBlockedPaid")
                    : order.statusCode === 5 || order.status === "Canceled"
                      ? t("towTruck.cancelBlockedAlreadyCancelled")
                      : !order.paymentStatusValid
                        ? t("towTruck.cancelBlockedUnknownPayment")
                        : t("towTruck.cancelForbidden")}
                </p>
              </div>
            </div>
          )}

          {/* Warning Notices List */}
          {!isSuccess && state.phase !== "conflict" && !isUncertain && cancellation.canCancel && (
            <div className="border-danger-100 bg-danger-50/50 space-y-2.5 rounded-xl border p-4">
              <div className="text-danger-800 flex items-center gap-2 text-xs font-bold">
                <AlertTriangle size={15} className="text-danger-600 shrink-0" aria-hidden="true" />
                <span>{t("towTruck.operationalWarning")}</span>
              </div>
              <ul className="text-ink-700 list-disc space-y-2 ps-5 leading-relaxed font-medium">
                <li>{t("towTruck.cancelOrderScopeNotice")}</li>
                <li>{t("towTruck.cancelOrderTripNotice")}</li>
                <li>{t("towTruck.cancelOrderIrreversibleNotice")}</li>
              </ul>
            </div>
          )}

          {/* Feedback & Error States */}
          {isSuccess && (
            <div
              className="border-success-200 bg-success-50 flex items-start gap-3 rounded-xl border p-4"
              role="status"
            >
              <CheckCircle2
                size={18}
                className="text-success-600 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-success-900 font-bold">{t("towTruck.cancelSuccess")}</p>
                <p className="text-success-700 text-[11px]">{t("towTruck.cancelSuccessHint")}</p>
              </div>
            </div>
          )}

          {isConflict && (
            <div
              className="border-warning-300 bg-warning-50 flex items-start gap-3 rounded-xl border p-4"
              role="alert"
            >
              <AlertCircle
                size={18}
                className="text-warning-600 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-warning-900 font-bold">
                  {state.message ? t(`towTruck.${state.message}`) : t("towTruck.cancelBlockedPaid")}
                </p>
                <p className="text-warning-700 text-[11px]">
                  {t("towTruck.cancelConflictRefreshed")}
                </p>
              </div>
            </div>
          )}

          {isUncertain && (
            <div
              className="border-warning-300 bg-warning-50 space-y-3 rounded-xl border p-4"
              role="alert"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  size={18}
                  className="text-warning-600 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-warning-900 font-bold">
                    {t(`towTruck.${state.message ?? "cancelUncertain"}`)}
                  </p>
                  <p className="text-warning-700 text-[11px]">
                    {t("towTruck.cancelUncertainHint")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void reconcile()}
                disabled={busy}
                className="border-warning-400 text-warning-900 hover:bg-warning-100 gap-2 text-xs"
              >
                <RefreshCw size={13} className={busy ? "animate-spin" : ""} aria-hidden="true" />
                <span>{t("towTruck.cancelReconcile")}</span>
              </Button>
            </div>
          )}

          {state.phase === "rejected" && !isConflict && (
            <div
              className="border-danger-200 bg-danger-50 flex items-start gap-3 rounded-xl border p-4"
              role="alert"
            >
              <AlertCircle
                size={18}
                className="text-danger-600 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-danger-900 font-bold">
                  {state.message ? t(`towTruck.${state.message}`) : t("towTruck.cancelValidation")}
                </p>
                <p className="text-[11px]">{t("towTruck.cancelReviewAgain")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex-wrap gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
            className="min-h-[38px] text-xs"
          >
            {t("towTruck.close")}
          </Button>

          {!isSuccess && !isUncertain && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void cancel()}
              disabled={busy || !cancellation.canCancel}
              title={
                !cancellation.canCancel
                  ? order.paymentCode === 2 || order.paymentStatus === "Paid"
                    ? t("towTruck.cancelBlockedPaid")
                    : order.statusCode === 5 || order.status === "Canceled"
                      ? t("towTruck.cancelBlockedAlreadyCancelled")
                      : !order.paymentStatusValid
                        ? t("towTruck.cancelBlockedUnknownPayment")
                        : t("towTruck.cancelForbidden")
                  : undefined
              }
              className="min-h-[38px] gap-2 text-xs font-semibold disabled:pointer-events-auto"
            >
              {busy ? (
                <>
                  <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
                  <span>{t("towTruck.cancellingOrder")}</span>
                </>
              ) : (
                <>
                  <XCircle size={14} aria-hidden="true" />
                  <span>{t("towTruck.confirmCancelOrder")}</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
