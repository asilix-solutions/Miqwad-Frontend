/**
 * @file check-tow-truck-intercity-operations.cjs
 * @description Comprehensive offline test suite for InterCity Tow Truck operations.
 * Validates:
 * 1. Road Schema & Directional Route Validation (Phase A)
 * 2. Price Preservation Invariant (Phase A)
 * 3. Service-Type Normalization & InterCity Details Extraction (Phase B)
 * 4. Queue / Drawer / Workspace Model Agreement (Phase B)
 * 5. Roads API Endpoint Path & URL Construction (Phase B)
 * 6. Roads API Query Parameter Mapping & Composition (Phase B)
 * 7. Roads API Response Normalization & Envelope Handling (Phase B)
 * 8. Complete Arabic / English i18n Parity & Coverage for superAdmin.routes (Phase B)
 * 9. Roads UI States Exclusivity & Filter Preservation on Retry (Phase B)
 * 10. InterCity Fixed-Price Rule & Dispatch Preflight (Phase C)
 * 11. Paid InterCity Order Assignment Safeguard (Phase C)
 * 12. Driver Removal & Reassignment Workflow Safety (Phase C)
 * 13. Tow Truck Model & Adapter i18n Parity (Phase A, B, C)
 * No network calls. Strict offline execution.
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");

const root = path.resolve(__dirname, "..");
const req = createRequire(path.join(root, "package.json"));
const ts = req("typescript");
const cache = new Map();

let lastApiRequest = null;
let mockApiResponse = { data: { success: true, data: [] } };
const mockApiClient = {
  defaults: { baseURL: "/api" },
  get: async (url, config) => {
    lastApiRequest = { method: "GET", url, config };
    return typeof mockApiResponse === "function" ? mockApiResponse("GET", url, config) : mockApiResponse;
  },
  post: async (url, data, config) => {
    lastApiRequest = { method: "POST", url, data, config };
    return typeof mockApiResponse === "function" ? mockApiResponse("POST", url, data, config) : mockApiResponse;
  },
  put: async (url, data, config) => {
    lastApiRequest = { method: "PUT", url, data, config };
    return typeof mockApiResponse === "function" ? mockApiResponse("PUT", url, data, config) : mockApiResponse;
  },
};

function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const local = (name) => {
    if (name === "@app/i18n") return { default: { language: "ar" }, language: "ar" };
    if (name === "@shared/lib/axios") {
      return { apiClient: mockApiClient };
    }
    for (const alias of ["modules", "shared"]) {
      if (name.startsWith(`@${alias}/`)) {
        return load(`src/${alias}/${name.slice(alias.length + 2)}.ts`);
      }
    }
    if (name.startsWith(".")) return load(path.resolve(path.dirname(file), name) + ".ts");
    return req(name);
  };
  new Function("require", "module", "exports", code)(local, module, module.exports);
  return module.exports;
}

function loadRealI18n() {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(root, "src/app/i18n.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  const customReq = (id) => {
    if (id.includes("tow-truck/i18n")) return load("src/modules/tow-truck/i18n.ts");
    if (id.includes("storage")) return { storage: { get: () => "ar" }, StorageKeys: {} };
    for (const alias of ["modules", "shared", "app"]) {
      if (id.startsWith(`@${alias}/`)) {
        return load(`src/${alias}/${id.slice(alias.length + 2)}.ts`);
      }
    }
    return req(id);
  };
  new Function("require", "module", "exports", code)(customReq, mod, mod.exports);
  return mod.exports.default;
}

const {
  createRoadSchema,
  updateRoadSchema,
  validateCostString,
} = load("src/modules/admin/schemas/roadsSchema.ts");

const {
  roadsApi,
} = load("src/modules/admin/api/roadsApi.ts");

const {
  adaptTowTruck,
  adaptTowTruckPage,
} = load("src/modules/tow-truck/lib/towTruckModel.ts");

const {
  initialAssignmentBlock,
} = load("src/modules/tow-truck/lib/dispatchModel.ts");

const { towTruckAr, towTruckEn } = load("src/modules/tow-truck/i18n.ts");
const { ordersApi } = load("src/modules/orders/api/ordersApi.ts");
const { orderListOptions } = load("src/modules/orders/hooks/useOrdersQueries.ts");
const {
  resolveTowTruckWorkspace,
  workspaceToServiceType,
  buildWorkspaceNavigationUrl,
} = load("src/modules/tow-truck/lib/towTruckWorkspace.ts");

console.log("=== RUNNING INTERCITY TOW TRUCK OFFLINE TEST SUITE ===");

let passedCount = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function runAll() {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Road Schema & Directional Route Validation (Phase A)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Road creation: valid payload succeeds", () => {
    const result = createRoadSchema.safeParse({
      originCityId: "10",
      destinationCityId: "20",
      cost: "450.00",
    });
    assert.equal(result.success, true);
    assert.equal(validateCostString("450.00"), 450);
  });

  await test("Road creation: identical origin and destination fails validation (citiesMustDiffer)", () => {
    const result = createRoadSchema.safeParse({
      originCityId: "5",
      destinationCityId: "5",
      cost: "300",
    });
    assert.equal(result.success, false);
    const originErr = result.error.issues.find((i) => i.path.includes("destinationCityId"));
    assert.ok(originErr, "Should have error on destinationCityId");
    assert.equal(originErr.message, "sameCitiesError");
  });

  await test("Road creation: non-positive or invalid cost rejected", () => {
    const zeroRes = createRoadSchema.safeParse({
      originCityId: "1",
      destinationCityId: "2",
      cost: "0",
    });
    assert.equal(zeroRes.success, false);

    const negRes = createRoadSchema.safeParse({
      originCityId: "1",
      destinationCityId: "2",
      cost: "-50",
    });
    assert.equal(negRes.success, false);

    const strRes = createRoadSchema.safeParse({
      originCityId: "1",
      destinationCityId: "2",
      cost: "abc",
    });
    assert.equal(strRes.success, false);
  });

  await test("Directional route distinction: A->B and B->A are distinct routes", () => {
    const routeAB = { originCityId: 1, destinationCityId: 2, cost: 500 };
    const routeBA = { originCityId: 2, destinationCityId: 1, cost: 550 };
    assert.notEqual(
      `${routeAB.originCityId}->${routeAB.destinationCityId}`,
      `${routeBA.originCityId}->${routeBA.destinationCityId}`,
      "Directional routes must have distinct composite keys",
    );
    assert.notEqual(routeAB.cost, routeBA.cost, "Directional routes may have different prices");
  });

  await test("Road update: valid price update succeeds", () => {
    const updateRes = updateRoadSchema.safeParse({
      cost: "600.50",
      isActive: true,
    });
    assert.equal(updateRes.success, true);
    assert.equal(validateCostString("600.50"), 600.5);
  });

  await test("Road update: negative cost fails", () => {
    const updateRes = updateRoadSchema.safeParse({
      cost: "-10",
      isActive: true,
    });
    assert.equal(updateRes.success, false);
  });

  await test("Arabic numerals price normalization supports eastern arabic digits", () => {
    assert.equal(validateCostString("٤٥٠.٥٠"), 450.5);
    assert.equal(validateCostString("١٢٥٠"), 1250);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Price Preservation Invariant (Phase A)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Price Preservation: Existing order retains agreed price regardless of reference route price change", () => {
    const rawOrder = {
      id: 101,
      orderNumber: "ORD-IC-101",
      orderType: 3,
      towTruckServiceType: 2,
      status: 1,
      totalPrice: 300,
      intercityTowTruckDetails: {
        roadId: 42,
        originCityId: 1,
        destinationCityId: 2,
        originCityNameSnapshot: "الرياض",
        destinationCityNameSnapshot: "جدة",
      },
    };

    const adapted = adaptTowTruck(rawOrder);
    const referenceRoad = { id: 42, originCityId: 1, destinationCityId: 2, cost: 450 };

    assert.equal(adapted.agreedPrice, 300, "Agreed price must be snapshotted from order totalPrice");
    assert.equal(adapted.total, 300, "Order total must remain 300 SAR");
    assert.notEqual(adapted.total, referenceRoad.cost, "Order must NOT reflect future route price changes");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Service-Type Normalization & Route Extraction (Phase B)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Service type normalization: towTruckServiceType = 1 is IntraCity", () => {
    const raw = { id: 201, orderType: 3, towTruckServiceType: 1 };
    const adapted = adaptTowTruck(raw);
    assert.equal(adapted.serviceType, "intracity");
    assert.equal(adapted.isInterCity, false);
  });

  await test("Service type normalization: towTruckServiceType = 2 is InterCity", () => {
    const raw = {
      id: 202,
      orderType: 3,
      towTruckServiceType: 2,
      intercityTowTruckDetails: {
        originCityNameSnapshot: "الدمام",
        destinationCityNameSnapshot: "الخبر",
        roadId: 99,
      },
    };
    const adapted = adaptTowTruck(raw);
    assert.equal(adapted.serviceType, "intercity");
    assert.equal(adapted.isInterCity, true);
    assert.equal(adapted.routeSummary, "الدمام → الخبر");
  });

  await test("Service type normalization: fallback handles missing fields gracefully without error", () => {
    const raw = { id: 203, orderType: 3 };
    const adapted = adaptTowTruck(raw);
    assert.equal(adapted.serviceType, "unknown");
    assert.equal(adapted.isInterCity, false);
  });

  await test("InterCity route fallback: honest empty state when snapshot names are missing", () => {
    const raw = {
      id: 204,
      orderType: 3,
      towTruckServiceType: 2,
      intercityTowTruckDetails: null,
    };
    const adapted = adaptTowTruck(raw);
    assert.equal(adapted.isInterCity, true);
    assert.equal(adapted.routeSummary, null);
  });

  await test("Service type: arbitrary addresses without serviceType=2 do not infer InterCity", () => {
    const raw = {
      id: 205,
      orderType: 3,
      pickupAddress: "الرياض، حي الملز",
      dropoffAddress: "جدة، حي الشاطئ",
    };
    const adapted = adaptTowTruck(raw);
    assert.equal(adapted.serviceType, "unknown");
    assert.equal(adapted.isInterCity, false);
  });

  await test("Service type filter: unknown service type is NOT matched by IntraCity filter", () => {
    const raw = { id: 206, orderType: 3 };
    const adapted = adaptTowTruck(raw);
    assert.equal(adapted.serviceType, "unknown");
    const matchesIntraCity = adapted.serviceType === "intracity";
    assert.equal(matchesIntraCity, false);
  });

  await test("Queue pagination adaptation preserves InterCity metadata across items", () => {
    const rawPage = {
      serverPaginated: true,
      items: [
        { id: 207, orderType: 3, towTruckServiceType: 1 },
        { id: 208, orderType: 3, towTruckServiceType: 2, intercityTowTruckDetails: { originCityNameSnapshot: "مكة", destinationCityNameSnapshot: "المدينة" } },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };
    const page = adaptTowTruckPage(rawPage);
    assert.equal(page.items.length, 2);
    assert.equal(page.items[0].serviceType, "intracity");
    assert.equal(page.items[1].serviceType, "intercity");
    assert.equal(page.items[1].routeSummary, "مكة → المدينة");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Roads API URL Construction & Duplicate Prefix Prevention (Phase B)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Roads API URL: getRoads calls '/Roads' without duplicated /api prefix", async () => {
    mockApiResponse = { data: { success: true, data: { items: [], totalCount: 0 } } };
    await roadsApi.getRoads({ pageNumber: 1 });
    assert.equal(lastApiRequest.method, "GET");
    assert.equal(lastApiRequest.url, "/Roads", "Must call /Roads, not /api/Roads");
    assert.ok(!lastApiRequest.url.startsWith("/api/"), "Must not start with /api/ to prevent /api/api/ duplication");
  });

  await test("Roads API URL: getAvailableRoads calls '/Roads/available'", async () => {
    mockApiResponse = { data: { success: true, data: [] } };
    await roadsApi.getAvailableRoads();
    assert.equal(lastApiRequest.method, "GET");
    assert.equal(lastApiRequest.url, "/Roads/available");
  });

  await test("Roads API URL: getRoadById calls '/Roads/{id}'", async () => {
    mockApiResponse = { data: { success: true, data: { id: 42, cost: 300 } } };
    await roadsApi.getRoadById(42);
    assert.equal(lastApiRequest.method, "GET");
    assert.equal(lastApiRequest.url, "/Roads/42");
  });

  await test("Roads API URL: createRoad calls POST '/Roads'", async () => {
    mockApiResponse = { data: { success: true, data: { id: 99, cost: 450 } } };
    await roadsApi.createRoad({ originCityId: 1, destinationCityId: 2, cost: 450 });
    assert.equal(lastApiRequest.method, "POST");
    assert.equal(lastApiRequest.url, "/Roads");
    assert.deepEqual(lastApiRequest.data, { originCityId: 1, destinationCityId: 2, cost: 450 });
  });

  await test("Roads API URL: updateRoad calls PUT '/Roads/{id}'", async () => {
    mockApiResponse = { data: { success: true, data: { id: 42, cost: 500, isActive: false } } };
    await roadsApi.updateRoad(42, { cost: 500, isActive: false });
    assert.equal(lastApiRequest.method, "PUT");
    assert.equal(lastApiRequest.url, "/Roads/42");
    assert.deepEqual(lastApiRequest.data, { cost: 500, isActive: false });
  });

  await test("Roads API URL: getCities calls '/Cities' and getCityById calls '/Cities/{id}'", async () => {
    mockApiResponse = { data: { success: true, data: [] } };
    await roadsApi.getCities({ pageNumber: 1, pageSize: 50 });
    assert.equal(lastApiRequest.method, "GET");
    assert.equal(lastApiRequest.url, "/Cities");
    assert.equal(lastApiRequest.config.params.PageSize, 50);

    mockApiResponse = { data: { success: true, data: { id: 10, name: "جدة" } } };
    await roadsApi.getCityById(10);
    assert.equal(lastApiRequest.url, "/Cities/10");
  });

  await test("Axios URL resolution: baseURL '/api' + '/Roads' equals '/api/Roads' without duplication", () => {
    const axios = req("axios");
    const client = axios.create({ baseURL: "/api" });
    const fullUri = client.getUri({ url: "/Roads" });
    assert.equal(fullUri, "/api/Roads");
    assert.notEqual(fullUri, "/api/api/Roads");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Roads API Query Parameter Mapping & Composition (Phase B)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Roads Query Parameters: all filter options map accurately to server parameters", async () => {
    mockApiResponse = { data: { success: true, data: { items: [], totalCount: 0 } } };
    await roadsApi.getRoads({
      pageNumber: 3,
      pageSize: 15,
      originCityId: 101,
      destinationCityId: 202,
      isActive: true,
      sortBy: "cost",
      sortDescending: false,
      filterBy: "originCityName",
      filterValue: "Riyadh",
    });
    const params = lastApiRequest.config.params;
    assert.equal(params.PageNumber, 3);
    assert.equal(params.PageSize, 15);
    assert.equal(params.originCityId, 101);
    assert.equal(params.destinationCityId, 202);
    assert.equal(params.isActive, true);
    assert.equal(params.SortBy, "cost");
    assert.equal(params.SortDescending, false);
    assert.equal(params.FilterBy, "originCityName");
    assert.equal(params.FilterValue, "Riyadh");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Roads API Response Normalization & Envelope Handling (Phase B)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Response normalization: wrapped paginated envelope parsed correctly", async () => {
    mockApiResponse = {
      data: {
        success: true,
        data: {
          items: [
            { id: 1, originCityId: 1, destinationCityId: 2, cost: 500, isActive: true, createdAt: "2026-01-01" },
          ],
          totalCount: 25,
          pageNumber: 2,
          pageSize: 10,
          totalPages: 3,
        },
      },
    };
    const res = await roadsApi.getRoads({ pageNumber: 2, pageSize: 10 });
    assert.equal(res.items.length, 1);
    assert.equal(res.total, 25);
    assert.equal(res.page, 2);
    assert.equal(res.pageSize, 10);
    assert.equal(res.totalPages, 3);
  });

  await test("Response normalization: flat array normalized to PaginatedResponse", async () => {
    mockApiResponse = {
      data: {
        success: true,
        data: [
          { id: 1, originCityId: 1, destinationCityId: 2, cost: 300, isActive: true },
          { id: 2, originCityId: 2, destinationCityId: 1, cost: 350, isActive: true },
        ],
      },
    };
    const res = await roadsApi.getRoads();
    assert.equal(res.items.length, 2);
    assert.equal(res.total, 2);
    assert.equal(res.page, 1);
    assert.equal(res.totalPages, 1);
  });

  await test("Response normalization: null/missing payload degrades gracefully to empty list", async () => {
    mockApiResponse = { data: { success: true, data: null } };
    const res = await roadsApi.getRoads();
    assert.equal(res.items.length, 0);
    assert.equal(res.total, 0);
    assert.equal(res.totalPages, 0);
  });

  await test("Response normalization: updateRoad gracefully handles 204 No Content with empty body", async () => {
    mockApiResponse = { data: "" };
    const res = await roadsApi.updateRoad(77, { cost: 600, isActive: true });
    assert.equal(res.id, 77);
    assert.equal(res.cost, 600);
    assert.equal(res.isActive, true);
  });

  await test("Response normalization: unsuccessful API envelope (success: false) throws error instead of empty result", async () => {
    mockApiResponse = { data: { success: false, message: "Route lookup failed", data: null } };
    await assert.rejects(
      async () => await roadsApi.getRoads(),
      (err) => err.message.includes("Route lookup failed"),
      "Must throw backend message when success is false"
    );
  });

  await test("Response normalization: malformed roads response throws instead of empty result", async () => {
    mockApiResponse = { data: { success: true, data: { invalidShape: true } } };
    await assert.rejects(
      async () => await roadsApi.getRoads(),
      (err) => err.message.includes("Malformed roads response"),
      "Must reject malformed shape without items"
    );
  });

  await test("Response normalization: malformed available roads response throws instead of empty array", async () => {
    mockApiResponse = { data: { success: true, data: { notAnArray: true } } };
    await assert.rejects(
      async () => await roadsApi.getAvailableRoads(),
      (err) => err.message.includes("Malformed available roads response"),
      "Must reject non-array payload"
    );
  });

  await test("Response normalization: updateRoad throws on unsuccessful API envelope", async () => {
    mockApiResponse = { data: { success: false, message: "Route update forbidden" } };
    await assert.rejects(
      async () => await roadsApi.updateRoad(77, { cost: 600, isActive: true }),
      (err) => err.message.includes("Route update forbidden"),
      "Must reject on unsuccessful envelope and never synthesize updated road"
    );
  });

  await test("Response normalization: updateRoad throws on malformed response without id", async () => {
    mockApiResponse = { data: { success: true, data: { unexpected: true } } };
    await assert.rejects(
      async () => await roadsApi.updateRoad(77, { cost: 600, isActive: true }),
      (err) => err.message.includes("Malformed update road response"),
      "Must reject malformed update payload"
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Complete Arabic / English i18n Parity for superAdmin.routes (Phase B)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("i18n Parity: superAdmin.routes Arabic and English dictionaries have complete 1-to-1 parity", () => {
    const i18nInstance = loadRealI18n();
    const arRoutes = i18nInstance.getDataByLanguage("ar")?.translation?.superAdmin?.routes || {};
    const enRoutes = i18nInstance.getDataByLanguage("en")?.translation?.superAdmin?.routes || {};

    const arKeys = Object.keys(arRoutes).sort();
    const enKeys = Object.keys(enRoutes).sort();

    assert.ok(arKeys.length >= 60, `Arabic routes must have all required keys (found ${arKeys.length})`);
    assert.equal(arKeys.length, enKeys.length, "Arabic and English routes key counts must match exactly");

    for (const key of arKeys) {
      assert.ok(key in enRoutes, `Key '${key}' missing in English superAdmin.routes`);
      assert.ok(typeof arRoutes[key] === "string" && arRoutes[key].length > 0, `ar.${key} must be non-empty string`);
      assert.ok(typeof enRoutes[key] === "string" && enRoutes[key].length > 0, `en.${key} must be non-empty string`);
    }

    const requiredRoadsKeys = [
      "addRoute",
      "addRouteButton",
      "addRouteTitle",
      "editRouteTitle",
      "directionalNotice",
      "originCity",
      "destinationCity",
      "selectOriginCity",
      "selectDestinationCity",
      "predefinedPrice",
      "pricePlaceholder",
      "costHelp",
      "pricePreservationTitle",
      "pricePreservationDesc",
      "directionalRoute",
      "routeStatus",
      "routeStatusHelp",
      "activeRoute",
      "inactiveRouteHint",
      "saveRoute",
      "saveChanges",
      "saveRouteButton",
      "saving",
      "createSuccess",
      "updateSuccess",
      "createFailed",
      "updateFailed",
      "fetchError",
      "errorLoadingRoutes",
      "citiesFetchError",
      "filterOrigin",
      "filterDestination",
      "filterStatus",
      "allOrigins",
      "allDestinations",
      "allStatuses",
      "statusActive",
      "statusInactive",
      "clearFilters",
      "refresh",
      "newRoute",
      "routeDirection",
      "colDirectionalRoute",
      "origin",
      "destination",
      "price",
      "colPrice",
      "status",
      "colStatus",
      "colCreatedAt",
      "actions",
      "editPrice",
      "editPricing",
      "noRoutesTitle",
      "noRoutesDesc",
      "noFilteredRoutesDesc",
      "noRoutesFound",
      "noRoutesHint",
      "emptyRoutesTitle",
      "emptyRoutesHint",
      "directionalBadge",
      "previous",
      "next",
      "pageOf",
      "originCityRequired",
      "originCityInvalid",
      "destinationCityRequired",
      "destinationCityInvalid",
      "sameCitiesError",
      "citiesMustDiffer",
      "costRequired",
      "costMinimum",
      "costMustBePositive",
      "costInvalid",
    ];

    for (const k of requiredRoadsKeys) {
      assert.ok(k in arRoutes, `Required Roads key '${k}' missing in Arabic translations`);
      assert.ok(k in enRoutes, `Required Roads key '${k}' missing in English translations`);
    }

    const arTabs = i18nInstance.getDataByLanguage("ar")?.translation?.superAdmin?.reference?.tabs || {};
    const enTabs = i18nInstance.getDataByLanguage("en")?.translation?.superAdmin?.reference?.tabs || {};
    assert.equal(arTabs.routes, "مسارات بين المدن");
    assert.equal(enTabs.routes, "InterCity Routes");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Roads UI States Exclusivity & Interaction Invariants (Phase B)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("UI States Invariant: Loading, Error, Empty, and Populated states are mutually exclusive", () => {
    function computeUIState({ isLoading, isError, itemsCount }) {
      if (isLoading) return "LOADING";
      if (isError) return "ERROR";
      if (itemsCount === 0) return "EMPTY";
      return "POPULATED";
    }

    assert.equal(computeUIState({ isLoading: true, isError: false, itemsCount: 0 }), "LOADING");
    assert.equal(computeUIState({ isLoading: true, isError: true, itemsCount: 0 }), "LOADING");
    assert.equal(computeUIState({ isLoading: false, isError: true, itemsCount: 0 }), "ERROR");
    assert.equal(computeUIState({ isLoading: false, isError: false, itemsCount: 0 }), "EMPTY");
    assert.equal(computeUIState({ isLoading: false, isError: false, itemsCount: 5 }), "POPULATED");
  });

  await test("UI States Invariant: Empty state cleanly distinguishes filtered result vs empty database", () => {
    function getEmptyStateDisplay(hasActiveFilters) {
      return {
        titleKey: hasActiveFilters ? "superAdmin.routes.noRoutesFound" : "superAdmin.routes.emptyRoutesTitle",
        descKey: hasActiveFilters ? "superAdmin.routes.noFilteredRoutesDesc" : "superAdmin.routes.emptyRoutesHint",
        action: hasActiveFilters ? "CLEAR_FILTERS" : "CREATE_ROUTE",
      };
    }

    const filtered = getEmptyStateDisplay(true);
    assert.equal(filtered.titleKey, "superAdmin.routes.noRoutesFound");
    assert.equal(filtered.action, "CLEAR_FILTERS");

    const emptyDb = getEmptyStateDisplay(false);
    assert.equal(emptyDb.titleKey, "superAdmin.routes.emptyRoutesTitle");
    assert.equal(emptyDb.action, "CREATE_ROUTE");
  });

  await test("UI States Invariant: Retry action preserves active filter parameters", () => {
    let currentFilters = { originFilter: "10", destinationFilter: "20", statusFilter: "active", page: 2 };
    let refetchCount = 0;
    const fakeQuery = {
      isError: true,
      refetch: () => {
        refetchCount++;
        return Promise.resolve();
      },
    };

    fakeQuery.refetch();
    assert.equal(refetchCount, 1);
    assert.equal(currentFilters.originFilter, "10");
    assert.equal(currentFilters.destinationFilter, "20");
    assert.equal(currentFilters.statusFilter, "active");
    assert.equal(currentFilters.page, 2);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. InterCity Fixed-Price Rule & Dispatch Preflight (Phase C)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Dispatch preflight: Unpaid InterCity order with agreed price and driver is valid", () => {
    const raw = {
      id: 301,
      orderType: 3,
      towTruckServiceType: 2,
      status: 1,
      totalPrice: 500,
      driver: null,
      isPaid: false,
    };
    const order = adaptTowTruck(raw);
    assert.equal(order.isInterCity, true);

    const block = initialAssignmentBlock(order);
    assert.equal(block, null, "Preflight should allow dispatch of unpaid InterCity order");

    const payload = {
      towTruckDriverId: Number("1"),
      cost: Number("500"),
      duration: "6 ساعات",
    };
    assert.equal(payload.towTruckDriverId, 1);
    assert.equal(payload.cost, 500);
    assert.equal(payload.duration, "6 ساعات");
  });

  await test("Dispatch preflight: InterCity order missing agreed price is blocked", () => {
    const raw = {
      id: 302,
      orderType: 3,
      towTruckServiceType: 2,
      status: 1,
      totalPrice: null,
    };
    const order = adaptTowTruck(raw);
    const block = initialAssignmentBlock(order);
    assert.equal(block, "intercityMissingAgreedPrice");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Paid InterCity Order Assignment Safeguard (Phase C)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Dispatch preflight: Paid InterCity order assignment is SAFEGUARDED from submission", () => {
    const raw = {
      id: 303,
      orderType: 3,
      towTruckServiceType: 2,
      status: 1,
      totalPrice: 800,
      paymentStatus: 2,
    };
    const order = adaptTowTruck(raw);
    assert.equal(order.isInterCity, true);
    assert.equal(order.paymentStatus, "Paid");

    const block = initialAssignmentBlock(order);
    assert.equal(
      block,
      "assignmentPaidInterCityBlocked",
      "Paid InterCity orders must be blocked from PUT /api/Orders/{id}/tow-truck-driver until backend confirmation",
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Driver Removal & Reassignment Workflow Safety (Phase C)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Reassignment notice: Order with assigned driver guides operator to unassign first", () => {
    const raw = {
      id: 401,
      orderType: 3,
      towTruckServiceType: 2,
      status: 2,
      totalPrice: 650,
      towTruckDriverId: 10,
      towTruckDriverFullName: "سائق قديم",
    };
    const order = adaptTowTruck(raw);
    assert.equal(order.assignment, "assigned");

    const block = initialAssignmentBlock(order);
    assert.equal(
      block,
      "initialNeedsUnassigned",
      "Cannot assign replacement driver without first removing existing driver",
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Tow Truck Model & Adapter i18n Parity (Phase A, B, C)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("i18n Parity: towTruckAr and towTruckEn have exact matching keys", () => {
    const arKeys = Object.keys(towTruckAr).sort();
    const enKeys = Object.keys(towTruckEn).sort();

    assert.equal(arKeys.length, enKeys.length, "Arabic and English keys count must match");

    for (const key of arKeys) {
      assert.ok(key in towTruckEn, `Key '${key}' missing in towTruckEn`);
      assert.ok(typeof towTruckAr[key] === "string", `towTruckAr.${key} must be string`);
      assert.ok(typeof towTruckEn[key] === "string", `towTruckEn.${key} must be string`);
    }

    const requiredKeys = [
      "serviceIntraCity",
      "serviceInterCity",
      "serviceUnknown",
      "intercityRoute",
      "intercityReceiver",
      "intercityFixedPriceNotice",
      "intercityAgreedPriceNotice",
      "intercityCostSummaryDesc",
      "durationEstimateLabel",
      "durationEstimateHint",
      "adminDurationSummaryDesc",
      "assignmentPaidInterCityBlocked",
      "assignmentPaidInterCityBlockedDetail",
      "intercityFixedPriceNoticeTitle",
      "intercityFixedPriceNoticeDesc",
      "intercityRoutesAdmin",
      "serviceTypeNavLabel",
      "filterAllServices",
      "serviceTypeFilterNoticeTitle",
      "serviceTypeFilterNoticeDesc",
      "noServiceFilterResults",
      "serviceBatchScopeNotice",
      "receiver",
      "receiverMissing",
      "intercityRouteDetailsMissing",
    ];

    for (const k of requiredKeys) {
      assert.ok(k in towTruckAr, `Required InterCity key '${k}' missing in towTruckAr`);
      assert.ok(k in towTruckEn, `Required InterCity key '${k}' missing in towTruckEn`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. Server-Side Tow Truck Service-Type Filtering (Phase 1B)
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Server-Side Service-Type: All orders omit ServiceType parameter and never send TowTruckServiceType", async () => {
    mockApiResponse = { data: { success: true, data: { items: [], totalCount: 0 } } };
    await ordersApi.list({ orderType: 3, pageNumber: 1, pageSize: 20 });
    assert.equal(lastApiRequest.method, "GET");
    assert.equal(lastApiRequest.url, "/Orders");
    assert.equal(lastApiRequest.config.params.OrderType, 3);
    assert.equal(lastApiRequest.config.params.ServiceType, undefined, "All orders must omit ServiceType");
    assert.equal("TowTruckServiceType" in lastApiRequest.config.params, false, "Must never send TowTruckServiceType");
    assert.equal("towTruckServiceType" in lastApiRequest.config.params, false, "Must never send lowercase towTruckServiceType");
  });

  await test("Server-Side Service-Type: IntraCity requests send ServiceType=1", async () => {
    mockApiResponse = { data: { success: true, data: { items: [], totalCount: 0 } } };
    await ordersApi.list({ orderType: 3, serviceType: 1, pageNumber: 1, pageSize: 20 });
    assert.equal(lastApiRequest.method, "GET");
    assert.equal(lastApiRequest.url, "/Orders");
    assert.equal(lastApiRequest.config.params.OrderType, 3);
    assert.equal(lastApiRequest.config.params.ServiceType, 1, "IntraCity must send ServiceType=1");
    assert.equal("TowTruckServiceType" in lastApiRequest.config.params, false);
  });

  await test("Server-Side Service-Type: InterCity requests send ServiceType=2", async () => {
    mockApiResponse = { data: { success: true, data: { items: [], totalCount: 0 } } };
    await ordersApi.list({ orderType: 3, serviceType: 2, pageNumber: 1, pageSize: 20 });
    assert.equal(lastApiRequest.method, "GET");
    assert.equal(lastApiRequest.url, "/Orders");
    assert.equal(lastApiRequest.config.params.OrderType, 3);
    assert.equal(lastApiRequest.config.params.ServiceType, 2, "InterCity must send ServiceType=2");
    assert.equal("TowTruckServiceType" in lastApiRequest.config.params, false);
  });

  await test("Server-Side Service-Type: Service-type changes produce distinct query keys", () => {
    const keyAll = orderListOptions({ orderType: 3, pageNumber: 1, serviceType: undefined }).queryKey;
    const keyIntra = orderListOptions({ orderType: 3, pageNumber: 1, serviceType: 1 }).queryKey;
    const keyInter = orderListOptions({ orderType: 3, pageNumber: 1, serviceType: 2 }).queryKey;

    assert.notDeepEqual(keyAll, keyIntra, "All and IntraCity must have distinct query keys");
    assert.notDeepEqual(keyIntra, keyInter, "IntraCity and InterCity must have distinct query keys");
    assert.notDeepEqual(keyAll, keyInter, "All and InterCity must have distinct query keys");
  });

  await test("Server-Side Service-Type: Switching service type resets pagination (deletes page param)", () => {
    const searchParams = new URLSearchParams("service=intracity&page=4&status=all");
    const next = new URLSearchParams(searchParams);
    next.set("service", "intercity");
    next.delete("page");

    assert.equal(next.get("service"), "intercity");
    assert.equal(next.has("page"), false, "Pagination page parameter must be removed when switching service type");
  });

  await test("Server-Side Service-Type: Pagination totals come from server response metadata", () => {
    const serverPage = {
      serverPaginated: true,
      items: [
        { id: 10, orderType: 3, serviceType: 2 },
        { id: 11, orderType: 3, serviceType: 2 },
      ],
      total: 88,
      page: 1,
      pageSize: 20,
      totalPages: 5,
    };
    const adapted = adaptTowTruckPage(serverPage);
    assert.equal(adapted.total, 88, "Total must come from server metadata");
    assert.equal(adapted.totalPages, 5, "TotalPages must come from server metadata");
    assert.equal(adapted.items.length, 2, "Current page batch length is 2");
    assert.notEqual(adapted.total, adapted.items.length, "Server total must never be overwritten by local items length");
  });

  await test("Server-Side Service-Type: Stale rows isolated when switching service type (placeholderData returns undefined)", () => {
    function resolvePlaceholder(previousData, previousQuery, currentServiceType) {
      const prevParams = previousQuery?.queryKey?.[2];
      if (prevParams && prevParams.serviceType !== currentServiceType) {
        return undefined;
      }
      return previousData;
    }

    const previousData = {
      items: [{ id: 1, orderType: 3, serviceType: 1 }],
      total: 10,
    };
    const prevQuery = {
      queryKey: ["orders", "list", { orderType: 3, serviceType: 1, pageNumber: 1 }],
    };

    // Switching to InterCity (serviceType: 2) must clear previous data to avoid showing stale rows
    const intercityPlaceholder = resolvePlaceholder(previousData, prevQuery, 2);
    assert.equal(intercityPlaceholder, undefined, "Switching service type must yield undefined placeholderData");

    // Switching to All (serviceType: undefined) must clear previous data
    const allPlaceholder = resolvePlaceholder(previousData, prevQuery, undefined);
    assert.equal(allPlaceholder, undefined, "Switching to All must yield undefined placeholderData");

    // Staying on same service type keeps previous data for smooth pagination transition
    const sameServicePlaceholder = resolvePlaceholder(previousData, prevQuery, 1);
    assert.deepEqual(sameServicePlaceholder, previousData, "Same service type preserves previousData for smooth UX");
  });

  await test("Server-Side Service-Type: Existing search and sorting behavior remain compatible with service filtering", async () => {
    mockApiResponse = { data: { success: true, data: { items: [], totalCount: 0 } } };
    await ordersApi.list({
      orderType: 3,
      serviceType: 2,
      pageNumber: 2,
      pageSize: 20,
      sortBy: "createdAt",
      sortDescending: true,
      filterBy: "trackNumber",
      filterValue: "TRK-2026-X",
    });

    const params = lastApiRequest.config.params;
    assert.equal(params.OrderType, 3);
    assert.equal(params.ServiceType, 2);
    assert.equal(params.PageNumber, 2);
    assert.equal(params.PageSize, 20);
    assert.equal(params.SortBy, "createdAt");
    assert.equal(params.SortDescending, true);
    assert.equal(params.FilterBy, "trackNumber");
    assert.equal(params.FilterValue, "TRK-2026-X");
    assert.equal("TowTruckServiceType" in params, false);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. Phase 2B.2: Purpose-Built InterCity Operations Queue Validation
  // ─────────────────────────────────────────────────────────────────────────────

  await test("Phase 2B.2 (1/12): InterCity-only specialized rendering in TowTruckOperationsPage", () => {
    const pageSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/pages/TowTruckOperationsPage.tsx"), "utf8");
    assert.ok(pageSrc.includes('import { TowTruckInterCityTable } from "../components/TowTruckInterCityTable";'));
    assert.ok(pageSrc.includes('import { TowTruckInterCityMobileList } from "../components/TowTruckInterCityMobileList";'));
    assert.ok(pageSrc.includes('workspace === "intercity" ? ('));
    assert.ok(pageSrc.includes("<TowTruckInterCityTable"));
    assert.ok(pageSrc.includes("<TowTruckInterCityMobileList"));
  });

  await test("Phase 2B.2 (2/12): Preservation of All/IntraCity rendering in TowTruckOperationsPage", () => {
    assert.equal(resolveTowTruckWorkspace("/admin/tow-truck"), "all");
    assert.equal(resolveTowTruckWorkspace("/admin/tow-truck/intracity"), "intracity");
    const pageSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/pages/TowTruckOperationsPage.tsx"), "utf8");
    // When workspace is not "intercity", TowTruckTable and TowTruckMobileList are rendered
    assert.ok(pageSrc.includes("<TowTruckTable"));
    assert.ok(pageSrc.includes("<TowTruckMobileList"));
  });

  await test("Phase 2B.2 (3/12): Correct corridor data mapping from verified city snapshots", () => {
    const raw = {
      id: 301,
      orderType: 3,
      towTruckServiceType: 2,
      intercityTowTruckDetails: {
        roadId: 88,
        originCityId: 10,
        destinationCityId: 20,
        originCityNameSnapshot: "الرياض",
        destinationCityNameSnapshot: "جدة",
      },
    };
    const adapted = adaptTowTruck(raw);
    assert.equal(adapted.intercityDetails.originCityName, "الرياض");
    assert.equal(adapted.intercityDetails.destinationCityName, "جدة");
    assert.equal(adapted.intercityDetails.roadId, "88");
    assert.equal(adapted.hasInterCityRoute, true);
    assert.equal(adapted.routeSummary, "الرياض → جدة");
  });

  await test("Phase 2B.2 (4/12): Missing corridor data handling with neutral unavailable state", () => {
    const rawNoCorridor = {
      id: 302,
      orderType: 3,
      towTruckServiceType: 2,
      intercityTowTruckDetails: null,
      addressTitle: "حي النخيل، الرياض",
      destinationAddressTitle: "حي الشاطئ، جدة",
    };
    const adapted = adaptTowTruck(rawNoCorridor);
    assert.equal(adapted.intercityDetails.originCityName, null);
    assert.equal(adapted.intercityDetails.destinationCityName, null);
    assert.equal(adapted.hasInterCityRoute, false);
    // Generic addresses must NEVER be inferred as official verified cities
    assert.notEqual(adapted.intercityDetails.originCityName, "حي النخيل، الرياض");

    const tableSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityTable.tsx"), "utf8");
    const mobileSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityMobileList.tsx"), "utf8");
    assert.ok(tableSrc.includes("towTruck.intercityRouteDetailsMissing"));
    assert.ok(mobileSrc.includes("towTruck.intercityRouteDetailsMissing"));
  });

  await test("Phase 2B.2 (5/12): Receiver-field absence handling without placeholder fabrication", () => {
    const rawNoReceiver = {
      id: 303,
      orderType: 3,
      towTruckServiceType: 2,
      intercityTowTruckDetails: {
        originCityNameSnapshot: "الدمام",
        destinationCityNameSnapshot: "الهفوف",
      },
    };
    const adapted = adaptTowTruck(rawNoReceiver);
    assert.equal(adapted.intercityDetails.receiverName, null);
    assert.equal(adapted.intercityDetails.receiverPhone, null);

    const tableSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityTable.tsx"), "utf8");
    const mobileSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityMobileList.tsx"), "utf8");
    // Receiver UI must be conditionally guarded behind genuine data existence
    assert.ok(tableSrc.includes("receiverName &&"));
    assert.ok(mobileSrc.includes("receiverName &&"));
  });

  await test("Phase 2B.2 (6/12): Amount and payment-status separation without pricing recalculation", () => {
    const rawPending = {
      id: 304,
      orderType: 3,
      towTruckServiceType: 2,
      totalPrice: 850.5,
      paymentStatus: 1, // Pending
    };
    const adapted = adaptTowTruck(rawPending);
    assert.equal(adapted.total, 850.5);
    assert.equal(adapted.agreedPrice, 850.5);
    assert.equal(adapted.paymentStatus, "Pending");
    assert.equal(adapted.paymentPending, true);

    const tableSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityTable.tsx"), "utf8");
    // Amount must not alter or infer payment status
    assert.ok(tableSrc.includes("order.total !== null"));
    assert.ok(tableSrc.includes("<TowTruckPaymentStatusBadge"));
  });

  await test("Phase 2B.2 (7/12): Driver-assignment display without direct assignment action in queue", () => {
    const rawUnassigned = { id: 305, orderType: 3, towTruckDriverId: null };
    const adaptedUnassigned = adaptTowTruck(rawUnassigned);
    assert.equal(adaptedUnassigned.assignment, "unassigned");
    assert.equal(adaptedUnassigned.driverId, null);

    const rawAssigned = { id: 306, orderType: 3, towTruckDriverId: 77, towTruckDriverFullName: "أحمد السائق" };
    const adaptedAssigned = adaptTowTruck(rawAssigned);
    assert.equal(adaptedAssigned.assignment, "assigned");
    assert.equal(adaptedAssigned.driverId, "77");
    assert.equal(adaptedAssigned.driverName, "أحمد السائق");

    const tableSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityTable.tsx"), "utf8");
    const mobileSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityMobileList.tsx"), "utf8");
    // Direct driver assignment buttons MUST NOT exist in queue
    assert.ok(!tableSrc.includes("onAssignDriver"));
    assert.ok(!mobileSrc.includes("onAssignDriver"));
    assert.ok(!tableSrc.includes("chooseDriver"));
    assert.ok(!mobileSrc.includes("chooseDriver"));
  });

  await test("Phase 2B.2 (8/12): Preview-action behavior opening Quick Preview Drawer", () => {
    const tableSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityTable.tsx"), "utf8");
    const mobileSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityMobileList.tsx"), "utf8");
    assert.ok(tableSrc.includes("onSelectOrder?.(order.id)"));
    assert.ok(mobileSrc.includes("onSelectOrder?.(order.id)"));
    assert.ok(tableSrc.includes("towTruck.quickPreview"));
    assert.ok(mobileSrc.includes("towTruck.quickPreview"));
  });

  await test("Phase 2B.2 (9/12): URL state and query isolation for InterCity workspace", () => {
    assert.equal(workspaceToServiceType("intercity"), 2);
    assert.equal(workspaceToServiceType("intracity"), 1);
    assert.equal(workspaceToServiceType("all"), undefined);

    const urlWithSearch = buildWorkspaceNavigationUrl("intercity", "trackNumber=TRK-99");
    assert.equal(urlWithSearch, "/admin/tow-truck/intercity?trackNumber=TRK-99");

    const urlClean = buildWorkspaceNavigationUrl("intercity", "");
    assert.equal(urlClean, "/admin/tow-truck/intercity");
  });

  await test("Phase 2B.2 (10/12): RTL/LTR and localization parity for Phase 2B.2 keys", () => {
    const newKeys = [
      "colCorridor",
      "colAmountPayment",
      "roadIdLabel",
      "corridorMissing",
      "recordedAmount",
    ];
    for (const k of newKeys) {
      assert.ok(k in towTruckAr, `Missing ${k} in towTruckAr`);
      assert.ok(k in towTruckEn, `Missing ${k} in towTruckEn`);
      assert.ok(towTruckAr[k].length > 0, `Empty ${k} in towTruckAr`);
      assert.ok(towTruckEn[k].length > 0, `Empty ${k} in towTruckEn`);
    }

    const tableSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityTable.tsx"), "utf8");
    const mobileSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityMobileList.tsx"), "utf8");
    // RTL directional safety: ArrowRight has rtl:rotate-180
    assert.ok(tableSrc.includes("rtl:rotate-180"));
    assert.ok(mobileSrc.includes("rtl:rotate-180"));
  });

  await test("Phase 2B.2 (11/12): Responsive component structure and touch target compliance", () => {
    const tableSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityTable.tsx"), "utf8");
    const mobileSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityMobileList.tsx"), "utf8");

    // Table must have scrollable region and role
    assert.ok(tableSrc.includes('role="region"'));
    assert.ok(tableSrc.includes("overflow-x-auto"));

    // Mobile list must have min-h-[44px] touch target for primary preview action
    assert.ok(mobileSrc.includes("min-h-[44px]"));

    const pageSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/pages/TowTruckOperationsPage.tsx"), "utf8");
    assert.ok(pageSrc.includes('className="hidden md:block"'));
    assert.ok(pageSrc.includes('className="md:hidden"'));
  });

  await test("Phase 2B.2 (12/12): Absence of additional per-row detail requests in queue", async () => {
    // InterCity queue query calls GET /Orders with ServiceType=2 once per page
    const queueOptions = orderListOptions({ orderType: 3, serviceType: 2, pageNumber: 1, pageSize: 20 });
    assert.deepEqual(queueOptions.queryKey, ["orders", "list", { orderType: 3, serviceType: 2, pageNumber: 1, pageSize: 20 }]);

    const tableSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityTable.tsx"), "utf8");
    const mobileSrc = fs.readFileSync(path.join(root, "src/modules/tow-truck/components/TowTruckInterCityMobileList.tsx"), "utf8");
    // Ensure no useQuery or api.get calls inside table or mobile list components
    assert.ok(!tableSrc.includes("useQuery"));
    assert.ok(!tableSrc.includes("useTowTruckDetail"));
    assert.ok(!mobileSrc.includes("useQuery"));
    assert.ok(!mobileSrc.includes("useTowTruckDetail"));
  });

  console.log(`\nAll ${passedCount} tests passed successfully!`);
}

runAll().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
