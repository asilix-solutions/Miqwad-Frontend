/** Live read entity; nullable fields also preserve Swagger's wider contract. */
export interface Coupon {
  id: number;
  code: string | null;
  discountPercentage: number;
  minimumOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export type CouponFilter =
  | { by: "code"; value: string }
  | { by: "isActive"; value: "true" | "false" };
export type CouponSort = "createdAt" | "endDate" | "usedCount";

export interface CouponsListParams {
  page: number;
  pageSize: number;
  filter?: CouponFilter;
  fromDate?: string;
  toDate?: string;
  sortBy: CouponSort;
  sortDescending: boolean;
}

/** PUT deliberately excludes code, activation and server-managed fields. */
export interface UpdateCouponRequest {
  discountPercentage: number;
  minimumOrderAmount: number | null;
  usageLimit: number | null;
  startDate: string;
  endDate: string | null;
}
export interface CreateCouponRequest extends UpdateCouponRequest {
  code: string;
}
