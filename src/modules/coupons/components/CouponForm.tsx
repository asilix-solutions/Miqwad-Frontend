import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@shared/components/ui/toastContext";
import { AppError } from "@shared/types/api";
import { useCreateCoupon, useUpdateCoupon } from "../hooks/useCouponsQueries";
import {
  couponFormSchema,
  createCouponFormSchema,
  type CouponFormValues,
} from "../schemas/couponForm.schema";
import { couponDateInput, couponWriteDate, couponErrorKey } from "../lib/couponPresentation";
import type { Coupon, UpdateCouponRequest } from "../types";

export function CouponForm({
  coupon,
  onClose,
  onPendingChange,
}: {
  coupon?: Coupon;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const create = useCreateCoupon();
  const update = useUpdateCoupon();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(coupon ? couponFormSchema : createCouponFormSchema),
    defaultValues: {
      code: coupon?.code ?? "",
      discountPercentage: coupon?.discountPercentage,
      minimumOrderAmount: coupon?.minimumOrderAmount ?? null,
      usageLimit: coupon?.usageLimit ?? null,
      startDate: couponDateInput(coupon?.startDate ?? null),
      endDate: couponDateInput(coupon?.endDate ?? null),
    },
  });
  const submit = async (values: CouponFormValues) => {
    if (pending) return;
    onPendingChange(true);
    const input: UpdateCouponRequest = {
      discountPercentage: values.discountPercentage,
      minimumOrderAmount: values.minimumOrderAmount,
      usageLimit: values.usageLimit,
      startDate: couponWriteDate(values.startDate, coupon?.startDate),
      endDate: values.endDate ? couponWriteDate(values.endDate, coupon?.endDate) : null,
    };
    try {
      if (coupon) await update.mutateAsync({ id: coupon.id, input });
      else await create.mutateAsync({ code: values.code, ...input });
      toast.success(t(coupon ? "coupons.success.updated" : "coupons.success.created"));
      onClose();
    } catch (err) {
      toast.error(t(couponErrorKey(err)));
    } finally {
      onPendingChange(false);
    }
  };
  const numericFields = ["discountPercentage", "minimumOrderAmount", "usageLimit"] as const;
  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <fieldset disabled={pending} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="coupon-code">
            {t("coupons.code")}
            {!coupon && " *"}
          </Label>
          <Input
            id="coupon-code"
            dir="auto"
            readOnly={!!coupon}
            aria-required={!coupon}
            aria-invalid={!!errors.code}
            aria-describedby="coupon-code-help"
            {...register("code")}
          />
          <p
            id="coupon-code-help"
            className={`text-sm ${errors.code ? "text-[var(--color-danger-500)]" : "text-[var(--color-muted)]"}`}
          >
            {errors.code
              ? t(errors.code.message ?? "common.requiredField")
              : t(coupon ? "coupons.codeReadonly" : "coupons.codeHint")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {numericFields.map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`coupon-${field}`}>
                {t(`coupons.${field}`)}
                {field === "discountPercentage" && " *"}
              </Label>
              <Input
                id={`coupon-${field}`}
                type="number"
                dir="ltr"
                inputMode={field === "usageLimit" ? "numeric" : "decimal"}
                step={field === "usageLimit" ? "1" : "any"}
                aria-required={field === "discountPercentage"}
                aria-invalid={!!errors[field]}
                aria-describedby={`coupon-${field}-help`}
                {...register(field, {
                  setValueAs: (value: string | number | null) =>
                    value === "" || value === null
                      ? field === "discountPercentage"
                        ? Number.NaN
                        : null
                      : Number(value),
                })}
              />
              <p
                id={`coupon-${field}-help`}
                className={`text-xs ${errors[field] ? "text-[var(--color-danger-500)]" : "text-[var(--color-muted)]"}`}
              >
                {errors[field]
                  ? t(errors[field].message ?? "coupons.validation.number")
                  : t(`coupons.hints.${field}`)}
              </p>
            </div>
          ))}
        </div>
        <fieldset className="space-y-3 border-t border-[var(--color-divider)] pt-4">
          <legend className="px-1 text-sm font-semibold">{t("coupons.validity")}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["startDate", "endDate"] as const).map((field) => (
              <div key={field} className="min-w-0 space-y-2">
                <Label htmlFor={`coupon-${field}`}>
                  {t(`coupons.${field}`)}
                  {field === "startDate" && " *"}
                </Label>
                <Input
                  id={`coupon-${field}`}
                  type="datetime-local"
                  dir="ltr"
                  className="min-w-0"
                  aria-required={field === "startDate"}
                  aria-invalid={!!errors[field]}
                  aria-describedby={`coupon-${field}-help`}
                  {...register(field)}
                />
                <p
                  id={`coupon-${field}-help`}
                  className={`text-xs ${errors[field] ? "text-[var(--color-danger-500)]" : "text-[var(--color-muted)]"}`}
                >
                  {errors[field]
                    ? t(errors[field].message ?? "coupons.validation.date")
                    : t(field === "endDate" ? "coupons.endNotSetHint" : "coupons.localDateHint")}
                </p>
              </div>
            ))}
          </div>
        </fieldset>
      </fieldset>
      {error && (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-danger-500)] p-3 text-sm text-[var(--color-danger-500)]"
        >
          <p>{t(couponErrorKey(error))}</p>
          {error instanceof AppError &&
            (error.status === 400 || error.code === "COUPON_REJECTED") &&
            error.errors?.map((message, i) => <p key={i}>{message}</p>)}
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-divider)] pt-4">
        <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {t(pending ? "coupons.saving" : coupon ? "common.save" : "coupons.create")}
        </Button>
      </div>
    </form>
  );
}
