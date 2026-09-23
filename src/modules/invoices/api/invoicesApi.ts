/**
 * @file invoicesApi.ts
 * @description GET-only transport. Preserve the complete invoice entity and
 * translate only pagination metadata into the shared table contract.
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { Invoice, InvoicesListParams } from "../types";

interface InvoiceEnvelope<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors: string[] | null;
}
interface RawPage {
  items: Invoice[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
function unwrap<T>(envelope: InvoiceEnvelope<T>): T {
  // A business error is not proof of HTTP 404; show a retryable error.
  if (!envelope.success) throw new Error("Invoice request unsuccessful");
  return envelope.data;
}
function positiveInteger(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}
export const invoicesApi = {
  list: async (params: InvoicesListParams = {}): Promise<PaginatedResponse<Invoice>> => {
    const { data } = await apiClient.get<InvoiceEnvelope<RawPage>>("/Invoices", {
      params: {
        PageNumber: positiveInteger(params.pageNumber, 1),
        PageSize: Math.min(positiveInteger(params.pageSize, 20), 100),
        SortBy: params.sortBy,
        SortDescending: params.sortBy ? params.sortDescending : undefined,
      },
    });
    const page = unwrap(data);
    // A malformed success must not masquerade as an empty invoice register.
    if (
      !page ||
      (!Array.isArray(page.items) && !(page.items === null && page.totalCount === 0)) ||
      !Number.isInteger(page.pageNumber) ||
      page.pageNumber < 1 ||
      !Number.isInteger(page.pageSize) ||
      page.pageSize < 1 ||
      !Number.isInteger(page.totalCount) ||
      page.totalCount < 0 ||
      !Number.isInteger(page.totalPages) ||
      page.totalPages < 0
    ) {
      throw new Error("Invalid invoice pagination");
    }
    return {
      items: page.items ?? [],
      page: page.pageNumber,
      pageSize: page.pageSize,
      total: page.totalCount,
      totalPages: page.totalPages,
    };
  },
  get: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.get<InvoiceEnvelope<Invoice | null>>(
      `/Invoices/${encodeURIComponent(id)}`,
    );
    const invoice = unwrap(data);
    if (!invoice) throw new Error("Missing invoice response");
    return invoice;
  },
};
