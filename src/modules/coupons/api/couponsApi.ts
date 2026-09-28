import { z } from "zod";
import { apiClient } from "@shared/lib/axios";
import { AppError, type PaginatedResponse } from "@shared/types/api";
import type { Coupon, CouponsListParams, CreateCouponRequest, UpdateCouponRequest } from "../types";

const couponSchema = z.object({
  id: z.number().int().positive().safe(),
  code: z.string().nullable(),
  discountPercentage: z.number(),
  minimumOrderAmount: z.number().nullable(),
  usageLimit: z.number().int().nullable(),
  usedCount: z.number().int(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
const envelopeSchema = z.object({
  success: z.boolean(),
  message: z.string().nullable(),
  data: z.unknown(),
  errors: z.unknown(),
});
const pageSchema = z.object({
  items: z.array(couponSchema),
  pageNumber: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

function unwrap(raw: unknown): unknown {
  const result = envelopeSchema.safeParse(raw);
  if (!result.success) throw new AppError("Invalid coupon envelope", "COUPON_CONTRACT");
  if (!result.data.success) {
    const errors = z.array(z.string()).safeParse(result.data.errors);
    throw new AppError(
      result.data.message ?? "Coupon request failed",
      "COUPON_REJECTED",
      undefined,
      undefined,
      errors.success ? errors.data : undefined,
    );
  }
  return result.data.data;
}

export function couponQueryParams(params: CouponsListParams) {
  return {
    PageNumber: params.page,
    PageSize: params.pageSize,
    SortBy: params.sortBy,
    SortDescending: params.sortDescending,
    FilterBy: params.filter?.by,
    FilterValue: params.filter?.value,
    DateFilterBy: params.fromDate || params.toDate ? "createdAt" : undefined,
    FromDate: params.fromDate || undefined,
    ToDate: params.toDate || undefined,
  };
}

async function fetchPage(params: CouponsListParams): Promise<PaginatedResponse<Coupon>> {
  const { data } = await apiClient.get<unknown>("/Coupons", { params: couponQueryParams(params) });
  const page = pageSchema.safeParse(unwrap(data));
  if (!page.success) throw new AppError("Invalid coupon page", "COUPON_CONTRACT");
  return {
    items: page.data.items,
    page: page.data.pageNumber,
    pageSize: page.data.pageSize,
    total: page.data.totalCount,
    totalPages: page.data.totalPages,
  };
}
const path = (id: number) => `/Coupons/${encodeURIComponent(id)}`;

// Construct write DTOs explicitly, even when callers hold a richer entity.
function updateBody(input: UpdateCouponRequest): UpdateCouponRequest {
  return {
    discountPercentage: input.discountPercentage,
    minimumOrderAmount: input.minimumOrderAmount,
    usageLimit: input.usageLimit,
    startDate: input.startDate,
    endDate: input.endDate,
  };
}
export const couponsApi = {
  async list(params: CouponsListParams): Promise<PaginatedResponse<Coupon>> {
    const page = await fetchPage(params);
    const lastPage = Math.max(1, page.totalPages);
    // The backend returns an empty, successful page for out-of-range requests.
    // Recover once after deletions/filter changes, without an unbounded retry loop.
    return page.page > lastPage ? fetchPage({ ...params, page: lastPage }) : page;
  },
  async detail(id: number): Promise<Coupon> {
    const { data } = await apiClient.get<unknown>(path(id));
    const coupon = couponSchema.safeParse(unwrap(data));
    if (!coupon.success) throw new AppError("Invalid coupon detail", "COUPON_CONTRACT");
    return coupon.data;
  },
  async create(input: CreateCouponRequest): Promise<void> {
    const { data } = await apiClient.post<unknown>("/Coupons", {
      code: input.code,
      ...updateBody(input),
    });
    unwrap(data);
  },
  async update(id: number, input: UpdateCouponRequest): Promise<void> {
    const { data } = await apiClient.put<unknown>(path(id), updateBody(input));
    unwrap(data);
  },
  async toggle(id: number): Promise<void> {
    const { data } = await apiClient.patch<unknown>(`${path(id)}/toggle-active`);
    unwrap(data);
  },
  async remove(id: number): Promise<void> {
    const { data } = await apiClient.delete<unknown>(path(id));
    unwrap(data);
  },
};
