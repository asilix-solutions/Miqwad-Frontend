/**
 * @file useInvoicesQueries.ts
 * @description TanStack Query hooks for the admin Invoices module. Server-state
 * only — no Redux slice, no toasts (hooks are silent; UI shows feedback).
 * READ-ONLY: there are no mutation hooks.
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { invoicesApi, adaptRawInvoice } from "../api/invoicesApi";
import type { InvoicesListParams } from "../types";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (params: InvoicesListParams = {}) => [...invoiceKeys.all, "list", params] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};

export function useInvoicesList(params: InvoicesListParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: async () => {
      const page = await invoicesApi.list(params);
      return { ...page, items: page.items.map(adaptRawInvoice) };
    },
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => adaptRawInvoice(await invoicesApi.get(id)),
    enabled: !!id,
  });
}
