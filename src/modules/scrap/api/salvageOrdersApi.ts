/**
 * @file salvageOrdersApi.ts
 *
 * Data layer for browsing customer salvage requests. There is no dedicated
 * "part request" resource on the backend — a customer part request IS an
 * `Order` record with `OrderType = salvage` (see
 * docs/probe-scrap-offers-2026-08-20.md §1.1). The adapter below is the ONE
 * place that knows the raw `Order` field names; every other file binds only
 * to the `SalvageOrder` view model from `../types`.
 *
 * SOURCE SWITCH — flip this one constant once the backend fixes the list
 * endpoint bug below (confirmed docs/verify-scrap-orders-offers-2026-08-23.md):
 *
 *   const SALVAGE_ORDERS_SOURCE: "fixture" | "live" = "live";
 *
 * CONFIRMED LIVE (2026-08-23, SalvageSpecialist token, userId 40):
 *   - GET /api/Orders/{id} works (200) and returns the real Order detail
 *     shape used by the adapter below — including `orderType: 2` for a
 *     salvage-shaped order (brandName/brandModel/brandYear/piecesName/
 *     serialNumber/attachments/offers present). This CONFIRMS OrderType=2
 *     is the salvage integer.
 *   - GET /api/Orders (the LIST endpoint) returns 400 "بيانات غير صالحة"
 *     UNCONDITIONALLY for this role — every OrderType value 0-5, string
 *     names ("Salvage","SpareParts"), with/without paging, with/without
 *     FilterBy/FilterValue all 400. This is NOT an auth problem (GET
 *     /api/Offers and GET /api/Orders/{id} both 200 on the same token;
 *     missing/garbage tokens 401 as expected, which rules out a silently
 *     swallowed 403). This is a backend-side bug/restriction on the list
 *     endpoint for the SalvageSpecialist role — flagged for the architect,
 *     NOT fixable from the frontend query. Full probe transcript:
 *     docs/verify-scrap-orders-offers-2026-08-23.md.
 *
 * Fixture data mirrors the real Order/salvage Swagger shape so the browse +
 * offer UI is fully reviewable before the backend gap closes. The query
 * logic below is wired correctly and ready to flip once the list 400 is
 * fixed server-side.
 */

import { apiClient } from "@shared/lib/axios";
import { AppError } from "@shared/types/api";
import type { PaginatedResponse } from "@shared/types/api";
import type { SalvageOrder } from "../types";

// ── Source switch ─────────────────────────────────────────────────────────────

const SALVAGE_ORDERS_SOURCE: "fixture" | "live" = "fixture";

/**
 * CONFIRMED via GET /api/Orders/{id} on a real order (2026-08-23): the
 * dedicated `OrderType` integer query param, value 2 = salvage. The Swagger
 * `OrderType` schema enumerates 1-5 with no `x-enum-names`; 2 was isolated
 * by cross-checking a real order's `orderType: 2` field against its
 * salvage-shaped payload (piecesName/brandName/serialNumber present).
 */
const SALVAGE_ORDER_TYPE = 2;

// ── Raw backend shape (adapter input, matches the real GET /Orders/{id} shape) ─

interface RawSalvageOrder {
  id: number | string;
  userId?: number;
  userFullName?: string;
  orderType?: number;
  /** Raw backend order status — integer enum, unconfirmed label mapping. */
  status?: number | string;
  brandName?: string;
  brandModel?: string;
  brandYear?: string;
  piecesName?: string;
  serialNumber?: string;
  attachments?: string[];
  createdAt?: string;
}

interface RawOrdersPage {
  items: RawSalvageOrder[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ── Adapter ──────────────────────────────────────────────────────────────────

function adaptSalvageOrder(raw: RawSalvageOrder): SalvageOrder {
  return {
    id: String(raw.id),
    partName: raw.piecesName ?? "",
    brand: raw.brandName ?? "",
    model: raw.brandModel ?? "",
    year: raw.brandYear ?? "",
    serialNumber: raw.serialNumber,
    photos: raw.attachments ?? [],
    customerName: raw.userFullName,
    status: String(raw.status ?? "unknown"),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

// ── Fixture photos (offline SVG data-URIs, no external requests) ───────────────

function svgPhoto(label: string): string {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#f1f5f9"/><circle cx="200" cy="130" r="70" fill="#cbd5e1" stroke="#94a3b8" stroke-width="4"/><circle cx="200" cy="130" r="30" fill="#94a3b8"/><text x="200" y="240" text-anchor="middle" font-size="20" font-family="Arial,sans-serif" fill="#94a3b8">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

// ── Fixture data (matches the Swagger Order/salvage shape) ─────────────────────

const FIXTURE_ORDERS: RawSalvageOrder[] = [
  {
    id: 101,
    brandName: "Toyota",
    brandModel: "Camry",
    brandYear: "2019",
    piecesName: "مرفاع أمامي أيمن",
    serialNumber: "TC19-4471",
    attachments: [svgPhoto("1")],
    status: "Pending",
    createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    userFullName: "محمد العمري",
  },
  {
    id: 102,
    brandName: "Nissan",
    brandModel: "Patrol",
    brandYear: "2017",
    piecesName: "مضخة ماء",
    serialNumber: "NP17-2290",
    attachments: [svgPhoto("2")],
    status: "Pending",
    createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    userFullName: "خالد البقمي",
  },
  {
    id: 103,
    brandName: "BMW",
    brandModel: "X5",
    brandYear: "2018",
    piecesName: "كمبروسر تكييف",
    attachments: [svgPhoto("3")],
    status: "Pending",
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    userFullName: "فيصل الدوسري",
  },
  {
    id: 104,
    brandName: "Mercedes",
    brandModel: "E200",
    brandYear: "2016",
    piecesName: "علبة مراية جانبية",
    serialNumber: "ME16-0087",
    attachments: [svgPhoto("4")],
    status: "Pending",
    createdAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    userFullName: "سلطان القحطاني",
  },
  {
    id: 105,
    brandName: "Ford",
    brandModel: "F-150",
    brandYear: "2021",
    piecesName: "هيكل أمامي",
    attachments: [svgPhoto("5"), svgPhoto("6")],
    status: "Pending",
    createdAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    userFullName: "ناصر الشمري",
  },
];

// ── Result type (carries the friendly-403 signal separately from data) ─────────

export type SalvageOrdersResult =
  | { kind: "ok"; data: PaginatedResponse<SalvageOrder> }
  | { kind: "forbidden" };

export interface SalvageOrdersParams {
  page?: number;
  pageSize?: number;
}

export const salvageOrdersApi = {
  list: async (params: SalvageOrdersParams = {}): Promise<SalvageOrdersResult> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 100;

    if (SALVAGE_ORDERS_SOURCE === "fixture") {
      const total = FIXTURE_ORDERS.length;
      const sliced = FIXTURE_ORDERS.slice((page - 1) * pageSize, page * pageSize);
      return {
        kind: "ok",
        data: {
          items: sliced.map(adaptSalvageOrder),
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    }

    try {
      const { data } = await apiClient.get<{ data: RawOrdersPage }>("/Orders", {
        params: {
          OrderType: SALVAGE_ORDER_TYPE,
          PageNumber: page,
          PageSize: pageSize,
        },
      });
      const raw = data.data;
      return {
        kind: "ok",
        data: {
          items: raw.items.map(adaptSalvageOrder),
          page: raw.pageNumber,
          pageSize: raw.pageSize,
          total: raw.totalCount,
          totalPages: raw.totalPages,
        },
      };
    } catch (err) {
      // 403: role genuinely lacks access. 400: the confirmed backend bug on
      // this list endpoint (see header comment) — treated the same so the UI
      // shows a friendly blocked state instead of a raw error.
      if (err instanceof AppError && (err.status === 403 || err.status === 400)) {
        return { kind: "forbidden" };
      }
      throw err;
    }
  },

  get: async (id: string): Promise<SalvageOrder | null> => {
    if (SALVAGE_ORDERS_SOURCE === "fixture") {
      const raw = FIXTURE_ORDERS.find((o) => String(o.id) === id);
      return raw ? adaptSalvageOrder(raw) : null;
    }

    try {
      const { data } = await apiClient.get<{ data: RawSalvageOrder }>(`/Orders/${id}`);
      return adaptSalvageOrder(data.data);
    } catch (err) {
      if (err instanceof AppError && err.status === 403) return null;
      throw err;
    }
  },
};
