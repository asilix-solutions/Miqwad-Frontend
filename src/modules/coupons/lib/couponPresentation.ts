import { AppError } from "@shared/types/api";
import type { Coupon } from "../types";

export function couponLifecycle(coupon: Coupon, now = Date.now()) {
  if (!coupon.isActive) return "disabled";
  const start = new Date(coupon.startDate).getTime();
  const end = coupon.endDate === null ? null : new Date(coupon.endDate).getTime();
  if (!Number.isFinite(start) || (end !== null && !Number.isFinite(end))) return "unknown";
  if (end !== null && end < now) return "expired";
  if (start > now) return "scheduled";
  return "active";
}
export function couponAmount(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 20,
  }).format(value);
}
export function couponPercentage(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 20 }).format(
    value / 100,
  );
}
export function couponErrorKey(error: unknown) {
  if (error instanceof AppError) {
    if (error.status === 404) return "coupons.errors.notFound";
    if (error.status === 403) return "coupons.errors.forbidden";
    if (error.status === 409) return "coupons.errors.conflict";
    if (error.status === 400 || error.code === "COUPON_REJECTED")
      return "coupons.errors.validation";
  }
  return "coupons.errors.request";
}
/** Preserve the backend's bare-local calendar values, including unchanged precision. */
export function couponDateInput(value: string | null) {
  return value?.slice(0, 16) ?? "";
}
export function couponWriteDate(value: string, original?: string | null) {
  return original && couponDateInput(original) === value ? original : `${value}:00`;
}
