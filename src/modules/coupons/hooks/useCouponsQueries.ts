import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { couponsApi } from "../api/couponsApi";
import type { CouponsListParams, CreateCouponRequest, UpdateCouponRequest } from "../types";

export const couponKeys = {
  lists: ["coupons", "list"] as const,
  list: (params: CouponsListParams) => [...couponKeys.lists, params] as const,
  detail: (id: number) => ["coupons", "detail", id] as const,
};
export function useCouponsList(params: CouponsListParams) {
  return useQuery({
    queryKey: couponKeys.list(params),
    queryFn: () => couponsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
export function useCoupon(id: number) {
  return useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => couponsApi.detail(id),
    enabled: id > 0,
    gcTime: 0, // Dialogs always reopen from a fresh detail read.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}
export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCouponRequest) => couponsApi.create(input),
    retry: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: couponKeys.lists }),
  });
}
export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateCouponRequest }) =>
      couponsApi.update(id, input),
    retry: false,
    onSuccess: (_data, { id }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: couponKeys.lists }),
        qc.invalidateQueries({ queryKey: couponKeys.detail(id) }),
      ]),
  });
}
export function useToggleCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: couponsApi.toggle,
    retry: false,
    onSuccess: (_data, id) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: couponKeys.lists }),
        qc.invalidateQueries({ queryKey: couponKeys.detail(id) }),
      ]),
  });
}
export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: couponsApi.remove,
    retry: false,
    onSuccess: async (_data, id) => {
      await qc.cancelQueries({ queryKey: couponKeys.detail(id) });
      qc.removeQueries({ queryKey: couponKeys.detail(id) });
      await qc.invalidateQueries({ queryKey: couponKeys.lists });
    },
  });
}
