import { useTranslation } from "react-i18next";
import { couponLifecycle } from "../lib/couponPresentation";
import type { Coupon } from "../types";

const statusColors = {
  active: "bg-emerald-50 text-emerald-800",
  scheduled: "bg-blue-50 text-blue-800",
  expired: "bg-amber-50 text-amber-900",
  disabled: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  unknown: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
};
export function CouponStatus({ coupon }: { coupon: Coupon }) {
  const { t } = useTranslation();
  const status = couponLifecycle(coupon);
  return (
    <div className="space-y-1 text-sm">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[status]}`}
      >
        {t(`coupons.lifecycle.${status}`)}
      </span>
      <p className="text-xs text-[var(--color-muted)]">
        {t(coupon.isActive ? "coupons.enabled" : "coupons.disabled")}
      </p>
    </div>
  );
}
