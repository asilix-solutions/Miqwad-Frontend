import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";

/**
 * In-process mock for the Vehicles + Lookups endpoints.
 *
 * Mirrors the .NET Swagger contract (`miquad-api.yaml`):
 *   GET    /Vehicles
 *   POST   /Vehicles
 *   GET    /Vehicles/{id}
 *   PUT    /Vehicles/{id}
 *   DELETE /Vehicles/{id}
 *   GET    /Vehicles/{id}/maintenance-history
 *   POST   /Vehicles/{id}/maintenance-history
 *   GET    /Vehicles/{id}/upcoming-services
 *   GET    /Lookups/brands
 *   GET    /Lookups/brands/{id}/models
 *   GET    /Lookups/brands/{id}/models/{modelId}/years
 *
 * State lives in localStorage so the demo survives page reloads.
 * Each entity is scoped to the currently signed-in user, so testing
 * with a different phone shows an isolated garage.
 *
 * Admin Brand/Model CRUD (previously mocked here under `admin/brands...`)
 * now targets the real backend's `/api/Brands` resource directly — see
 * `@modules/vehicles/api/brandsApi.ts`. The static BRANDS/MODELS below stay
 * only as the `/Lookups/brands...` demo dataset.
 */

import type {
  Brand,
  MaintenanceRecord,
  UpcomingService,
  Vehicle,
  VehicleModel,
} from "@modules/vehicles/types";

interface MockVehicle extends Vehicle {
  ownerId: string;
}
interface MockRecord extends MaintenanceRecord {
  vehicleId: number;
}

interface MockVehiclesDb {
  vehicles: Record<number, MockVehicle>;
  records: Record<number, MockRecord>;
  nextVehicleId: number;
  nextRecordId: number;
}

const VEH_DB_KEY = "maqwad.mockVehiclesDb";

function loadDb(): MockVehiclesDb {
  try {
    const raw = localStorage.getItem(VEH_DB_KEY);
    if (raw) return JSON.parse(raw) as MockVehiclesDb;
  } catch {
    /* ignore parse error */
  }
  return { vehicles: {}, records: {}, nextVehicleId: 1, nextRecordId: 1 };
}

function saveDb(db: MockVehiclesDb): void {
  localStorage.setItem(VEH_DB_KEY, JSON.stringify(db));
}

function currentUserId(): string | null {
  try {
    const raw = localStorage.getItem("maqwad.user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed.id ?? null;
  } catch {
    return null;
  }
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

function parseBody(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof data === "object") return data as Record<string, unknown>;
  return {};
}

// ---------- Static lookup data ----------------------------------------------
// Subset of the real Saudi-market dataset; enough for a realistic demo.
// Only used by /Lookups/brands... — the real Brand/Model catalog (admin
// CRUD) now lives on the real backend at /api/Brands, not here.
const BRANDS: Brand[] = [
  { id: 1, name: "Toyota", image: null },
  { id: 2, name: "Hyundai", image: null },
  { id: 3, name: "Kia", image: null },
  { id: 4, name: "Nissan", image: null },
  { id: 5, name: "Ford", image: null },
  { id: 6, name: "Chevrolet", image: null },
  { id: 7, name: "Mercedes-Benz", image: null },
  { id: 8, name: "BMW", image: null },
  { id: 9, name: "Lexus", image: null },
  { id: 10, name: "GMC", image: null },
];

const MODELS: Record<number, VehicleModel[]> = {
  1: [
    { id: 101, name: "Corolla", brandId: 1 },
    { id: 102, name: "Camry", brandId: 1 },
    { id: 103, name: "Land Cruiser", brandId: 1 },
    { id: 104, name: "Hilux", brandId: 1 },
    { id: 105, name: "Yaris", brandId: 1 },
    { id: 106, name: "RAV4", brandId: 1 },
  ],
  2: [
    { id: 201, name: "Elantra", brandId: 2 },
    { id: 202, name: "Sonata", brandId: 2 },
    { id: 203, name: "Tucson", brandId: 2 },
    { id: 204, name: "Santa Fe", brandId: 2 },
    { id: 205, name: "Accent", brandId: 2 },
  ],
  3: [
    { id: 301, name: "Cerato", brandId: 3 },
    { id: 302, name: "Sportage", brandId: 3 },
    { id: 303, name: "Sorento", brandId: 3 },
    { id: 304, name: "Rio", brandId: 3 },
  ],
  4: [
    { id: 401, name: "Sunny", brandId: 4 },
    { id: 402, name: "Altima", brandId: 4 },
    { id: 403, name: "Patrol", brandId: 4 },
    { id: 404, name: "X-Trail", brandId: 4 },
  ],
  5: [
    { id: 501, name: "Explorer", brandId: 5 },
    { id: 502, name: "Edge", brandId: 5 },
    { id: 503, name: "Mustang", brandId: 5 },
    { id: 504, name: "F-150", brandId: 5 },
  ],
  6: [
    { id: 601, name: "Tahoe", brandId: 6 },
    { id: 602, name: "Suburban", brandId: 6 },
    { id: 603, name: "Captiva", brandId: 6 },
  ],
  7: [
    { id: 701, name: "C-Class", brandId: 7 },
    { id: 702, name: "E-Class", brandId: 7 },
    { id: 703, name: "G-Class", brandId: 7 },
    { id: 704, name: "S-Class", brandId: 7 },
  ],
  8: [
    { id: 801, name: "3 Series", brandId: 8 },
    { id: 802, name: "5 Series", brandId: 8 },
    { id: 803, name: "X5", brandId: 8 },
  ],
  9: [
    { id: 901, name: "ES", brandId: 9 },
    { id: 902, name: "LX", brandId: 9 },
    { id: 903, name: "RX", brandId: 9 },
  ],
  10: [
    { id: 1001, name: "Yukon", brandId: 10 },
    { id: 1002, name: "Sierra", brandId: 10 },
  ],
};

function yearsForModel(): number[] {
  // Real backend will return per-model availability;
  // for the demo we expose a clean window starting around 2015.
  const now = new Date().getFullYear();
  const out: number[] = [];
  for (let y = now + 1; y >= 2015; y -= 1) out.push(y);
  return out;
}

function findBrandName(id: number): string {
  const b = BRANDS.find((b) => b.id === id);
  return b?.name ?? "—";
}
function findModelName(brandId: number, modelId: number): string {
  const m = MODELS[brandId]?.find((m) => m.id === modelId);
  return m?.name ?? "—";
}

// ---------- URL helpers -----------------------------------------------------
const VEH_BY_ID = /^Vehicles\/(\d+)$/i;
const VEH_HISTORY = /^Vehicles\/(\d+)\/maintenance-history$/i;
const VEH_UPCOMING = /^Vehicles\/(\d+)\/upcoming-services$/i;
const LOOKUPS_MODELS = /^Lookups\/brands\/(\d+)\/models$/i;
const LOOKUPS_YEARS = /^Lookups\/brands\/(\d+)\/models\/(\d+)\/years$/i;

/**
 * Returns the mock response for a vehicles/lookups request, or `null`
 * if the URL does not belong to this handler. The parent adapter
 * uses that signal to fall through to other handlers.
 */
export async function tryVehiclesMock(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  // ---- Lookups ------------------------------------------------------------
  if (url === "Lookups/brands" && method === "get") {
    return ok(config, BRANDS);
  }

  const modelsMatch = url.match(LOOKUPS_MODELS);
  if (modelsMatch && method === "get") {
    const brandId = Number(modelsMatch[1]);
    return ok(config, MODELS[brandId] ?? []);
  }

  const yearsMatch = url.match(LOOKUPS_YEARS);
  if (yearsMatch && method === "get") {
    return ok(config, yearsForModel());
  }

  // ---- Vehicles auth-guarded ---------------------------------------------
  const ownerId = currentUserId();
  const needsAuth =
    url === "Vehicles" ||
    VEH_BY_ID.test(url) ||
    VEH_HISTORY.test(url) ||
    VEH_UPCOMING.test(url);

  if (needsAuth && !ownerId) {
    throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
  }

  // -- GET /Vehicles --------------------------------------------------------
  if (url === "Vehicles" && method === "get") {
    const db = loadDb();
    const mine = Object.values(db.vehicles).filter((v) => v.ownerId === ownerId);
    // Newest first.
    mine.sort((a, b) => b.id - a.id);
    return ok(config, mine.map(stripOwner));
  }

  // -- POST /Vehicles -------------------------------------------------------
  if (url === "Vehicles" && method === "post") {
    const body = parseBody(config.data);
    const db = loadDb();

    // Required-field check mirrors the Zod schema; defensive only.
    const brandId = Number(body.brandId);
    const modelId = Number(body.modelId);
    const year = Number(body.year);
    const plateNumber = String(body.plateNumber ?? "");
    if (!brandId || !modelId || !year || !plateNumber) {
      throw fail(config, 400, "VALIDATION", "بيانات السيارة غير مكتملة");
    }

    const vehicle: MockVehicle = {
      id: db.nextVehicleId,
      ownerId: ownerId!,
      brandId,
      brandName: findBrandName(brandId),
      modelId,
      modelName: findModelName(brandId, modelId),
      year,
      plateNumber,
      color: (body.color as string) || null,
      mileage: body.mileage != null ? Number(body.mileage) : null,
      vin: (body.vin as string) || null,
      registrationDate: (body.registrationDate as string) || null,
      fuelType: (body.fuelType as Vehicle["fuelType"]) ?? null,
      nickname: (body.nickname as string) || null,
      imageUrl: (body.imageUrl as string) || null,
      createdAt: new Date().toISOString(),
    };
    db.vehicles[vehicle.id] = vehicle;
    db.nextVehicleId += 1;
    saveDb(db);
    return ok(config, stripOwner(vehicle), 201);
  }

  // -- /Vehicles/{id} -------------------------------------------------------
  const byIdMatch = url.match(VEH_BY_ID);
  if (byIdMatch) {
    const id = Number(byIdMatch[1]);
    const db = loadDb();
    const found = db.vehicles[id];
    if (!found || found.ownerId !== ownerId) {
      throw fail(config, 404, "NOT_FOUND", "السيارة غير موجودة");
    }

    if (method === "get") return ok(config, stripOwner(found));

    if (method === "put") {
      const body = parseBody(config.data);
      const brandId = Number(body.brandId ?? found.brandId);
      const modelId = Number(body.modelId ?? found.modelId);
      const next: MockVehicle = {
        ...found,
        brandId,
        brandName: findBrandName(brandId),
        modelId,
        modelName: findModelName(brandId, modelId),
        year: Number(body.year ?? found.year),
        plateNumber: (body.plateNumber as string) ?? found.plateNumber,
        color: (body.color as string) ?? found.color,
        mileage:
          body.mileage != null
            ? Number(body.mileage)
            : (body.mileage === null ? null : found.mileage),
        vin: (body.vin as string) ?? found.vin,
        registrationDate: (body.registrationDate as string) ?? found.registrationDate,
        fuelType: (body.fuelType as Vehicle["fuelType"]) ?? found.fuelType,
        nickname: (body.nickname as string) ?? found.nickname,
        imageUrl: (body.imageUrl as string) ?? found.imageUrl,
      };
      db.vehicles[id] = next;
      saveDb(db);
      return ok(config, stripOwner(next));
    }

    if (method === "delete") {
      delete db.vehicles[id];
      // Cascade-delete the maintenance history for that vehicle.
      Object.values(db.records).forEach((r) => {
        if (r.vehicleId === id) delete db.records[r.id];
      });
      saveDb(db);
      return ok(config, undefined, 204);
    }
  }

  // -- /Vehicles/{id}/maintenance-history -----------------------------------
  const historyMatch = url.match(VEH_HISTORY);
  if (historyMatch) {
    const id = Number(historyMatch[1]);
    const db = loadDb();
    const owned = db.vehicles[id]?.ownerId === ownerId;
    if (!owned) throw fail(config, 404, "NOT_FOUND", "السيارة غير موجودة");

    if (method === "get") {
      const limit = Number(config.params?.limit ?? 20);
      const offset = Number(config.params?.offset ?? 0);
      const records = Object.values(db.records)
        .filter((r) => r.vehicleId === id)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      return ok(config, records.slice(offset, offset + limit));
    }

    if (method === "post") {
      const body = parseBody(config.data);
      const serviceName = String(body.serviceName ?? "").trim();
      const date = String(body.date ?? "").trim();
      if (!serviceName || !date) {
        throw fail(config, 400, "VALIDATION", "بيانات سجل الصيانة غير مكتملة");
      }
      const record: MockRecord = {
        id: db.nextRecordId,
        vehicleId: id,
        serviceName,
        providerName: (body.providerName as string) || null,
        date,
        mileage: body.mileage != null ? Number(body.mileage) : null,
        cost: body.cost != null ? Number(body.cost) : null,
        notes: (body.notes as string) || null,
      };
      db.records[record.id] = record;
      db.nextRecordId += 1;
      saveDb(db);
      return ok(config, record, 201);
    }
  }

  // -- /Vehicles/{id}/upcoming-services -------------------------------------
  const upcomingMatch = url.match(VEH_UPCOMING);
  if (upcomingMatch && method === "get") {
    const id = Number(upcomingMatch[1]);
    const db = loadDb();
    const v = db.vehicles[id];
    if (!v || v.ownerId !== ownerId) {
      throw fail(config, 404, "NOT_FOUND", "السيارة غير موجودة");
    }
    return ok(config, buildUpcomingDemo(v));
  }

  // Not ours — let the next handler / real backend deal with it.
  return null;
}

function stripOwner(v: MockVehicle): Vehicle {
  const rest: Vehicle = {
    id: v.id,
    brandId: v.brandId,
    brandName: v.brandName,
    modelId: v.modelId,
    modelName: v.modelName,
    year: v.year,
    plateNumber: v.plateNumber,
    color: v.color,
    mileage: v.mileage,
    vin: v.vin,
    registrationDate: v.registrationDate,
    fuelType: v.fuelType,
    nickname: v.nickname,
    imageUrl: v.imageUrl,
    createdAt: v.createdAt,
  };
  return rest;
}

/**
 * Derive a small set of upcoming-service suggestions from a vehicle's
 * current mileage. Realistic enough to demo the UI without backend logic.
 */
function buildUpcomingDemo(v: Vehicle): UpcomingService[] {
  const baseMileage = v.mileage ?? 0;
  const today = new Date();
  const inDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      id: v.id * 10 + 1,
      vehicleId: v.id,
      serviceName: "تغيير زيت المحرك",
      dueDate: inDays(45),
      dueMileage: baseMileage + 5_000,
      daysRemaining: 45,
      urgency: "ok",
    },
    {
      id: v.id * 10 + 2,
      vehicleId: v.id,
      serviceName: "فحص المكابح",
      dueDate: inDays(15),
      dueMileage: baseMileage + 1_500,
      daysRemaining: 15,
      urgency: "soon",
    },
    {
      id: v.id * 10 + 3,
      vehicleId: v.id,
      serviceName: "تجديد الاستمارة",
      dueDate: inDays(-7),
      dueMileage: null,
      daysRemaining: -7,
      urgency: "overdue",
    },
  ];
}
