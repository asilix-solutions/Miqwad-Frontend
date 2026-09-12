/**
 * @file useInvoicesQueries.ts
 * @description Invoice server state; no mutations or duplicate client store.
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { invoicesApi } from "../api/invoicesApi";
import type { InvoicesListParams } from "../types";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (params: InvoicesListParams = {}) => [...invoiceKeys.all, "list", params] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};
export function useInvoicesList(params: InvoicesListParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoicesApi.list(params),
    placeholderData: keepPreviousData,
  });
}
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesApi.get(id),
    enabled: /^[1-9]\d*$/.test(id),
  });
}
