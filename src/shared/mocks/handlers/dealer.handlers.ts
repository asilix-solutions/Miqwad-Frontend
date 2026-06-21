/**
 * In-process mock for Dealer Dashboard.
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type { PaginatedResponse } from "../../types/api";
import type {
  Product,
  Inventory,
  Order,
  OrderStatus,
  Shipment,
  DealerDues,
} from "../../../modules/dealer/types";
import { canTransition } from "../../../modules/dealer/orderLifecycle";

interface DealerDb {
  products: Record<string, Product>;
  inventory: Record<string, Inventory>;
  orders: Record<string, Order>;
  shipments: Record<string, Shipment>;
  dues: Record<string, DealerDues>;
  nextId: number;
  seeded: boolean;
}

const DEALER_DB_KEY = "maqwad.dealer.mockDb";
const MOCK_SEED_VERSION = 1;
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
      return { products: {}, inventory: {}, orders: {}, shipments: {}, dues: {}, nextId: 1000, seeded: false };
    }

    const raw = localStorage.getItem(DEALER_DB_KEY);
    if (raw) return JSON.parse(raw) as DealerDb;
  } catch {
    /* ignore */
  }
  return { products: {}, inventory: {}, orders: {}, shipments: {}, dues: {}, nextId: 1000, seeded: false };
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

  // 1. Products
  const productsSeed: Partial<Product>[] = [
    { nameAr: "بطارية سيارة 60 أمبير", nameEn: "60 Ah Car Battery", sku: "BAT-60A", categoryId: "6", price: 350, condition: "new", status: "active", stockQty: 100 },
    { nameAr: "بطارية سيارة 80 أمبير", nameEn: "80 Ah Car Battery", sku: "BAT-80A", categoryId: "6", price: 450, condition: "new", status: "active", stockQty: 45 },
    { nameAr: "زيت محرك 5W-30", nameEn: "5W-30 Engine Oil", sku: "OIL-5W30", categoryId: "1", price: 120, condition: "new", status: "active", stockQty: 200 },
    { nameAr: "زيت محرك 10W-40", nameEn: "10W-40 Engine Oil", sku: "OIL-10W40", categoryId: "1", price: 100, condition: "new", status: "active", stockQty: 150 },
    { nameAr: "فلتر زيت", nameEn: "Oil Filter", sku: "FLT-OIL", categoryId: "1", price: 40, condition: "new", status: "active", stockQty: 300 },
    { nameAr: "فلتر هواء", nameEn: "Air Filter", sku: "FLT-AIR", categoryId: "1", price: 50, condition: "new", status: "active", stockQty: 250 },
    { nameAr: "سائل تبريد أحمر", nameEn: "Red Coolant", sku: "COOL-RED", categoryId: "2", price: 60, condition: "new", status: "active", stockQty: 180 },
    { nameAr: "سائل تبريد أخضر", nameEn: "Green Coolant", sku: "COOL-GRN", categoryId: "2", price: 55, condition: "new", status: "out_of_stock", stockQty: 0 },
    { nameAr: "مساحات زجاج أمامية", nameEn: "Windshield Wipers", sku: "ACC-WIPER", categoryId: "2", price: 80, condition: "new", status: "active", stockQty: 120 },
    { nameAr: "معطر سيارة", nameEn: "Car Air Freshener", sku: "ACC-FRESH", categoryId: "2", price: 15, condition: "new", status: "draft", stockQty: 50 },
  ];

  for (const p of productsSeed) {
    const id = `prod_${db.nextId++}`;
    db.products[id] = {
      id,
      dealerId: DEALER_ID,
      nameAr: p.nameAr!,
      nameEn: p.nameEn!,
      sku: p.sku!,
      categoryId: p.categoryId!,
      price: p.price!,
      condition: p.condition!,
      status: p.status!,
      stockQty: p.stockQty!,
      createdAt: now,
      updatedAt: now,
    };
    db.inventory[id] = {
      productId: id,
      dealerId: DEALER_ID,
      onHand: p.stockQty!,
      reserved: 0,
      updatedAt: now,
    };
  }

  // 2. Orders & Shipments
  const productKeys = Object.keys(db.products);
  const p1 = db.products[productKeys[0]];
  const p2 = db.products[productKeys[1]];
  const p3 = db.products[productKeys[2]];

  const ordersSeed: Array<{ customer: string; status: import("../../../modules/dealer/types").OrderStatus; items: Array<{p: Product; qty: number}>; hasShipment?: boolean }> = [
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
    } else if (o.status === "new" || o.status === "preparing") {
      for (const i of o.items) {
        if (db.inventory[i.p.id]) {
          db.inventory[i.p.id].reserved += i.qty;
        }
      }
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

  if (path === "dealer/products" && method === "get") {
    // FUTURE: filter by authenticated dealerId — backend MUST enforce per-store isolation (SRS: no cross-store visibility)
    let list = Object.values(db.products);
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    if (status) list = list.filter(p => p.status === status);
    if (categoryId) list = list.filter(p => p.categoryId === categoryId);
    
    return ok(config, paginate(list, searchParams.get("page") ?? undefined, searchParams.get("pageSize") ?? undefined));
  }

  const prodMatch = path.match(/^dealer\/products\/([^/]+)$/);
  if (prodMatch && method === "get") {
    const p = db.products[prodMatch[1]];
    if (!p) throw fail(config, 404, "NOT_FOUND", "Product not found");
    return ok(config, p);
  }

  if (path === "dealer/products" && method === "post") {
    const payload = JSON.parse(config.data || "{}");
    const id = `prod_${db.nextId++}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      id,
      dealerId: DEALER_ID,
      nameAr: payload.nameAr || "",
      nameEn: payload.nameEn || "",
      sku: payload.sku || "",
      categoryId: payload.categoryId || "",
      price: payload.price || 0,
      condition: payload.condition || "new",
      status: payload.status || "draft",
      stockQty: payload.stockQty || 0,
      images: payload.images,
      descriptionAr: payload.descriptionAr,
      descriptionEn: payload.descriptionEn,
      createdAt: now,
      updatedAt: now,
    };
    db.products[id] = newProduct;
    db.inventory[id] = {
      productId: id,
      dealerId: DEALER_ID,
      onHand: newProduct.stockQty,
      reserved: 0,
      updatedAt: now,
    };
    saveDb(db);
    return ok(config, newProduct);
  }

  if (prodMatch && method === "patch" && !path.endsWith("/status")) {
    const p = db.products[prodMatch[1]];
    if (!p) throw fail(config, 404, "NOT_FOUND", "Product not found");
    const payload = JSON.parse(config.data || "{}");
    const now = new Date().toISOString();
    
    db.products[prodMatch[1]] = { ...p, ...payload, updatedAt: now };
    
    if (payload.stockQty !== undefined && db.inventory[prodMatch[1]]) {
      db.inventory[prodMatch[1]].onHand = payload.stockQty;
      db.inventory[prodMatch[1]].updatedAt = now;
    }
    saveDb(db);
    return ok(config, db.products[prodMatch[1]]);
  }

  const prodStatusMatch = path.match(/^dealer\/products\/([^/]+)\/status$/);
  if (prodStatusMatch && method === "patch") {
    const p = db.products[prodStatusMatch[1]];
    if (!p) throw fail(config, 404, "NOT_FOUND", "Product not found");
    const payload = JSON.parse(config.data || "{}");
    p.status = payload.status;
    p.updatedAt = new Date().toISOString();
    saveDb(db);
    return ok(config, p);
  }

  if (prodMatch && method === "delete") {
    const p = db.products[prodMatch[1]];
    if (!p) throw fail(config, 404, "NOT_FOUND", "Product not found");
    delete db.products[prodMatch[1]];
    delete db.inventory[prodMatch[1]];
    saveDb(db);
    return ok(config, { success: true });
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
