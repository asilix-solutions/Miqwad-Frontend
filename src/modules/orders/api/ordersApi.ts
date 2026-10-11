/**
 * @file ordersApi.ts
 * @description Real-backend API layer for /api/Orders. Envelope-aware
 * (`{ success, message, data, errors }`), mirrors
 * src/modules/addresses/api/addressesApi.ts. READ returns orderType/status/
 * paymentMethod as NUMERIC enum codes (live-probed 2026-09-01: orderType &
 * status always numbers, paymentMethod number|null); PUT also expects the
 * numeric codes. lib/orderAdapter.ts maps both directions via the canonical
 * enum maps in lib/orderEnums.ts. No create (POST) — orders are created by
 * customers, not admins. PageSize capped at 100.
 *
 * Type filtering is SERVER-SIDE: pass `orderType` (numeric enum) and it is
 * sent as `OrderType` on GET /Orders (live-verified: 200 + filtered
 * totalCount for valid values, 400 for invalid). The old client-side
 * type workaround is obsolete. Status filtering stays client-side
 * (unchanged); trackNumber search stays FilterBy=trackNumber (unchanged).
 */
import type { AxiosRequestConfig } from "axios";
import { AppError } from "@shared/types/api";
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";

/** One line on a SpareParts order (present in `orderItems` on GET /{id}). */
export interface RawOrderItem {
  id: number;
  providerServiceId: number;
  serviceName: string | null;
  providerName: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number | null;
}

/** Customer-uploaded file (present in `attachments`). */
export interface RawAttachment {
  id: number;
  originalFileName: string | null;
  filePath: string | null;
  contentType: string | null;
  type: number;
  fileSize: number;
  createdAt: string;
  userName: string | null;
}

export interface RawOrder {
  id: number;
  /** Tow-truck fields observed in list and detail GET, 2026-10-08. */
  orderNumber?: string | null;
  customerPhoneNumber?: string | null;
  vehicleId?: number | null;
  plateNumber?: string | null;
  destinationAddressTitle?: string | null;
  destinationAddressDescription?: string | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  towTruckDriverId?: number | null;
  towTruckDriverFullName?: string | null;
  duration?: string | null;
  notes?: string | null;
  userId: number;
  userFullName: string;
  /** Numeric OrderType enum (SpareParts=1…Mojaz=5). */
  orderType: number;
  /** Numeric OrderStatus enum (InWaiting=1…Canceled=5). */
  status: number;
  /** Numeric PaymentMethod enum (Cash=1…BankTransfer=4); null for orders with no payment leg (e.g. salvage). */
  paymentMethod: number | null;
  /** Numeric PaymentStatus enum; live-probed values {0,1,2,3,4}|null (0/null = no status). */
  paymentStatus?: number | null;
  trackNumber: string | null;
  createdAt: string;
  /** Amounts — always present (0 when the order has no priced items). */
  subtotal?: number;
  discountAmount?: number;
  totalPrice?: number;
  /** Delivery address block — populated on SpareParts orders, null strings otherwise. */
  addressTitle?: string | null;
  addressDescription?: string | null;
  addressShortNumber?: string | null;
  addressLatitude?: number | null;
  addressLongitude?: number | null;
  /** Present only on SpareParts (and empty on TowTruck) orders. */
  orderItems?: RawOrderItem[];
  /** Present on every order; often []. */
  attachments?: RawAttachment[];
  /** Salvage-request vehicle block — present only on Salvage orders. */
  brandName?: string | null;
  brandModel?: string | null;
  brandYear?: string | null;
  piecesName?: string | null;
  serialNumber?: string | null;
}

export type OrdersReadPage<T> = PaginatedResponse<T> & { serverPaginated: boolean };

interface RawPage<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface OrderWritePayload {
  type: number;
  paymentMethod: number;
  status: number;
  trackNumber: string;
}

/** Initial tow-truck quote; only the dedicated dispatch flow may call this. */
export interface TowTruckAssignmentPayload {
  towTruckDriverId: number;
  cost: number;
  duration: string;
}

export interface OrdersListParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  filterBy?: string;
  filterValue?: string;
  dateFilterBy?: string;
  fromDate?: string;
  toDate?: string;
  /** Numeric order-type enum (SpareParts=1…Mojaz=5). Omitted when undefined. */
  orderType?: number;
}

const DEFAULT_PAGE_SIZE = 100;

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

function fromRawPage<T>(page: RawPage<T> | T[] | null | undefined): OrdersReadPage<T> {
  if (!page) {
    return {
      serverPaginated: false,
      items: [],
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    };
  }
  if (Array.isArray(page)) {
    return {
      serverPaginated: false,
      items: page,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: page.length,
      totalPages: page.length ? 1 : 0,
    };
  }
  return {
    serverPaginated: Array.isArray(page.items),
    items: page.items ?? [],
    page: page.pageNumber,
    pageSize: page.pageSize,
    total: page.totalCount,
    totalPages: page.totalPages,
  };
}

export const ordersApi = {
  list: async (
    params: OrdersListParams = {},
    signal?: AbortSignal,
  ): Promise<OrdersReadPage<RawOrder>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawPage<RawOrder> | RawOrder[] | null>>(
      "/Orders",
      {
        signal,
        params: {
          PageNumber: params.pageNumber ?? 1,
          PageSize: Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE),
          SortBy: params.sortBy,
          SortDescending: params.sortDescending,
          FilterBy: params.filterBy,
          FilterValue: params.filterValue,
          DateFilterBy: params.dateFilterBy,
          FromDate: params.fromDate,
          ToDate: params.toDate,
          // Sent only when defined; axios drops `undefined` params, so an
          // "all" selection (orderType === undefined) omits the key entirely.
          OrderType: params.orderType,
        },
      },
    );
    return fromRawPage(unwrap(data));
  },

  get: async (id: string, signal?: AbortSignal): Promise<RawOrder> => {
    const { data } = await apiClient.get<ApiEnvelope<RawOrder>>(`/Orders/${id}`, { signal });
    return unwrap(data);
  },

  assignTowTruckDriver: async (id: string, payload: TowTruckAssignmentPayload): Promise<void> => {
    // Keep shared auth/language interceptors, but never refresh-and-replay a PUT.
    const config: AxiosRequestConfig & { _retry: boolean } = { _retry: true };
    const { data } = await apiClient.put<ApiEnvelope<unknown>>(
      `/Orders/${id}/tow-truck-driver`,
      payload,
      config,
    );
    if (data?.success === false) {
      const errors = Array.isArray(data.errors)
        ? data.errors.filter((value): value is string => typeof value === "string")
        : undefined;
      throw new AppError(
        data.message || "Assignment rejected",
        "ASSIGNMENT_REJECTED",
        422,
        undefined,
        errors,
      );
    }
    // The documented acknowledgment is {success:true}. A malformed 2xx is an
    // uncertain outcome, not permission to repeat the write.
    if (data?.success !== true)
      throw new AppError("Unconfirmed assignment response", "ASSIGNMENT_UNCERTAIN");
  },

  update: async (id: string, payload: OrderWritePayload): Promise<RawOrder> => {
    const { data } = await apiClient.put<ApiEnvelope<RawOrder>>(`/Orders/${id}`, payload);
    return unwrap(data);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/Orders/${id}`);
  },
};
