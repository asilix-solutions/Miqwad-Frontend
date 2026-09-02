/**
 * @file dealerApi.ts
 *
 * Dealer API client.
 *
 * ORDERS are LIVE (Phase B): `GET /api/Orders` and `GET /api/Orders/{id}` on
 * the shared axios instance, envelope-aware (`{ success, message, data,
 * errors }`). Results are provider-scoped by the JWT — a single provider
 * across varying customers — so we add NO client-side dealer filter and
 * trust the server scope. Read-only: there are no status-transition / ship /
 * cancel endpoints, so this client exposes no order mutations.
 *
 * `orderType` is forwarded as the `OrderType` query param (numeric enum,
 * validated live). SHIPMENTS + DUES have no live endpoints yet and still go
 * through the always-mocked `/dealer/*` bridge.
 *
 * Products are not here — a dealer "product" is a `/api/provider-services`
 * row (see `providerServicesApi.ts`).
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";
import type {
  DealerDues,
  DealerOrdersListParams,
  DealerShipmentsListParams,
  Shipment,
} from "../types";

// ── Raw live contract (GET /api/Orders — confirmed 2026-09-01) ───────────────

/** One line on an order (`orderItems[]`). */
export interface RawDealerOrderItem {
  id: number;
  providerServiceId: number;
  serviceName: string | null;
  providerName: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number | null;
}

/**
 * Raw order — same polymorphic object on the list row and the detail
 * response. Enum fields are NUMBERS. `createdAt` has NO timezone suffix.
 * `totalItems` is 0 on every list row (only valid on detail) — the adapter
 * uses `orderItems.length` instead.
 */
export interface RawDealerOrder {
  id: number;
  userId: number;
  userFullName: string | null;
  orderType: number;
  status: number;
  paymentMethod: number | null;
  paymentStatus: number | null;
  trackNumber: string | null;
  subtotal: number | null;
  discountAmount: number | null;
  totalPrice: number | null;
  addressTitle: string | null;
  addressDescription: string | null;
  addressShortNumber: string | null;
  addressLatitude: number | null;
  addressLongitude: number | null;
  deliveryCompany: unknown | null;
  createdAt: string;
  totalItems: number;
  orderItems: RawDealerOrderItem[] | null;
  attachments: unknown[] | null;
}

interface RawOrdersPage {
  items: RawDealerOrder[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 20;

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

function fromRawPage(page: RawOrdersPage | null | undefined): PaginatedResponse<RawDealerOrder> {
  if (!page) {
    return { items: [], page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 };
  }
  return {
    items: page.items ?? [],
    page: page.pageNumber,
    pageSize: page.pageSize,
    total: page.totalCount,
    totalPages: page.totalPages,
  };
}

export const dealerApi = {
  // ── Orders (LIVE) ─────────────────────────────────────────────────────────
  getOrders: async (
    params: DealerOrdersListParams = {},
  ): Promise<PaginatedResponse<RawDealerOrder>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawOrdersPage | null>>("/Orders", {
      params: {
        PageNumber: params.pageNumber ?? 1,
        PageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        // axios drops `undefined` params, so an "all" selection omits the key.
        OrderType: params.orderType,
      },
    });
    return fromRawPage(unwrap(data));
  },

  getOrder: async (id: string): Promise<RawDealerOrder> => {
    const { data } = await apiClient.get<ApiEnvelope<RawDealerOrder>>(`/Orders/${id}`);
    return unwrap(data);
  },

  // ── Shipments + dues (mock /dealer/* bridge) ──────────────────────────────
  getShipments: async (
    params: DealerShipmentsListParams = {},
  ): Promise<PaginatedResponse<Shipment>> => {
    const { data } = await apiClient.get<PaginatedResponse<Shipment>>("/dealer/shipments", { params });
    return data;
  },
  updateShipmentStatus: async (id: string, status: Shipment["status"]): Promise<Shipment> => {
    const { data } = await apiClient.patch<Shipment>(`/dealer/shipments/${id}/status`, { status });
    return data;
  },
  getDues: async (): Promise<DealerDues> => {
    const { data } = await apiClient.get<DealerDues>("/dealer/dues");
    return data;
  },
};
