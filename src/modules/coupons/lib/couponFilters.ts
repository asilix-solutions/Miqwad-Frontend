import type { CouponsListParams, CouponSort } from "../types";

export interface CouponFiltersValue {
  mode: "all" | "code" | "enabled" | "disabled";
  code: string;
  fromDate: string;
  toDate: string;
  sortBy: CouponSort;
  sortDescending: boolean;
}
export const defaultCouponFilters: CouponFiltersValue = {
  mode: "all",
  code: "",
  fromDate: "",
  toDate: "",
  sortBy: "createdAt",
  sortDescending: true,
};
export function couponFiltersParams(
  value: CouponFiltersValue,
): Omit<CouponsListParams, "page" | "pageSize"> {
  return {
    ...(value.mode === "code" && value.code.trim()
      ? { filter: { by: "code" as const, value: value.code.trim() } }
      : value.mode === "enabled" || value.mode === "disabled"
        ? {
            filter: {
              by: "isActive" as const,
              value: value.mode === "enabled" ? ("true" as const) : ("false" as const),
            },
          }
        : {}),
    fromDate: value.fromDate ? `${value.fromDate}:00` : undefined,
    toDate: value.toDate ? `${value.toDate}:00` : undefined,
    sortBy: value.sortBy,
    sortDescending: value.sortDescending,
  };
}
