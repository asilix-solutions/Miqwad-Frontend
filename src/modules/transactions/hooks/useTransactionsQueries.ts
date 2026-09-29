import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../api/transactionsApi";
import { createDealerBalance } from "../lib/createDealerBalance";
import type { TransactionsListParams, UpdateTransactionRequest } from "../types";

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: ["transactions", "list"] as const,
  list: (params: TransactionsListParams) => ["transactions", "list", params] as const,
  detail: (id: number) => ["transactions", "detail", id] as const,
  dealer: (id: number) => ["transactions", "dealer", id] as const,
};
export function useTransactionsList(params: TransactionsListParams) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsApi.list(params),
    retry: false,
  });
}
export function useTransaction(id: number) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionsApi.detail(id),
    enabled: id > 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
export function useDealerTransaction(id: number) {
  return useQuery({
    queryKey: transactionKeys.dealer(id),
    queryFn: () => transactionsApi.byDealer(id),
    enabled: id > 0,
    retry: false,
  });
}
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDealerBalance,
    retry: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}
export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTransactionRequest }) =>
      transactionsApi.update(id, input),
    retry: false,
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transactionsApi.remove,
    retry: false,
    onSuccess: async (_data, id) => {
      await qc.cancelQueries({ queryKey: transactionKeys.detail(id) });
      qc.removeQueries({ queryKey: transactionKeys.detail(id) });
      await qc.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
