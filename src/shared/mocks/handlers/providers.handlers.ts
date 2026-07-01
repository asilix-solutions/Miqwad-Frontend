import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";

/**
 * In-process mock for Sprint 3 — Services Catalog & Provider Registration.
 *
 * Endpoints mocked:
 *   GET    /Services/categories
 *   GET    /Services/categories/{id}/subcategories
 *   GET    /admin/categories?providerType=&parentId=&level=   (Phase 2+)
 *   POST   /admin/categories
 *   PUT    /admin/categories/{id}
 *   DELETE /admin/categories/{id}   (409 if children or references exist)
 *   POST   /ServiceProviders/register
 *   GET    /ServiceProviders/{id}/profile
 *   GET    /providers/{providerId}/services
 *   POST   /providers/{providerId}/services
 *   PUT    /providers/{providerId}/services/{serviceId}
 *   DELETE /providers/{providerId}/services/{serviceId}
 *   POST   /ServiceProviders/{id}/documents
 *   GET    /admin/providers?status=pending|approved|rejected
 *   PATCH  /admin/providers/{id}/approve
 *   PATCH  /admin/providers/{id}/reject  body: { reason: string }
 *
 * State persists in localStorage so the demo survives reloads.
 */

import type {
  KycDocumentType,
  ProviderDocument,
  ProviderProfile,
  ProviderService,
  ProviderType,
} from "@modules/providers/types";
import type {
  ServiceCategory,
  ServiceSubcategory,
} from "@modules/services/types";
import { KSA_CITIES } from "@modules/discovery/types";
import type { City } from "@modules/admin/types";


interface CurrentUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: "customer" | "provider" | "driver" | "admin" | "super_admin";
  avatarUrl: string | null;
  isProfileComplete: boolean;
  providerId?: number | null;
  providerStatus?: "pending" | "approved" | "rejected" | null;
  providerRejectionReason?: string | null;
}

interface ProvidersDb {
  providers: Record<number, ProviderProfile>;
  services: Record<number, ProviderService>;
  nextProviderId: number;
  nextServiceId: number;
  seeded: boolean;
}

const PROVIDERS_DB_KEY = "maqwad.mockProvidersDb";

const MOCK_SEED_VERSION = 11; // bumped: nearby seed categoryIds migrated to hierarchical IDs
const MOCK_SEED_VERSION_KEY = "maqwad.mockSeedVersion";

function loadDb(): ProvidersDb {
  try {
    const storedVersionStr = localStorage.getItem(MOCK_SEED_VERSION_KEY);
    const storedVersion = storedVersionStr ? parseInt(storedVersionStr, 10) : 0;

    if (storedVersion !== MOCK_SEED_VERSION) {
      // Version mismatch: seed shape changed. Clear all mock caches.
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("maqwad.")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(MOCK_SEED_VERSION_KEY, MOCK_SEED_VERSION.toString());

      // Return empty DB so seedIfEmpty will re-run
      return { providers: {}, services: {}, nextProviderId: 1, nextServiceId: 1, seeded: false };
    }

    const raw = localStorage.getItem(PROVIDERS_DB_KEY);
    if (raw) return JSON.parse(raw) as ProvidersDb;
  } catch {
    /* ignore */
  }
  return { providers: {}, services: {}, nextProviderId: 1, nextServiceId: 1, seeded: false };
}

function saveDb(db: ProvidersDb): void {
  localStorage.setItem(PROVIDERS_DB_KEY, JSON.stringify(db));
}

function readCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem("maqwad.user");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

function writeCurrentUser(user: CurrentUser): void {
  localStorage.setItem("maqwad.user", JSON.stringify(user));
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

// =============================================================================
// Lookup data — 3-level category tree
//
// ID ranges:
//   100–199  Workshop (ورشة)
//   200–299  Dealer / parts vendor (تاجر)
//   300–399  Scrap yard (تشليح)
//   400+     Dynamically created via POST /admin/categories
// =============================================================================

let nextCategoryId = 400;

let CATEGORIES: ServiceCategory[] = [
  // ── Workshop ────────────────────────────────────────────────────────────────
  // Level 1 – root
  { id: 100, nameAr: "الصيانة والإصلاح", nameEn: "Maintenance & Repair", iconUrl: null, colorHint: "orange", parentId: null, level: 1, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },

  // Level 2 – children of 100
  { id: 101, nameAr: "صيانة عامة",       nameEn: "General Maintenance",  iconUrl: null, colorHint: "green",  parentId: 100, level: 2, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },
  { id: 102, nameAr: "ميكانيكا",          nameEn: "Mechanics",            iconUrl: null, colorHint: "orange", parentId: 100, level: 2, providerTypeScope: "workshop", isActive: true, sortOrder: 2 },
  { id: 103, nameAr: "كهرباء سيارات",    nameEn: "Auto Electrical",      iconUrl: null, colorHint: "blue",   parentId: 100, level: 2, providerTypeScope: "workshop", isActive: true, sortOrder: 3 },
  { id: 104, nameAr: "تبريد وتكييف",     nameEn: "AC & Cooling",         iconUrl: null, colorHint: "blue",   parentId: 100, level: 2, providerTypeScope: "workshop", isActive: true, sortOrder: 4 },
  { id: 105, nameAr: "فرامل وتعليق",     nameEn: "Brakes & Suspension",  iconUrl: null, colorHint: "red",    parentId: 100, level: 2, providerTypeScope: "workshop", isActive: true, sortOrder: 5 },
  { id: 106, nameAr: "إطارات وميزان",    nameEn: "Tires & Alignment",    iconUrl: null, colorHint: "navy",   parentId: 100, level: 2, providerTypeScope: "workshop", isActive: true, sortOrder: 6 },
  { id: 107, nameAr: "سمكرة ودهان",      nameEn: "Body & Paint",         iconUrl: null, colorHint: "red",    parentId: 100, level: 2, providerTypeScope: "workshop", isActive: true, sortOrder: 7 },
  { id: 108, nameAr: "غسيل وتلميع",      nameEn: "Wash & Detailing",     iconUrl: null, colorHint: "green",  parentId: 100, level: 2, providerTypeScope: "workshop", isActive: true, sortOrder: 8 },

  // Level 3 – sub-children of 101 (صيانة عامة)
  { id: 111, nameAr: "تغيير زيت ومرشحات",     nameEn: "Oil & Filter Change",  iconUrl: null, colorHint: undefined, parentId: 101, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },
  { id: 112, nameAr: "صيانة دورية 10,000 كم",  nameEn: "10k km Service",       iconUrl: null, colorHint: undefined, parentId: 101, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 102 (ميكانيكا)
  { id: 113, nameAr: "إصلاح المحرك",         nameEn: "Engine Repair",          iconUrl: null, colorHint: undefined, parentId: 102, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },
  { id: 114, nameAr: "إصلاح ناقل الحركة",    nameEn: "Gearbox Repair",         iconUrl: null, colorHint: undefined, parentId: 102, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 2 },
  { id: 115, nameAr: "تغيير بواجي",          nameEn: "Spark Plug Replacement", iconUrl: null, colorHint: undefined, parentId: 102, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 3 },

  // Level 3 – sub-children of 103 (كهرباء سيارات)
  { id: 116, nameAr: "فحص كمبيوتر",   nameEn: "Computer Diagnostics", iconUrl: null, colorHint: undefined, parentId: 103, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },
  { id: 117, nameAr: "تركيب دينمو",   nameEn: "Alternator Install",   iconUrl: null, colorHint: undefined, parentId: 103, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 104 (تبريد وتكييف)
  { id: 118, nameAr: "تعبئة فريون",  nameEn: "Refrigerant Top-up",   iconUrl: null, colorHint: undefined, parentId: 104, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },
  { id: 119, nameAr: "تنظيف مكيف",   nameEn: "AC Cleaning",          iconUrl: null, colorHint: undefined, parentId: 104, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 105 (فرامل وتعليق)
  { id: 120, nameAr: "تغيير فرامل",    nameEn: "Brake Replacement",  iconUrl: null, colorHint: undefined, parentId: 105, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },
  { id: 121, nameAr: "إصلاح التعليق",  nameEn: "Suspension Repair",  iconUrl: null, colorHint: undefined, parentId: 105, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 106 (إطارات وميزان)
  { id: 122, nameAr: "تغيير إطار",      nameEn: "Tire Replacement",          iconUrl: null, colorHint: undefined, parentId: 106, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },
  { id: 123, nameAr: "ميزانية وعدلية",  nameEn: "Wheel Alignment & Balance", iconUrl: null, colorHint: undefined, parentId: 106, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 107 (سمكرة ودهان)
  { id: 124, nameAr: "سمكرة قطعة",  nameEn: "Body Panel Repair",    iconUrl: null, colorHint: undefined, parentId: 107, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },
  { id: 125, nameAr: "دهان قطعة",   nameEn: "Single Panel Paint",   iconUrl: null, colorHint: undefined, parentId: 107, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 108 (غسيل وتلميع)
  { id: 126, nameAr: "غسيل خارجي",  nameEn: "Exterior Wash",  iconUrl: null, colorHint: undefined, parentId: 108, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 1 },
  { id: 127, nameAr: "تلميع شامل",  nameEn: "Full Detailing", iconUrl: null, colorHint: undefined, parentId: 108, level: 3, providerTypeScope: "workshop", isActive: true, sortOrder: 2 },

  // ── Dealer / Parts Vendor ────────────────────────────────────────────────────
  // Level 1 – root
  { id: 200, nameAr: "قطع غيار جديدة", nameEn: "New Spare Parts", iconUrl: null, colorHint: "orange", parentId: null, level: 1, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },

  // Level 2 – children of 200
  { id: 201, nameAr: "زيوت وفلاتر",         nameEn: "Oils & Filters",       iconUrl: null, colorHint: "orange", parentId: 200, level: 2, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },
  { id: 202, nameAr: "بطاريات",              nameEn: "Batteries",            iconUrl: null, colorHint: "red",    parentId: 200, level: 2, providerTypeScope: "dealer", isActive: true, sortOrder: 2 },
  { id: 203, nameAr: "فرامل",               nameEn: "Brakes",               iconUrl: null, colorHint: "red",    parentId: 200, level: 2, providerTypeScope: "dealer", isActive: true, sortOrder: 3 },
  { id: 204, nameAr: "مكونات المحرك",       nameEn: "Engine Components",    iconUrl: null, colorHint: "orange", parentId: 200, level: 2, providerTypeScope: "dealer", isActive: true, sortOrder: 4 },
  { id: 205, nameAr: "كهرباء وإلكترونيات", nameEn: "Electrical & Electronics", iconUrl: null, colorHint: "blue", parentId: 200, level: 2, providerTypeScope: "dealer", isActive: true, sortOrder: 5 },
  { id: 206, nameAr: "عفشة وتعليق",         nameEn: "Chassis & Suspension", iconUrl: null, colorHint: "navy",   parentId: 200, level: 2, providerTypeScope: "dealer", isActive: true, sortOrder: 6 },
  { id: 207, nameAr: "تبريد ومكيف",         nameEn: "Cooling & AC Parts",   iconUrl: null, colorHint: "blue",   parentId: 200, level: 2, providerTypeScope: "dealer", isActive: true, sortOrder: 7 },
  { id: 208, nameAr: "إكسسوارات",           nameEn: "Accessories",          iconUrl: null, colorHint: "green",  parentId: 200, level: 2, providerTypeScope: "dealer", isActive: true, sortOrder: 8 },

  // Level 3 – sub-children of 201 (زيوت وفلاتر)
  { id: 211, nameAr: "زيت محرك",   nameEn: "Engine Oil",  iconUrl: null, colorHint: undefined, parentId: 201, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },
  { id: 212, nameAr: "فلتر زيت",   nameEn: "Oil Filter",  iconUrl: null, colorHint: undefined, parentId: 201, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 2 },
  { id: 213, nameAr: "فلتر هواء",  nameEn: "Air Filter",  iconUrl: null, colorHint: undefined, parentId: 201, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 3 },

  // Level 3 – sub-children of 202 (بطاريات)
  { id: 214, nameAr: "بطارية 45 أمبير",  nameEn: "45 Ah Battery",  iconUrl: null, colorHint: undefined, parentId: 202, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },
  { id: 215, nameAr: "بطارية 60 أمبير",  nameEn: "60 Ah Battery",  iconUrl: null, colorHint: undefined, parentId: 202, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 2 },
  { id: 216, nameAr: "بطارية 80 أمبير",  nameEn: "80 Ah Battery",  iconUrl: null, colorHint: undefined, parentId: 202, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 3 },

  // Level 3 – sub-children of 203 (فرامل)
  { id: 217, nameAr: "تيل فرامل",  nameEn: "Brake Pads",  iconUrl: null, colorHint: undefined, parentId: 203, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },
  { id: 218, nameAr: "قرص فرامل",  nameEn: "Brake Disc",  iconUrl: null, colorHint: undefined, parentId: 203, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 204 (مكونات المحرك)
  { id: 219, nameAr: "بواجي",         nameEn: "Spark Plugs",   iconUrl: null, colorHint: undefined, parentId: 204, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },
  { id: 220, nameAr: "حزام توقيت",    nameEn: "Timing Belt",   iconUrl: null, colorHint: undefined, parentId: 204, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 205 (كهرباء وإلكترونيات)
  { id: 221, nameAr: "شمعات إشعال",  nameEn: "Ignition Coils", iconUrl: null, colorHint: undefined, parentId: 205, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },
  { id: 222, nameAr: "سيلينويد",     nameEn: "Solenoid",        iconUrl: null, colorHint: undefined, parentId: 205, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 206 (عفشة وتعليق)
  { id: 223, nameAr: "مساعدات أمامية",  nameEn: "Front Shock Absorbers", iconUrl: null, colorHint: undefined, parentId: 206, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },
  { id: 224, nameAr: "مساعدات خلفية",   nameEn: "Rear Shock Absorbers",  iconUrl: null, colorHint: undefined, parentId: 206, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 207 (تبريد ومكيف)
  { id: 225, nameAr: "ريديتر",         nameEn: "Radiator",       iconUrl: null, colorHint: undefined, parentId: 207, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },
  { id: 226, nameAr: "كمبروسر مكيف",   nameEn: "AC Compressor",  iconUrl: null, colorHint: undefined, parentId: 207, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 208 (إكسسوارات)
  { id: 227, nameAr: "مساحات زجاج",  nameEn: "Windshield Wipers",  iconUrl: null, colorHint: undefined, parentId: 208, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 1 },
  { id: 228, nameAr: "معطر سيارة",    nameEn: "Car Air Freshener",  iconUrl: null, colorHint: undefined, parentId: 208, level: 3, providerTypeScope: "dealer", isActive: true, sortOrder: 2 },

  // ── Scrap Yard ──────────────────────────────────────────────────────────────
  // Level 1 – root
  { id: 300, nameAr: "قطع غيار مستعملة", nameEn: "Used Spare Parts", iconUrl: null, colorHint: "purple", parentId: null, level: 1, providerTypeScope: "scrap", isActive: true, sortOrder: 1 },

  // Level 2 – children of 300
  { id: 301, nameAr: "مكائن وقيرات",    nameEn: "Engines & Gearboxes", iconUrl: null, colorHint: "orange", parentId: 300, level: 2, providerTypeScope: "scrap", isActive: true, sortOrder: 1 },
  { id: 302, nameAr: "بودي خارجي",      nameEn: "Exterior Body Parts", iconUrl: null, colorHint: "navy",   parentId: 300, level: 2, providerTypeScope: "scrap", isActive: true, sortOrder: 2 },
  { id: 303, nameAr: "أنوار ومرايا",    nameEn: "Lights & Mirrors",    iconUrl: null, colorHint: "blue",   parentId: 300, level: 2, providerTypeScope: "scrap", isActive: true, sortOrder: 3 },
  { id: 304, nameAr: "داخلي",           nameEn: "Interior",            iconUrl: null, colorHint: "green",  parentId: 300, level: 2, providerTypeScope: "scrap", isActive: true, sortOrder: 4 },
  { id: 305, nameAr: "كهرباء مستعملة", nameEn: "Used Electrical",     iconUrl: null, colorHint: "blue",   parentId: 300, level: 2, providerTypeScope: "scrap", isActive: true, sortOrder: 5 },
  { id: 306, nameAr: "نظام التعليق",    nameEn: "Suspension System",   iconUrl: null, colorHint: "red",    parentId: 300, level: 2, providerTypeScope: "scrap", isActive: true, sortOrder: 6 },
  { id: 307, nameAr: "جنوط وإطارات",   nameEn: "Rims & Tires",        iconUrl: null, colorHint: "navy",   parentId: 300, level: 2, providerTypeScope: "scrap", isActive: true, sortOrder: 7 },

  // Level 3 – sub-children of 301 (مكائن وقيرات)
  { id: 311, nameAr: "مكينة كاملة",    nameEn: "Complete Engine",    iconUrl: null, colorHint: undefined, parentId: 301, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 1 },
  { id: 312, nameAr: "قير أوتوماتيك",  nameEn: "Automatic Gearbox",  iconUrl: null, colorHint: undefined, parentId: 301, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 2 },
  { id: 313, nameAr: "قير عادي",       nameEn: "Manual Gearbox",     iconUrl: null, colorHint: undefined, parentId: 301, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 3 },

  // Level 3 – sub-children of 302 (بودي خارجي)
  { id: 314, nameAr: "كبوت",  nameEn: "Bonnet / Hood", iconUrl: null, colorHint: undefined, parentId: 302, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 1 },
  { id: 315, nameAr: "باب",   nameEn: "Door",           iconUrl: null, colorHint: undefined, parentId: 302, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 303 (أنوار ومرايا)
  { id: 316, nameAr: "شبكة أمامية",   nameEn: "Headlights",    iconUrl: null, colorHint: undefined, parentId: 303, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 1 },
  { id: 317, nameAr: "مرايا جانبية",  nameEn: "Side Mirrors",  iconUrl: null, colorHint: undefined, parentId: 303, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 304 (داخلي)
  { id: 318, nameAr: "لوح قيادة",  nameEn: "Dashboard Panel",  iconUrl: null, colorHint: undefined, parentId: 304, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 1 },
  { id: 319, nameAr: "كراسي",      nameEn: "Seats",             iconUrl: null, colorHint: undefined, parentId: 304, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 305 (كهرباء مستعملة)
  { id: 320, nameAr: "وحدة تحكم ECU", nameEn: "ECU / Control Unit",  iconUrl: null, colorHint: undefined, parentId: 305, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 1 },
  { id: 321, nameAr: "كابلات كهرباء", nameEn: "Wiring Harness",      iconUrl: null, colorHint: undefined, parentId: 305, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 306 (نظام التعليق)
  { id: 322, nameAr: "رفرف",       nameEn: "Fender",       iconUrl: null, colorHint: undefined, parentId: 306, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 1 },
  { id: 323, nameAr: "ذراع عفشة", nameEn: "Control Arm",  iconUrl: null, colorHint: undefined, parentId: 306, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 2 },

  // Level 3 – sub-children of 307 (جنوط وإطارات)
  { id: 324, nameAr: "جنط حديد",     nameEn: "Steel Rim",   iconUrl: null, colorHint: undefined, parentId: 307, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 1 },
  { id: 325, nameAr: "جنط ألومنيوم", nameEn: "Alloy Rim",   iconUrl: null, colorHint: undefined, parentId: 307, level: 3, providerTypeScope: "scrap", isActive: true, sortOrder: 2 },
];

/** Returns a snapshot of the in-memory categories list for use by other mock handlers. */
export function getCategoriesSnapshot(): ServiceCategory[] {
  return [...CATEGORIES];
}

let CITIES: City[] = [...KSA_CITIES].map((c) => ({
  id: c.key,
  nameAr: c.nameAr,
  nameEn: c.nameEn,
}));


const SUBCATEGORIES: Record<number, ServiceSubcategory[]> = {
  101: [
    { id: 101101, categoryId: 101, nameAr: "تغيير زيت محرك", nameEn: "Engine oil change", averagePrice: 180 },
    { id: 101102, categoryId: 101, nameAr: "تغيير فلتر زيت", nameEn: "Oil filter replacement", averagePrice: 60 },
  ],
  103: [
    { id: 103201, categoryId: 103, nameAr: "فحص كهربائي شامل", nameEn: "Full electrical check", averagePrice: 250 },
    { id: 103202, categoryId: 103, nameAr: "تركيب دينمو", nameEn: "Alternator installation", averagePrice: 450 },
  ],
  106: [
    { id: 106301, categoryId: 106, nameAr: "تغيير إطار", nameEn: "Tire replacement", averagePrice: 350 },
    { id: 106302, categoryId: 106, nameAr: "ميزانية وعدلية", nameEn: "Wheel alignment & balancing", averagePrice: 150 },
  ],
  104: [
    { id: 104501, categoryId: 104, nameAr: "تعبئة فريون", nameEn: "Refrigerant top-up", averagePrice: 200 },
    { id: 104502, categoryId: 104, nameAr: "تنظيف كمبروسر", nameEn: "Compressor cleaning", averagePrice: 320 },
  ],
  202: [
    { id: 202601, categoryId: 202, nameAr: "بطارية 60 أمبير", nameEn: "60Ah battery", averagePrice: 320 },
    { id: 202602, categoryId: 202, nameAr: "بطارية 100 أمبير", nameEn: "100Ah battery", averagePrice: 550 },
  ],
  102: [
    { id: 102701, categoryId: 102, nameAr: "كشف عطل عام", nameEn: "General diagnostics", averagePrice: 180 },
    { id: 102702, categoryId: 102, nameAr: "إصلاح ناقل الحركة", nameEn: "Gearbox repair", averagePrice: 1500 },
  ],
  108: [
    { id: 108801, categoryId: 108, nameAr: "غسيل خارجي", nameEn: "Exterior wash", averagePrice: 40 },
    { id: 108802, categoryId: 108, nameAr: "تلميع شامل", nameEn: "Full detailing", averagePrice: 350 },
  ],
  107: [
    { id: 107901, categoryId: 107, nameAr: "سمكرة قطعة", nameEn: "Body panel repair", averagePrice: 600 },
    { id: 107902, categoryId: 107, nameAr: "دهان قطعة", nameEn: "Single panel paint", averagePrice: 450 },
  ],
};

// =============================================================================
// Seed
// =============================================================================

/**
 * Seed a few demo providers so the Admin Review screen has data
 * when an admin signs in for the first time.
 *
 * categoryIds are re-pointed to valid level-2 IDs in the new tree:
 *   Workshop  → 100s
 *   Dealer    → 200s
 *   Scrap     → 300s
 */
function seedIfEmpty(db: ProvidersDb): void {
  if (db.seeded) return;
  const now = new Date().toISOString();

  const seeds: Array<ProviderProfile> = [
    {
      id: 1,
      userId: "seed_provider_1",
      companyName: "ورشة الخليج للسيارات",
      type: "workshop",
      email: "info@gulf-workshop.sa",
      phone: "501110001",
      lat: 24.7136,
      lng: 46.6753,
      address: "حي العليا، شارع الملك فهد، الرياض",
      city: "الرياض",
      workingHours: "السبت — الخميس 9 ص — 9 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "pending",
      categoryIds: [102, 101, 103], // ميكانيكا, صيانة عامة, كهرباء سيارات
      specialization: "ميكانيكا/كهرباء",
      photos: ["https://picsum.photos/seed/ws1a/400/300", "https://picsum.photos/seed/ws1b/400/300"],
      documents: [
        {
          type: "commercial",
          fileName: "commercial-register-1.pdf",
          fileSize: 245_000,
          url: "mock://docs/commercial-1.pdf",
          uploadedAt: now,
        },
        {
          type: "identity",
          fileName: "owner-id-1.jpg",
          fileSize: 980_000,
          url: "mock://docs/identity-1.jpg",
          uploadedAt: now,
        },
      ],
      rejectionReason: null,
      createdAt: now,
    },
    {
      id: 2,
      userId: "seed_provider_2",
      companyName: "مركز الإتقان للكهرباء",
      type: "workshop",
      email: "support@etqan-elec.sa",
      phone: "501110002",
      lat: 21.3891,
      lng: 39.8579,
      address: "حي الصفا، جدة",
      city: "جدة",
      workingHours: "السبت — الخميس 10 ص — 11 م",
      rating: 4.6,
      totalRatings: 132,
      isVerified: true,
      status: "approved",
      categoryIds: [103, 104], // كهرباء سيارات, تبريد وتكييف
      specialization: "تكييف وتبريد/كهرباء",
      photos: ["https://picsum.photos/seed/ws2a/400/300", "https://picsum.photos/seed/ws2b/400/300"],
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      id: 3,
      userId: "seed_provider_3",
      companyName: "مغسلة النخبة",
      type: "workshop",
      email: "hello@nokhba-wash.sa",
      phone: "501110003",
      lat: 26.4207,
      lng: 50.0888,
      address: "حي الفيصلية، الدمام",
      city: "الدمام",
      workingHours: "كل يوم 8 ص — 12 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "rejected",
      categoryIds: [108], // غسيل وتلميع
      specialization: "غسيل وتلميع",
      photos: ["https://picsum.photos/seed/ws3a/400/300", "https://picsum.photos/seed/ws3b/400/300"],
      documents: [],
      rejectionReason: "السجل التجاري غير واضح. الرجاء رفع نسخة بجودة أفضل.",
      createdAt: now,
    },
    {
      id: 4,
      userId: "seed_provider_4",
      companyName: "تشليح الرياض لقطع الغيار",
      type: "scrap",
      email: "riyadh@scrap.sa",
      phone: "501110004",
      lat: 24.5829,
      lng: 46.7725,
      address: "صناعية الشفا، الرياض",
      city: "الرياض",
      workingHours: "السبت — الخميس 8 ص — 6 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "pending",
      categoryIds: [307, 301], // جنوط وإطارات, مكائن وقيرات
      brandSpecialization: ["تويوتا", "نيسان"],
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      id: 5,
      userId: "seed_provider_5",
      companyName: "تشليح السعادة للسيارات",
      type: "scrap",
      email: "saada@scrap.sa",
      phone: "501110005",
      lat: 21.4881,
      lng: 39.1832,
      address: "صناعية جدة",
      city: "جدة",
      workingHours: "السبت — الخميس 8 ص — 6 م",
      rating: 4.2,
      totalRatings: 85,
      isVerified: true,
      status: "approved",
      categoryIds: [301, 302], // مكائن وقيرات, بودي خارجي
      brandSpecialization: ["جي إم سي", "فورد", "شيفروليه"],
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      id: 6,
      userId: "seed_provider_6",
      companyName: "تشليح المدينة للسيارات",
      type: "scrap",
      email: "madinah@scrap.sa",
      phone: "501110006",
      lat: 24.4686,
      lng: 39.6111,
      address: "المنطقة الصناعية، المدينة المنورة",
      city: "المدينة المنورة",
      workingHours: "السبت — الخميس 8 ص — 5 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "rejected",
      categoryIds: [301], // مكائن وقيرات
      brandSpecialization: ["هونداي", "كيا"],
      documents: [],
      rejectionReason: "صورة الهوية غير مطابقة",
      createdAt: now,
    },
    {
      id: 7,
      userId: "seed_provider_7",
      companyName: "متجر الشامل لقطع الغيار",
      type: "dealer",
      email: "shamel@dealer.sa",
      phone: "501110007",
      lat: 24.7115,
      lng: 46.6742,
      address: "شارع التحلية، الرياض",
      city: "الرياض",
      workingHours: "السبت — الخميس 9 ص — 10 م",
      rating: 0,
      totalRatings: 0,
      isVerified: true,
      status: "approved",
      categoryIds: [201, 208, 202], // زيوت وفلاتر, إكسسوارات, بطاريات
      commissionRate: 5,
      monthlySales: 15000,
      productCategories: ["بطاريات", "زيوت ومرشحات", "إكسسوارات"],
      productsCount: 132,
      inventoryCount: 1200,
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      id: 8,
      userId: "seed_provider_8",
      companyName: "ورشة الخليج للسيارات - جدة",
      type: "workshop",
      email: "toyota@workshop.sa",
      phone: "501110008",
      lat: 21.5433,
      lng: 39.1728,
      address: "طريق المدينة، جدة",
      city: "جدة",
      workingHours: "السبت — الخميس 9 ص — 9 م",
      rating: 4.8,
      totalRatings: 320,
      isVerified: true,
      status: "approved",
      categoryIds: [102, 101, 103], // ميكانيكا, صيانة عامة, كهرباء سيارات
      specialization: "ميكانيكا/كهرباء/صيانة دورية",
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      id: 11,
      userId: "seed_provider_10",
      companyName: "تشليح السلام",
      type: "scrap",
      email: "salam@scrap.sa",
      phone: "501110010",
      lat: 24.7136,
      lng: 46.6753,
      address: "المنطقة الصناعية الثانية، الرياض",
      city: "الرياض",
      workingHours: "السبت — الخميس 8 ص — 6 م",
      rating: 4.5,
      totalRatings: 178,
      isVerified: true,
      status: "approved",
      categoryIds: [307, 301], // جنوط وإطارات, مكائن وقيرات
      brandSpecialization: ["تويوتا", "نيسان", "بي إم دبليو", "مرسيدس"],
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      id: 9,
      userId: "seed_provider_9",
      companyName: "شركة الأجزاء الحديثة",
      type: "dealer",
      email: "modern@dealer.sa",
      phone: "501110009",
      lat: 26.3927,
      lng: 49.9777,
      address: "الشارع التجاري، الدمام",
      city: "الدمام",
      workingHours: "السبت — الخميس 9 ص — 8 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "rejected",
      categoryIds: [207, 208], // تبريد ومكيف, إكسسوارات
      commissionRate: 7,
      monthlySales: 22000,
      productCategories: ["قطع تكييف", "إكسسوارات داخلية"],
      productsCount: 24,
      inventoryCount: 150,
      documents: [],
      rejectionReason: "نقص في مستندات الوكالة التجارية",
      createdAt: now,
    },
  ];

  let maxId = 0;
  for (const seed of seeds) {
    db.providers[seed.id] = seed;
    if (seed.id > maxId) maxId = seed.id;
  }
  db.nextProviderId = maxId + 1;

  // Demo services for the first approved provider (workshop id=2).
  const approvedProviderId = Object.values(db.providers).find((p) => p.status === "approved")?.id;
  if (approvedProviderId) {
    const demoSvcs: Array<Omit<ProviderService, "id" | "providerId">> = [
      {
        name: "فحص كهربائي شامل",
        description: "كشف الأعطال الكهربائية بأحدث الأجهزة",
        price: 220,
        estimatedDuration: 45,
        categoryId: 103, // كهرباء سيارات
        subcategoryId: null,
        categoryName: "كهرباء سيارات",
        subcategoryName: null,
      },
      {
        name: "تركيب بطارية 60 أمبير",
        description: "تركيب وفحص دائرة الشحن",
        price: 380,
        estimatedDuration: 20,
        categoryId: 103, // كهرباء سيارات (battery install = electrical work)
        subcategoryId: null,
        categoryName: "كهرباء سيارات",
        subcategoryName: null,
      },
    ];
    for (const svc of demoSvcs) {
      const id = db.nextServiceId++;
      db.services[id] = { id, providerId: approvedProviderId, ...svc };
    }
  }

  db.seeded = true;
  saveDb(db);
}

// =============================================================================
// Helpers
// =============================================================================

function categoryNameById(id: number | null): string | null {
  if (id == null) return null;
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.nameAr : null;
}

function subcategoryNameById(id: number | null): string | null {
  if (id == null) return null;
  for (const subs of Object.values(SUBCATEGORIES)) {
    const s = subs.find((x) => x.id === id);
    if (s) return s.nameAr;
  }
  return null;
}

function normaliseDocs(raw: unknown): ProviderDocument[] {
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();
  const allowed: KycDocumentType[] = ["commercial", "tax", "identity"];
  return raw
    .map((entry) => {
      const e = entry as Partial<ProviderDocument>;
      if (!e || !e.type || !allowed.includes(e.type as KycDocumentType)) return null;
      return {
        type: e.type as KycDocumentType,
        fileName: String(e.fileName ?? "document"),
        fileSize: Number.isFinite(e.fileSize) ? Number(e.fileSize) : 0,
        url: e.url ?? `mock://docs/${e.fileName ?? "document"}`,
        uploadedAt: e.uploadedAt ?? now,
      } satisfies ProviderDocument;
    })
    .filter((x): x is ProviderDocument => x !== null);
}

// =============================================================================
// Handler
// =============================================================================

export async function tryProvidersMock(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();
  const db = loadDb();
  seedIfEmpty(db);

  // -- GET /Services/categories -----------------------------------------------
  if (url === "Services/categories" && method === "get") {
    return ok(config, CATEGORIES);
  }

  // -- GET /Services/categories/{id}/subcategories ----------------------------
  let m = url.match(/^Services\/categories\/(\d+)\/subcategories$/);
  if (m && method === "get") {
    const categoryId = Number(m[1]);
    return ok(config, SUBCATEGORIES[categoryId] ?? []);
  }

  // -- GET /admin/categories --------------------------------------------------
  if (url === "admin/categories" && method === "get") {
    const providerType = (config.params as { providerType?: string } | undefined)?.providerType;
    const parentIdParam = (config.params as { parentId?: string } | undefined)?.parentId;
    const levelParam = (config.params as { level?: string } | undefined)?.level;

    let filtered = [...CATEGORIES];
    if (providerType) {
      filtered = filtered.filter(
        (c) => c.providerTypeScope === null || c.providerTypeScope === providerType,
      );
    }
    if (parentIdParam !== undefined) {
      const pid = parentIdParam === "null" ? null : Number(parentIdParam);
      filtered = filtered.filter((c) => c.parentId === pid);
    }
    if (levelParam !== undefined) {
      filtered = filtered.filter((c) => c.level === Number(levelParam));
    }
    return ok(config, filtered);
  }

  // -- POST /ServiceProviders/register ----------------------------------------
  if (url === "ServiceProviders/register" && method === "post") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");

    const body = parseBody(config.data) as {
      companyName?: string;
      email?: string;
      phone?: string;
      password?: string;
      lat?: number | null;
      lng?: number | null;
      address?: string;
      city?: string;
      workingHours?: string;
      categoryIds?: number[];
      documents?: Array<Partial<ProviderDocument>>;
    };

    if (!body.companyName || !body.email || !body.phone) {
      throw fail(config, 400, "VALIDATION", "بيانات ناقصة");
    }

    const id = db.nextProviderId++;
    const profile: ProviderProfile = {
      id,
      userId: me.id,
      type: "workshop",
      companyName: String(body.companyName),
      email: String(body.email),
      phone: String(body.phone),
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      address: body.address ? String(body.address) : null,
      city: body.city ? String(body.city) : null,
      workingHours: body.workingHours ? String(body.workingHours) : null,
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "pending",
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(Number) : [],
      documents: normaliseDocs(body.documents),
      rejectionReason: null,
      createdAt: new Date().toISOString(),
    };
    db.providers[id] = profile;
    saveDb(db);

    // Flip the current user to provider/pending so the router immediately
    // sends them to the pending screen.
    const updatedUser: CurrentUser = {
      ...me,
      role: "provider",
      providerId: id,
      providerStatus: "pending",
      providerRejectionReason: null,
    };
    writeCurrentUser(updatedUser);

    return ok(config, profile, 201);
  }

  // -- GET /ServiceProviders/{id}/profile -------------------------------------
  m = url.match(/^ServiceProviders\/(\d+)\/profile$/);
  if (m && method === "get") {
    const id = Number(m[1]);
    const p = db.providers[id];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    return ok(config, p);
  }

  // -- POST /ServiceProviders/{id}/documents ----------------------------------
  m = url.match(/^ServiceProviders\/(\d+)\/documents$/);
  if (m && method === "post") {
    const id = Number(m[1]);
    const p = db.providers[id];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    const body = parseBody(config.data) as { documents?: Array<Partial<ProviderDocument>> };
    p.documents = normaliseDocs(body.documents);
    db.providers[id] = p;
    saveDb(db);
    return ok(config, p);
  }

  // -- GET /providers/{providerId}/services -----------------------------------
  m = url.match(/^providers\/(\d+)\/services$/);
  if (m && method === "get") {
    const providerId = Number(m[1]);
    const list = Object.values(db.services).filter((s) => s.providerId === providerId);
    return ok(config, list);
  }

  // -- POST /providers/{providerId}/services ----------------------------------
  if (m && method === "post") {
    const providerId = Number(m[1]);
    if (!db.providers[providerId]) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    const body = parseBody(config.data) as Partial<ProviderService>;
    if (!body.name || body.price == null) {
      throw fail(config, 400, "VALIDATION", "بيانات ناقصة");
    }
    const id = db.nextServiceId++;
    const svc: ProviderService = {
      id,
      providerId,
      name: String(body.name),
      description: body.description ?? null,
      price: Number(body.price),
      estimatedDuration:
        body.estimatedDuration != null ? Number(body.estimatedDuration) : null,
      categoryId: body.categoryId != null ? Number(body.categoryId) : null,
      subcategoryId: body.subcategoryId != null ? Number(body.subcategoryId) : null,
      categoryName: categoryNameById(body.categoryId != null ? Number(body.categoryId) : null),
      subcategoryName: subcategoryNameById(
        body.subcategoryId != null ? Number(body.subcategoryId) : null,
      ),
    };
    db.services[id] = svc;
    saveDb(db);
    return ok(config, svc, 201);
  }

  // -- PUT /providers/{providerId}/services/{serviceId} -----------------------
  m = url.match(/^providers\/(\d+)\/services\/(\d+)$/);
  if (m && method === "put") {
    const providerId = Number(m[1]);
    const serviceId = Number(m[2]);
    const svc = db.services[serviceId];
    if (!svc || svc.providerId !== providerId) {
      throw fail(config, 404, "NOT_FOUND", "غير موجود");
    }
    const body = parseBody(config.data) as Partial<ProviderService>;
    const updated: ProviderService = {
      ...svc,
      name: body.name ? String(body.name) : svc.name,
      description: body.description ?? svc.description,
      price: body.price != null ? Number(body.price) : svc.price,
      estimatedDuration:
        body.estimatedDuration != null ? Number(body.estimatedDuration) : svc.estimatedDuration,
      categoryId: body.categoryId != null ? Number(body.categoryId) : svc.categoryId,
      subcategoryId:
        body.subcategoryId != null ? Number(body.subcategoryId) : svc.subcategoryId,
    };
    updated.categoryName = categoryNameById(updated.categoryId);
    updated.subcategoryName = subcategoryNameById(updated.subcategoryId);
    db.services[serviceId] = updated;
    saveDb(db);
    return ok(config, updated);
  }

  // -- DELETE /providers/{providerId}/services/{serviceId} --------------------
  if (m && method === "delete") {
    const providerId = Number(m[1]);
    const serviceId = Number(m[2]);
    const svc = db.services[serviceId];
    if (!svc || svc.providerId !== providerId) {
      throw fail(config, 404, "NOT_FOUND", "غير موجود");
    }
    delete db.services[serviceId];
    saveDb(db);
    return ok(config, { success: true });
  }

  // -- POST /admin/categories -------------------------------------------------
  if (url === "admin/categories" && method === "post") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const body = parseBody(config.data) as {
      nameAr?: string;
      nameEn?: string;
      iconUrl?: string | null;
      colorHint?: ServiceCategory["colorHint"];
      parentId?: number | null;
      providerTypeScope?: ProviderType | null;
      isActive?: boolean;
      sortOrder?: number;
    };

    if (!body.nameAr || !body.nameEn) {
      throw fail(config, 400, "VALIDATION", "بيانات ناقصة");
    }

    // Resolve parentId, level, and inherited providerTypeScope
    const parentId: number | null = body.parentId !== undefined ? body.parentId : null;
    let level: 1 | 2 | 3 = 1;
    let providerTypeScope: ProviderType | null = body.providerTypeScope ?? null;

    if (parentId !== null) {
      const parent = CATEGORIES.find((c) => c.id === parentId);
      if (!parent) throw fail(config, 400, "VALIDATION", "الصنف الأب غير موجود");
      if (parent.level >= 3) {
        throw fail(config, 400, "VALIDATION", "لا يمكن إضافة مستوى رابع — الحد الأقصى 3 مستويات");
      }
      level = (parent.level + 1) as 1 | 2 | 3;
      // Inherit scope from parent when caller does not supply one
      if (providerTypeScope === null) {
        providerTypeScope = parent.providerTypeScope;
      }
    }

    const id = nextCategoryId++;
    const newCat: ServiceCategory = {
      id,
      nameAr: String(body.nameAr),
      nameEn: String(body.nameEn),
      iconUrl: body.iconUrl ? String(body.iconUrl) : null,
      colorHint: body.colorHint as ServiceCategory["colorHint"],
      parentId,
      level,
      providerTypeScope,
      isActive: body.isActive !== false,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    };
    CATEGORIES.push(newCat);
    return ok(config, newCat, 201);
  }

  // -- PUT /admin/categories/{id} ---------------------------------------------
  m = url.match(/^admin\/categories\/(\d+)$/);
  if (m && method === "put") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const id = Number(m[1]);
    const index = CATEGORIES.findIndex((c) => c.id === id);
    if (index === -1) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    const body = parseBody(config.data) as Partial<ServiceCategory>;
    const existing = CATEGORIES[index];
    const updated: ServiceCategory = {
      ...existing,
      nameAr: body.nameAr ? String(body.nameAr) : existing.nameAr,
      nameEn: body.nameEn ? String(body.nameEn) : existing.nameEn,
      iconUrl: body.iconUrl !== undefined ? (body.iconUrl ? String(body.iconUrl) : null) : existing.iconUrl,
      colorHint: body.colorHint !== undefined ? body.colorHint as ServiceCategory["colorHint"] : existing.colorHint,
      // Allowed mutable fields — level/parentId move is out of scope Phase 2
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sortOrder,
    };
    CATEGORIES[index] = updated;
    return ok(config, updated);
  }

  // -- DELETE /admin/categories/{id} ------------------------------------------
  if (m && method === "delete") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const id = Number(m[1]);
    const index = CATEGORIES.findIndex((c) => c.id === id);
    if (index === -1) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    // Guard: children
    const childCount = CATEGORIES.filter((c) => c.parentId === id).length;

    // Guard: references in ProviderProfile.categoryIds and ProviderService.categoryId
    const refProviders = Object.values(db.providers).filter((p) =>
      p.categoryIds.includes(id),
    ).length;
    const refProviderServices = Object.values(db.services).filter(
      (s) => s.categoryId === id,
    ).length;
    const referenceCount = refProviders + refProviderServices;

    if (childCount > 0 || referenceCount > 0) {
      const conflictErr = new Error("لا يمكن الحذف — الصنف قيد الاستخدام") as Error & {
        isAxiosError: boolean;
        response: AxiosResponse;
        config: InternalAxiosRequestConfig;
      };
      conflictErr.isAxiosError = true;
      conflictErr.config = config;
      conflictErr.response = {
        data: {
          error: "in_use",
          childCount,
          referenceCount,
          message: childCount > 0
            ? `لا يمكن الحذف: يوجد ${childCount} فئة فرعية. احذفها أولاً أو استخدم التعطيل.`
            : `لا يمكن الحذف: الصنف مرتبط بـ ${referenceCount} سجل. استخدم التعطيل بدلاً من الحذف.`,
        },
        status: 409,
        statusText: "Conflict",
        headers: new AxiosHeaders(),
        config,
      };
      throw conflictErr;
    }

    CATEGORIES.splice(index, 1);
    return ok(config, { success: true });
  }

  // -- PATCH /admin/categories/{id} (deactivate) ──────────────────────────────
  // Allows toggling isActive without deleting — safe alternative to DELETE.
  m = url.match(/^admin\/categories\/(\d+)$/);
  if (m && method === "patch") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const id = Number(m[1]);
    const index = CATEGORIES.findIndex((c) => c.id === id);
    if (index === -1) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    const body = parseBody(config.data) as { isActive?: boolean };
    if (body.isActive !== undefined) {
      CATEGORIES[index] = { ...CATEGORIES[index], isActive: Boolean(body.isActive) };
    }
    return ok(config, CATEGORIES[index]);
  }

  // -- GET /admin/cities ------------------------------------------------------
  if (url === "admin/cities" && method === "get") {
    return ok(config, CITIES);
  }

  // -- POST /admin/cities -----------------------------------------------------
  if (url === "admin/cities" && method === "post") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const body = parseBody(config.data) as Partial<City>;
    if (!body.nameAr || !body.nameEn) {
      throw fail(config, 400, "VALIDATION", "بيانات ناقصة");
    }

    const newCity: City = {
      id: `city_${Date.now()}`,
      nameAr: String(body.nameAr),
      nameEn: String(body.nameEn),
    };
    CITIES.push(newCity);
    return ok(config, newCity, 201);
  }

  // -- PUT /admin/cities/{id} -------------------------------------------------
  m = url.match(/^admin\/cities\/([^/]+)$/);
  if (m && method === "put") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const id = m[1];
    const index = CITIES.findIndex((c) => c.id === id);
    if (index === -1) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    const body = parseBody(config.data) as Partial<City>;
    const updated: City = {
      ...CITIES[index],
      nameAr: body.nameAr ? String(body.nameAr) : CITIES[index].nameAr,
      nameEn: body.nameEn ? String(body.nameEn) : CITIES[index].nameEn,
    };
    CITIES[index] = updated;
    return ok(config, updated);
  }

  // -- DELETE /admin/cities/{id} ----------------------------------------------
  if (m && method === "delete") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const id = m[1];
    const index = CITIES.findIndex((c) => c.id === id);
    if (index === -1) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    CITIES.splice(index, 1);
    return ok(config, { success: true });
  }


  // -- GET /admin/providers?status=pending|approved|rejected ------------------
  if (url === "admin/providers" && method === "get") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");
    const status = (config.params as { status?: string } | undefined)?.status;
    const type = (config.params as { type?: string } | undefined)?.type;
    const all = Object.values(db.providers);
    let filtered =
      !status || status === "all" ? all : all.filter((p) => p.status === status);

    if (type) {
      filtered = filtered.filter((p) => p.type === type);
    }
    // Newest first
    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return ok(config, filtered);
  }

  // -- PATCH /admin/providers/{id}/approve ------------------------------------
  m = url.match(/^admin\/providers\/(\d+)\/approve$/);
  if (m && method === "patch") {
    const me = readCurrentUser();
    if (!me || (me.role !== "admin" && me.role !== "super_admin")) throw fail(config, 403, "FORBIDDEN", "غير مسموح");
    const id = Number(m[1]);
    const p = db.providers[id];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    p.status = "approved";
    p.isVerified = true;
    p.rejectionReason = null;
    db.providers[id] = p;
    saveDb(db);
    return ok(config, p);
  }

  // -- PATCH /admin/providers/{id}/reject -------------------------------------
  m = url.match(/^admin\/providers\/(\d+)\/reject$/);
  if (m && method === "patch") {
    const me = readCurrentUser();
    if (!me || (me.role !== "admin" && me.role !== "super_admin")) throw fail(config, 403, "FORBIDDEN", "غير مسموح");
    const id = Number(m[1]);
    const p = db.providers[id];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    const body = parseBody(config.data) as { reason?: string };
    p.status = "rejected";
    p.isVerified = false;
    p.rejectionReason = body.reason ? String(body.reason) : "بدون سبب محدد";
    db.providers[id] = p;
    saveDb(db);
    return ok(config, p);
  }

  // -- PATCH /admin/providers/{id}/commission ---------------------------------
  m = url.match(/^admin\/providers\/(\d+)\/commission$/);
  if (m && method === "patch") {
    const me = readCurrentUser();
    if (!me || (me.role !== "admin" && me.role !== "super_admin")) throw fail(config, 403, "FORBIDDEN", "غير مسموح");
    const id = Number(m[1]);
    const p = db.providers[id];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    const body = parseBody(config.data) as { commissionRate?: number };
    if (body.commissionRate !== undefined) {
      p.commissionRate = Number(body.commissionRate);
      db.providers[id] = p;
      saveDb(db);
    }
    return ok(config, p);
  }

  // -- GET /provider/me -------------------------------------------------------
  if (url === "provider/me" && method === "get") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "provider" && me.role !== "driver") throw fail(config, 403, "FORBIDDEN", "غير مسموح");
    if (!me.providerId) throw fail(config, 404, "NOT_FOUND", "بيانات المزود غير موجودة");

    const p = db.providers[me.providerId];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    return ok(config, p);
  }

  // Not ours.
  return null;
}
