import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@shared/lib/formatDate";
import { useToast } from "@shared/components/ui/toastContext";
import { useCoupon, useDeleteCoupon, useToggleCoupon } from "../hooks/useCouponsQueries";
import { couponAmount, couponPercentage, couponErrorKey } from "../lib/couponPresentation";
import { CouponForm } from "./CouponForm";
import { CouponStatus } from "./CouponStatus";
import type { CouponAction } from "./CouponActions";
import type { Coupon } from "../types";

export type CouponDialogState = { action: "create" } | { action: CouponAction; id: number };
export function CouponDialog({
  state,
  onClose,
  restoreFocus,
}: {
  state: CouponDialogState;
  onClose: () => void;
  restoreFocus: () => void;
}) {
  const { t, i18n } = useTranslation();
  const q = useCoupon(state.action === "create" ? 0 : state.id);
  const pending = useRef(false);
  const close = () => {
    if (!pending.current) onClose();
  };
  const title = {
    create: "coupons.create",
    edit: "coupons.edit",
    detail: "coupons.details",
    toggle: "coupons.activation",
    delete: "coupons.deleteTitle",
  }[state.action];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        dir={i18n.dir()}
        size="lg"
        showCloseButton={false}
        className="max-h-[85svh] overflow-y-auto"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle>{t(title)}</DialogTitle>
          <DialogDescription className="break-words">
            {state.action === "create"
              ? t("coupons.createDescription")
              : (q.data?.code ?? t("coupons.notSet"))}
          </DialogDescription>
        </DialogHeader>
        {state.action === "create" ? (
          <CouponForm
            onClose={onClose}
            onPendingChange={(value) => {
              pending.current = value;
            }}
          />
        ) : q.isPending ? (
          <div role="status" className="space-y-4">
            <span>{t("common.loading")}</span>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : q.isError ? (
          <div role="alert" className="space-y-3">
            <p>{t(couponErrorKey(q.error))}</p>
            <Button variant="outline" onClick={() => void q.refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : q.data ? (
          state.action === "edit" ? (
            <CouponForm
              coupon={q.data}
              onClose={onClose}
              onPendingChange={(value) => {
                pending.current = value;
              }}
            />
          ) : state.action === "detail" ? (
            <CouponDetails coupon={q.data} />
          ) : (
            <CouponConfirmation
              coupon={q.data}
              action={state.action}
              refreshing={q.isFetching}
              onClose={onClose}
              onPendingChange={(value) => {
                pending.current = value;
              }}
            />
          )
        ) : null}
        {(state.action === "detail" ||
          (state.action !== "create" && (q.isPending || q.isError))) && (
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CouponDetails({ coupon }: { coupon: Coupon }) {
  const { t, i18n } = useTranslation();
  const number = (value: number) => value.toLocaleString(i18n.language);
  const date = (value: string) =>
    formatDate(value, i18n.language, { dateStyle: "medium", timeStyle: "short" });
  const fields = [
    ["discountPercentage", couponPercentage(coupon.discountPercentage, i18n.language)],
    [
      "minimumOrderAmount",
      coupon.minimumOrderAmount === null
        ? t("coupons.noMinimum")
        : couponAmount(coupon.minimumOrderAmount, i18n.language),
    ],
    ["usedCount", number(coupon.usedCount)],
    [
      "usageLimit",
      coupon.usageLimit === null ? t("coupons.limitNotSet") : number(coupon.usageLimit),
    ],
    ["startDate", date(coupon.startDate)],
    ["endDate", coupon.endDate === null ? t("coupons.endNotSet") : date(coupon.endDate)],
    ["createdAt", date(coupon.createdAt)],
  ];
  return (
    <div className="space-y-5">
      <CouponStatus coupon={coupon} />
      <p className="text-sm text-[var(--color-muted)]">{t("coupons.lifecycleHint")}</p>
      <dl className="grid gap-5 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-[var(--color-muted)]">{t(`coupons.${label}`)}</dt>
            <dd className="mt-1 font-medium break-words">
              <bdi>{value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      {coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit && (
        <p className="text-sm">{t("coupons.usageReached")}</p>
      )}
    </div>
  );
}
function CouponConfirmation({
  coupon,
  action,
  refreshing,
  onClose,
  onPendingChange,
}: {
  coupon: Coupon;
  action: "toggle" | "delete";
  refreshing: boolean;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const remove = useDeleteCoupon();
  const toggle = useToggleCoupon();
  const mutation = action === "delete" ? remove : toggle;
  const confirm = async () => {
    if (mutation.isPending || refreshing) return;
    onPendingChange(true);
    try {
      await mutation.mutateAsync(coupon.id);
      toast.success(t(action === "delete" ? "coupons.success.deleted" : "coupons.success.toggled"));
      onClose();
    } catch (error) {
      toast.error(t(couponErrorKey(error)));
    } finally {
      onPendingChange(false);
    }
  };
  return (
    <div className="space-y-4">
      <p className="break-words">
        {t(
          action === "delete"
            ? "coupons.deleteDescription"
            : coupon.isActive
              ? "coupons.deactivateDescription"
              : "coupons.activateDescription",
          { code: coupon.code ?? t("coupons.notSet") },
        )}
      </p>
      {action === "toggle" && (
        <>
          <CouponStatus coupon={coupon} />
          <p className="text-sm text-[var(--color-muted)]">{t("coupons.lifecycleHint")}</p>
        </>
      )}
      {mutation.isError && (
        <p role="alert" className="text-sm text-[var(--color-danger-500)]">
          {t(couponErrorKey(mutation.error))}
        </p>
      )}
      <DialogFooter>
        <Button variant="outline" disabled={mutation.isPending} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          variant={action === "delete" ? "destructive" : "default"}
          disabled={mutation.isPending || refreshing}
          onClick={() => void confirm()}
        >
          {t(
            mutation.isPending
              ? "common.loading"
              : action === "delete"
                ? "common.delete"
                : coupon.isActive
                  ? "coupons.deactivate"
                  : "coupons.activate",
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
