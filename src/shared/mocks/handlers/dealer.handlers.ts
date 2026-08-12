/**
 * In-process mock for Dealer Dashboard — orders, shipments, dues.
 *
 * Products no longer live here: a dealer "product" is a real
 * `/api/provider-services` row (see `providerServicesApi.ts`), never routed
 * through this always-mocked `dealer/` bridge. The seed products below are
 * kept as internal, non-exposed data purely to build the order/shipment
 * seed line items — they are not the dealer module's `Product` type and no
 * `dealer/products` endpoint is matched anymore.
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type { PaginatedResponse } from "../../types/api";
import type {
  Order,
  OrderStatus,
  Shipment,
  ShipmentStatus,
  DealerDues,
} from "../../../modules/dealer/types";
import { canTransition } from "../../../modules/dealer/orderLifecycle";
import { canTransitionShipment } from "../../../modules/dealer/shipmentLifecycle";

/** Internal-only seed shape for order line items — not the dealer `Product` API type. */
interface SeedProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  sku: string;
  price: number;
  stockQty: number;
}

interface DealerDb {
  products: Record<string, SeedProduct>;
  orders: Record<string, Order>;
  shipments: Record<string, Shipment>;
  dues: Record<string, DealerDues>;
  nextId: number;
  seeded: boolean;
}

const DEALER_DB_KEY = "maqwad.dealer.mockDb";
const MOCK_SEED_VERSION = 3; // bumped: dropped inventory/product endpoints — products now live in /api/provider-services
const MOCK_SEED_VERSION_KEY = "maqwad.dealer.mockSeedVersion";
const DEALER_ID = "7"; // Matches seed_provider_7's numeric ID (which is used as providerId in FE state)
const COMMISSION_RATE = 5;

function loadDb(): DealerDb {
  try {
    const storedVersionStr = localStorage.getItem(MOCK_SEED_VERSION_KEY);
    const storedVersion = storedVersionStr ? parseInt(storedVersionStr, 10) : 0;

    if (storedVersion !== MOCK_SEED_VERSION) {
      localStorage.removeItem(DEALER_DB_KEY);
      localStorage.setItem(MOCK_SEED_VERSION_KEY, MOCK_SEED_VERSION.toString());
      return { products: {}, orders: {}, shipments: {}, dues: {}, nextId: 1000, seeded: false };
    }

    const raw = localStorage.getItem(DEALER_DB_KEY);
    if (raw) return JSON.parse(raw) as DealerDb;
  } catch {
    /* ignore */
  }
  return { products: {}, orders: {}, shipments: {}, dues: {}, nextId: 1000, seeded: false };
}

function saveDb(db: DealerDb): void {
  localStorage.setItem(DEALER_DB_KEY, JSON.stringify(db));
}

function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  };
}

function fail(config: InternalAxiosRequestConfig, status: number, code: string, message: string) {
  const err = new Error(message) as Error & {
    isAxiosError: boolean;
    response: AxiosResponse;
    config: InternalAxiosRequestConfig;
  };
  err.isAxiosError = true;
  err.config = config;
  err.response = {
    data: { code, message },
    status,
    statusText: "Error",
    headers: new AxiosHeaders(),
    config,
  };
  return err;
}

function paginate<T>(items: T[], pageStr?: string, pageSizeStr?: string): PaginatedResponse<T> {
  const page = parseInt(pageStr || "1", 10);
  const pageSize = parseInt(pageSizeStr || "10", 10);
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    items: items.slice(start, end),
    page,
    pageSize,
    total,
    totalPages,
  };
}

function seedIfEmpty(db: DealerDb): void {
  if (db.seeded) return;
  const now = new Date().toISOString();

  // 1. Products — seed data only, used to build order line-item snapshots below.
  const productsSeed: SeedProduct[] = [
    { id: "", nameAr: "بطارية سيارة 60 أمبير", nameEn: "60 Ah Car Battery", sku: "BAT-60A", price: 350, stockQty: 100 },
    { id: "", nameAr: "بطارية سيارة 80 أمبير", nameEn: "80 Ah Car Battery", sku: "BAT-80A", price: 450, stockQty: 45 },
    { id: "", nameAr: "زيت محرك 5W-30", nameEn: "5W-30 Engine Oil", sku: "OIL-5W30", price: 120, stockQty: 200 },
  ];

  for (const p of productsSeed) {
    const id = `prod_${db.nextId++}`;
    db.products[id] = { ...p, id };
  }

  // 2. Orders & Shipments
  const productKeys = Object.keys(db.products);
  const p1 = db.products[productKeys[0]];
  const p2 = db.products[productKeys[1]];
  const p3 = db.products[productKeys[2]];

  const ordersSeed: Array<{ customer: string; status: OrderStatus; items: Array<{p: SeedProduct; qty: number}>; hasShipment?: boolean }> = [
    { customer: "أحمد عبدالله", status: "new", items: [{p: p1, qty: 1}, {p: p2, qty: 2}] },
    { customer: "خالد محمد", status: "preparing", items: [{p: p3, qty: 4}] },
    { customer: "سالم الفهد", status: "shipped", items: [{p: p1, qty: 1}], hasShipment: true },
    { customer: "فاطمة سعد", status: "delivered", items: [{p: p1, qty: 2}, {p: p3, qty: 1}], hasShipment: true },
    { customer: "نورة علي", status: "delivered", items: [{p: p2, qty: 1}], hasShipment: true },
    { customer: "يوسف زيد", status: "cancelled", items: [{p: p3, qty: 1}] },
  ];

  let grossSales = 0;

  for (const o of ordersSeed) {
    const id = `ord_${db.nextId++}`;
    
    let subtotal = 0;
    const items = o.items.map(i => {
      const lineTotal = i.p.price * i.qty;
      subtotal += lineTotal;
      return {
        productId: i.p.id,
        nameAr: i.p.nameAr,
        nameEn: i.p.nameEn,
        sku: i.p.sku,
        unitPrice: i.p.price,
        qty: i.qty,
        lineTotal,
      };
    });

    const commissionAmount = subtotal * (COMMISSION_RATE / 100);
    const netToDealer = subtotal - commissionAmount;

    let shipmentId: string | undefined;
    if (o.hasShipment) {
      shipmentId = `shp_${db.nextId++}`;
      db.shipments[shipmentId] = {
        id: shipmentId,
        orderId: id,
        dealerId: DEALER_ID,
        carrier: "SMSA",
        trackingNumber: `TRK${db.nextId}`,
        status: o.status === "delivered" ? "delivered" : "in_transit",
        shippedAt: now,
        deliveredAt: o.status === "delivered" ? now : undefined,
        createdAt: now,
        updatedAt: now,
      };
    }

    db.orders[id] = {
      id,
      dealerId: DEALER_ID,
      customerName: o.customer,
      items,
      subtotal,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      netToDealer,
      status: o.status,
      shipmentId,
      createdAt: now,
      updatedAt: now,
    };

    if (o.status === "delivered") {
      grossSales += subtotal;
    }
  }

  const totalCommission = grossSales * (COMMISSION_RATE / 100);
  const outstandingDebt = 650.50; // Scenario: > 500 to show debtAlert

  db.dues[DEALER_ID] = {
    dealerId: DEALER_ID,
    commissionRate: COMMISSION_RATE,
    grossSales,
    totalCommission,
    netEarnings: grossSales - totalCommission,
    outstandingDebt,
    debtAlert: outstandingDebt > 500,
    updatedAt: now,
  };

  db.seeded = true;
  saveDb(db);
}

export async function tryDealerMock(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  if (!url.startsWith("dealer/")) return null;

  const db = loadDb();
  seedIfEmpty(db);

  let path = url;
  let searchParams = new URLSearchParams();
  if (url.includes("?")) {
    const parts = url.split("?");
    path = parts[0];
    searchParams = new URLSearchParams(parts[1]);
  } else if (config.params) {
    searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") searchParams.append(k, String(v));
    });
  }

  if (path === "dealer/orders" && method === "get") {
    let list = Object.values(db.orders);
    const status = searchParams.get("status");
    if (status) list = list.filter(o => o.status === status);
    
    return ok(config, paginate(list, searchParams.get("page") ?? undefined, searchParams.get("pageSize") ?? undefined));
  }

  const ordMatch = path.match(/^dealer\/orders\/([^/]+)$/);
  if (ordMatch && method === "get") {
    const o = db.orders[ordMatch[1]];
    if (!o) throw fail(config, 404, "ORDER_NOT_FOUND", "Order not found");
    return ok(config, o);
  }

  const ordStatusMatch = path.match(/^dealer\/orders\/([^/]+)\/status$/);
  if (ordStatusMatch && method === "patch") {
    const o = db.orders[ordStatusMatch[1]];
    if (!o) throw fail(config, 404, "ORDER_NOT_FOUND", "Order not found");
    const payload = JSON.parse(config.data || "{}") as { status: OrderStatus };
    if (payload.status === "shipped") {
      throw fail(config, 422, "USE_SHIP_ENDPOINT", "Use POST /dealer/orders/:id/ship to ship an order");
    }
    if (!canTransition(o.status, payload.status)) {
      throw fail(config, 422, "INVALID_TRANSITION", `Cannot transition from '${o.status}' to '${payload.status}'`);
    }
    const now = new Date().toISOString();
    o.status = payload.status;
    o.updatedAt = now;
    // Keep shipment in sync when order is marked delivered
    if (payload.status === "delivered" && o.shipmentId && db.shipments[o.shipmentId]) {
      db.shipments[o.shipmentId].status = "delivered";
      db.shipments[o.shipmentId].deliveredAt = now;
      db.shipments[o.shipmentId].updatedAt = now;
    }
    saveDb(db);
    return ok(config, o);
  }

  const ordShipMatch = path.match(/^dealer\/orders\/([^/]+)\/ship$/);
  if (ordShipMatch && method === "post") {
    const o = db.orders[ordShipMatch[1]];
    if (!o) throw fail(config, 404, "ORDER_NOT_FOUND", "Order not found");
    if (!canTransition(o.status, "shipped")) {
      throw fail(
        config,
        422,
        "INVALID_TRANSITION",
        `Order must be in 'preparing' status to ship (current: '${o.status}')`,
      );
    }
    const payload = JSON.parse(config.data || "{}") as {
      carrier?: string;
      trackingNumber?: string;
    };
    const now = new Date().toISOString();
    const shipmentId = `shp_${db.nextId++}`;
    db.shipments[shipmentId] = {
      id: shipmentId,
      orderId: o.id,
      dealerId: DEALER_ID,
      carrier: payload.carrier,
      trackingNumber: payload.trackingNumber,
      status: "in_transit",
      shippedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    o.status = "shipped";
    o.shipmentId = shipmentId;
    o.updatedAt = now;
    saveDb(db);
    return ok(config, o);
  }

  const ordCancelMatch = path.match(/^dealer\/orders\/([^/]+)\/cancel$/);
  if (ordCancelMatch && method === "post") {
    const o = db.orders[ordCancelMatch[1]];
    if (!o) throw fail(config, 404, "ORDER_NOT_FOUND", "Order not found");
    if (!canTransition(o.status, "cancelled")) {
      throw fail(
        config,
        422,
        "INVALID_TRANSITION",
        `Cannot cancel order in '${o.status}' status`,
      );
    }
    o.status = "cancelled";
    o.updatedAt = new Date().toISOString();
    saveDb(db);
    return ok(config, o);
  }

  if (path === "dealer/shipments" && method === "get") {
    let list = Object.values(db.shipments);
    const status = searchParams.get("status");
    if (status) list = list.filter(s => s.status === status);

    return ok(config, paginate(list, searchParams.get("page") ?? undefined, searchParams.get("pageSize") ?? undefined));
  }

  const shpStatusMatch = path.match(/^dealer\/shipments\/([^/]+)\/status$/);
  if (shpStatusMatch && method === "patch") {
    const s = db.shipments[shpStatusMatch[1]];
    if (!s) throw fail(config, 404, "NOT_FOUND", "Shipment not found");
    const payload = JSON.parse(config.data || "{}") as { status: ShipmentStatus };
    if (!canTransitionShipment(s.status, payload.status)) {
      throw fail(config, 422, "INVALID_TRANSITION", `Cannot transition from '${s.status}' to '${payload.status}'`);
    }
    const now = new Date().toISOString();
    s.status = payload.status;
    s.updatedAt = now;
    if (payload.status === "delivered") {
      s.deliveredAt = now;
      // Sync linked order to "delivered" — fulfillment represents the same event
      const linkedOrder = Object.values(db.orders).find(o => o.id === s.orderId);
      if (linkedOrder && linkedOrder.status !== "delivered") {
        linkedOrder.status = "delivered";
        linkedOrder.updatedAt = now;
      }
    }
    saveDb(db);
    return ok(config, s);
  }

  if (path === "dealer/dues" && method === "get") {
    // Compute dynamically from current orders so dues reflect real activity.
    // FUTURE: real settlement/debt ledger from backend.
    const allOrders = Object.values(db.orders);
    const delivered = allOrders.filter((o) => o.status === "delivered");
    const grossSales = delivered.reduce((sum, o) => sum + o.subtotal, 0);
    const totalCommission = delivered.reduce((sum, o) => sum + o.commissionAmount, 0);
    const netEarnings = grossSales - totalCommission;
    const outstandingDebt = db.dues[DEALER_ID]?.outstandingDebt ?? 650.50;
    const computed: DealerDues = {
      dealerId: DEALER_ID,
      commissionRate: COMMISSION_RATE,
      grossSales,
      totalCommission,
      netEarnings,
      outstandingDebt,
      debtAlert: outstandingDebt > 500,
      updatedAt: new Date().toISOString(),
    };
    return ok(config, computed);
  }

  return null;
}
