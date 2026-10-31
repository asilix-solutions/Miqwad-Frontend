/**
 * @file TowTruckCancelOrderDialog.tsx
 * @description Accessible confirmation dialog for cancelling an IntraCity Tow Truck order.
 * Communicates:
 * 1. Selected order number.
 * 2. Entire order cancellation (not just driver removal).
 * 3. Automatic backend trip cancellation if active.
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

export function TowTruckCancelOrderDialog({
  order,
  open,
  onOpenChange,
  cancellation,
}: Props) {
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
            <div className="w-10 h-10 rounded-xl bg-danger-100 text-danger-600 flex items-center justify-center shrink-0">
              <XCircle size={22} aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-ink-900">
                {t("towTruck.cancelOrderTitle")}
              </DialogTitle>
              <span className="text-xs text-ink-500 font-normal">
                {t("towTruck.identity")}: <bdi>#{order.id}</bdi>
              </span>
            </div>
          </div>
          <DialogDescription id="cancel-order-dialog-desc" className="sr-only">
            {t("towTruck.cancelOrderDescription", { orderNumber: order.number })}
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="space-y-4 text-xs text-ink-700">
          {/* Order Callout */}
          <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-3.5 flex items-center justify-between gap-3">
            <span className="font-semibold text-ink-800">{t("towTruck.orderNumber")}:</span>
            <span className="font-bold text-sm text-brand-blue">
              <bdi>{order.number}</bdi>
            </span>
          </div>

          {/* Blocked reason feedback when cancellation cannot be executed */}
          {!isSuccess && !cancellation.canCancel && state.phase === "idle" && (
            <div
              className="rounded-xl border border-warning-300 bg-warning-50 p-4 flex items-start gap-3"
              role="alert"
            >
              <AlertCircle size={18} className="text-warning-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-bold text-warning-900">
                  {t("towTruck.cancelUnavailableTitle")}
                </p>
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
            <div className="rounded-xl border border-danger-100 bg-danger-50/50 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-danger-800 font-bold text-xs">
                <AlertTriangle size={15} className="shrink-0 text-danger-600" aria-hidden="true" />
                <span>{t("towTruck.operationalWarning")}</span>
              </div>
              <ul className="space-y-2 ps-5 list-disc text-ink-700 font-medium leading-relaxed">
                <li>{t("towTruck.cancelOrderScopeNotice")}</li>
                <li>{t("towTruck.cancelOrderTripNotice")}</li>
                <li>{t("towTruck.cancelOrderIrreversibleNotice")}</li>
              </ul>
            </div>
          )}

          {/* Feedback & Error States */}
          {isSuccess && (
            <div className="rounded-xl border border-success-200 bg-success-50 p-4 flex items-start gap-3" role="status">
              <CheckCircle2 size={18} className="text-success-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-bold text-success-900">{t("towTruck.cancelSuccess")}</p>
                <p className="text-success-700 text-[11px]">{t("towTruck.cancelSuccessHint")}</p>
              </div>
            </div>
          )}

          {isConflict && (
            <div className="rounded-xl border border-warning-300 bg-warning-50 p-4 flex items-start gap-3" role="alert">
              <AlertCircle size={18} className="text-warning-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-bold text-warning-900">
                  {state.message ? (state.message.startsWith("cancel") ? t(`towTruck.${state.message}`) : state.message) : t("towTruck.cancelBlockedPaid")}
                </p>
                <p className="text-warning-700 text-[11px]">{t("towTruck.cancelConflictRefreshed")}</p>
              </div>
            </div>
          )}

          {isUncertain && (
            <div className="rounded-xl border border-warning-300 bg-warning-50 p-4 space-y-3" role="alert">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-warning-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-bold text-warning-900">{t("towTruck.cancelUncertain")}</p>
                  <p className="text-warning-700 text-[11px]">{t("towTruck.cancelUncertainHint")}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void reconcile()}
                disabled={busy}
                className="gap-2 text-xs border-warning-400 text-warning-900 hover:bg-warning-100"
              >
                <RefreshCw size={13} className={busy ? "animate-spin" : ""} aria-hidden="true" />
                <span>{t("towTruck.cancelReconcile")}</span>
              </Button>
            </div>
          )}

          {state.phase === "rejected" && !isConflict && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 flex items-start gap-3" role="alert">
              <AlertCircle size={18} className="text-danger-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-bold text-danger-900">
                  {state.message ? t(`towTruck.${state.message}`) : t("towTruck.cancelValidation")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="pt-2 gap-2 flex-wrap sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
            className="text-xs min-h-[38px]"
          >
            {isSuccess ? t("towTruck.close") : t("towTruck.cancelClose")}
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
              className="gap-2 text-xs min-h-[38px] font-semibold disabled:pointer-events-auto"
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
