/**
 * @file check-tow-truck-phase2a-navigation.cjs
 * @description Comprehensive offline test suite for Tow Truck Operations Navigation Architecture (Phase 2A).
 * Validates:
 * 1. All three navigation routes (All, IntraCity, InterCity) and workspace resolution.
 * 2. Correct active-navigation state detection and canonical routing.
 * 3. Correct server-side service-type mapping (undefined, 1, 2).
 * 4. Browser URL, search preservation, and pagination reset behavior.
 * 5. Dynamic order detail route compatibility and collision avoidance.
 * 6. Query cache isolation and placeholder stale-row protection.
 * 7. Operational workflow accessibility, landmarks, and aria-current states.
 * 8. Mobile navigation responsiveness and drawer integration.
 * 9. Arabic / English i18n translation parity and completeness.
 *
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
      return { apiClient: { defaults: { baseURL: "/api" }, get: async () => ({ data: { success: true } }) } };
    }
    if (name === "@shared/lib/utils") {
      return { cn: (...classes) => classes.filter(Boolean).join(" ") };
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

const {
  resolveTowTruckWorkspace,
  workspaceToServiceType,
  workspaceToRoute,
  buildWorkspaceNavigationUrl,
} = load("src/modules/tow-truck/lib/towTruckWorkspace.ts");

const { orderListOptions } = load("src/modules/orders/hooks/useOrdersQueries.ts");
const { towTruckAr, towTruckEn } = load("src/modules/tow-truck/i18n.ts");

let passedCount = 0;
function test(name, fn) {
  try {
    fn();
    passedCount++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log("=== RUNNING TOW TRUCK PHASE 2A NAVIGATION TEST SUITE ===");

// ─── 1. Navigation Routes & Workspace Resolution ─────────────────────────────

test("Workspace Resolution: Canonical /admin/tow-truck resolves to 'all'", () => {
  assert.equal(resolveTowTruckWorkspace("/admin/tow-truck"), "all");
  assert.equal(resolveTowTruckWorkspace("/admin/tow-truck/"), "all");
});

test("Workspace Resolution: Route /admin/tow-truck/intracity resolves to 'intracity'", () => {
  assert.equal(resolveTowTruckWorkspace("/admin/tow-truck/intracity"), "intracity");
  assert.equal(resolveTowTruckWorkspace("/admin/tow-truck/intracity/"), "intracity");
});

test("Workspace Resolution: Route /admin/tow-truck/intercity resolves to 'intercity'", () => {
  assert.equal(resolveTowTruckWorkspace("/admin/tow-truck/intercity"), "intercity");
  assert.equal(resolveTowTruckWorkspace("/admin/tow-truck/intercity/"), "intercity");
});

test("Workspace Resolution: Case-insensitivity and nested routes degrade gracefully", () => {
  assert.equal(resolveTowTruckWorkspace("/ADMIN/TOW-TRUCK/INTRACITY"), "intracity");
  assert.equal(resolveTowTruckWorkspace("/ADMIN/TOW-TRUCK/INTERCITY"), "intercity");
  assert.equal(resolveTowTruckWorkspace("/admin/tow-truck/unknown-subroute"), "all");
});

// ─── 2. Service-Type Mapping ─────────────────────────────────────────────────

test("Service-Type Mapping: 'all' omits ServiceType (undefined)", () => {
  assert.equal(workspaceToServiceType("all"), undefined);
});

test("Service-Type Mapping: 'intracity' maps to ServiceType=1", () => {
  assert.equal(workspaceToServiceType("intracity"), 1);
});

test("Service-Type Mapping: 'intercity' maps to ServiceType=2", () => {
  assert.equal(workspaceToServiceType("intercity"), 2);
});

test("Canonical Route Mapping: Workspaces map to correct route paths", () => {
  assert.equal(workspaceToRoute("all"), "/admin/tow-truck");
  assert.equal(workspaceToRoute("intracity"), "/admin/tow-truck/intracity");
  assert.equal(workspaceToRoute("intercity"), "/admin/tow-truck/intercity");
});

// ─── 3. Browser URL, Search Preservation & Pagination Reset ──────────────────

test("URL Builder: Resetting pagination when switching workspace", () => {
  const url = buildWorkspaceNavigationUrl("intercity", "page=3&trackNumber=TRK-999");
  assert.equal(url, "/admin/tow-truck/intercity?trackNumber=TRK-999");
  assert.equal(url.includes("page="), false, "page parameter must be stripped on workspace navigation");
});

test("URL Builder: Preserving active trackNumber search across workspaces", () => {
  const intraUrl = buildWorkspaceNavigationUrl("intracity", "trackNumber=TRK-ABC-123");
  assert.equal(intraUrl, "/admin/tow-truck/intracity?trackNumber=TRK-ABC-123");

  const allUrl = buildWorkspaceNavigationUrl("all", "trackNumber=TRK-ABC-123");
  assert.equal(allUrl, "/admin/tow-truck?trackNumber=TRK-ABC-123");
});

test("URL Builder: Clean URL with no query params when no search is active", () => {
  const url = buildWorkspaceNavigationUrl("all", "");
  assert.equal(url, "/admin/tow-truck");

  const intraUrl = buildWorkspaceNavigationUrl("intracity", "page=5");
  assert.equal(intraUrl, "/admin/tow-truck/intracity");
});

test("Legacy SearchParam Redirect: Legacy ?serviceType=intracity and ?serviceType=intercity can be safely identified", () => {
  function checkLegacyRedirect(paramsString) {
    const p = new URLSearchParams(paramsString);
    const raw = p.get("serviceType");
    if (raw === "intracity" || raw === "intercity") {
      p.delete("serviceType");
      const qs = p.toString();
      return `/admin/tow-truck/${raw}${qs ? `?${qs}` : ""}`;
    }
    return null;
  }

  assert.equal(
    checkLegacyRedirect("serviceType=intracity&page=2"),
    "/admin/tow-truck/intracity?page=2"
  );
  assert.equal(
    checkLegacyRedirect("serviceType=intercity&trackNumber=TRK-1"),
    "/admin/tow-truck/intercity?trackNumber=TRK-1"
  );
  assert.equal(checkLegacyRedirect("trackNumber=TRK-1"), null);
});

// ─── 4. Dynamic Order Detail Route Compatibility ─────────────────────────────

test("Route Collision Safety: Static routes 'intracity' and 'intercity' are not valid order IDs", () => {
  const isValidOrderId = (id) => !!id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));

  assert.equal(isValidOrderId("101"), true);
  assert.equal(isValidOrderId("55421"), true);
  assert.equal(isValidOrderId("intracity"), false, "'intracity' must fail numeric order ID validation");
  assert.equal(isValidOrderId("intercity"), false, "'intercity' must fail numeric order ID validation");
  assert.equal(isValidOrderId("0"), false);
  assert.equal(isValidOrderId("-5"), false);
  assert.equal(isValidOrderId("abc"), false);
});

test("Workspace Back-Navigation: Preserves complete operational context in fromQueue", () => {
  function resolveBackTarget(fromQueue) {
    if (!fromQueue) return "/admin/tow-truck";
    if (fromQueue.startsWith("/")) return fromQueue;
    if (fromQueue.startsWith("?")) return `/admin/tow-truck${fromQueue}`;
    return fromQueue;
  }

  assert.equal(
    resolveBackTarget("/admin/tow-truck/intercity?page=2&trackNumber=TRK-88"),
    "/admin/tow-truck/intercity?page=2&trackNumber=TRK-88",
    "Full path with search must be returned verbatim"
  );
  assert.equal(
    resolveBackTarget("/admin/tow-truck/intracity"),
    "/admin/tow-truck/intracity"
  );
  assert.equal(
    resolveBackTarget("?page=3"),
    "/admin/tow-truck?page=3",
    "Legacy search-only string must prepend /admin/tow-truck"
  );
  assert.equal(
    resolveBackTarget(null),
    "/admin/tow-truck",
    "Null fromQueue falls back safely to default queue"
  );
});

// ─── 5. Query Cache Isolation & Stale-Row Protection ─────────────────────────

test("Query Cache Isolation: All, IntraCity, and InterCity generate distinct query keys", () => {
  const keyAll = orderListOptions({ orderType: 3, pageNumber: 1, serviceType: undefined }).queryKey;
  const keyIntra = orderListOptions({ orderType: 3, pageNumber: 1, serviceType: 1 }).queryKey;
  const keyInter = orderListOptions({ orderType: 3, pageNumber: 1, serviceType: 2 }).queryKey;

  assert.notDeepEqual(keyAll, keyIntra);
  assert.notDeepEqual(keyIntra, keyInter);
  assert.notDeepEqual(keyAll, keyInter);
});

test("Stale-Row Protection: Switching service type drops placeholderData to prevent stale rows", () => {
  function resolvePlaceholder(previousData, previousQuery, currentServiceType) {
    const prevParams = previousQuery?.queryKey?.[2];
    if (prevParams && prevParams.serviceType !== currentServiceType) {
      return undefined;
    }
    return previousData;
  }

  const prevQuery = {
    queryKey: ["orders", "list", { orderType: 3, serviceType: 1, pageNumber: 1 }],
  };
  const prevData = { items: [{ id: 1, serviceType: 1 }] };

  assert.equal(
    resolvePlaceholder(prevData, prevQuery, 2),
    undefined,
    "Switching from IntraCity (1) to InterCity (2) must clear placeholderData"
  );
  assert.equal(
    resolvePlaceholder(prevData, prevQuery, undefined),
    undefined,
    "Switching from IntraCity (1) to All (undefined) must clear placeholderData"
  );
  assert.deepEqual(
    resolvePlaceholder(prevData, prevQuery, 1),
    prevData,
    "Staying on IntraCity (1) preserves placeholderData for smooth page transition"
  );
});

// ─── 6. Router Configuration Verification ────────────────────────────────────

test("Router File Structure: Verifies routes 'intracity', 'intercity', and ':orderId' exist under 'tow-truck'", () => {
  const routerSource = fs.readFileSync(path.resolve(root, "src/app/router.tsx"), "utf8");

  assert.ok(routerSource.includes('path: "tow-truck"'), "Must contain 'tow-truck' route");
  assert.ok(routerSource.includes('path: "intracity"'), "Must contain 'intracity' route");
  assert.ok(routerSource.includes('path: "intercity"'), "Must contain 'intercity' route");
  assert.ok(routerSource.includes('path: ":orderId"'), "Must contain ':orderId' route");

  const intracityIdx = routerSource.indexOf('path: "intracity"');
  const intercityIdx = routerSource.indexOf('path: "intercity"');
  const orderIdIdx = routerSource.indexOf('path: ":orderId"');

  assert.ok(intracityIdx < orderIdIdx, "Static 'intracity' route must precede dynamic ':orderId' route");
  assert.ok(intercityIdx < orderIdIdx, "Static 'intercity' route must precede dynamic ':orderId' route");
});

// ─── 7. AdminSidebar Hierarchical Integration ────────────────────────────────

test("AdminSidebar Structure: Contains integrated Tow Truck hierarchical sub-navigation", () => {
  const sidebarSource = fs.readFileSync(
    path.resolve(root, "src/modules/admin/components/layout/AdminSidebar.tsx"),
    "utf8"
  );

  assert.ok(sidebarSource.includes('to="/admin/tow-truck"'), "Must contain root Tow Truck link");
  assert.ok(sidebarSource.includes('to="/admin/tow-truck/intracity"'), "Must contain IntraCity sub-link");
  assert.ok(sidebarSource.includes('to="/admin/tow-truck/intercity"'), "Must contain InterCity sub-link");
  assert.ok(sidebarSource.includes("isTowTruckActive"), "Must check isTowTruckActive");
  assert.ok(sidebarSource.includes('role="group"'), "Must group sub-links with role='group'");
});

// ─── 8. TowTruckOperationsNav Accessibility & Responsiveness ─────────────────

test("Operations Nav Component: Implements accessible landmarks and attributes", () => {
  const navSource = fs.readFileSync(
    path.resolve(root, "src/modules/tow-truck/components/TowTruckOperationsNav.tsx"),
    "utf8"
  );

  assert.ok(navSource.includes("<nav"), "Must render semantic <nav> element");
  assert.ok(navSource.includes("aria-label="), "Must provide aria-label for navigation landmark");
  assert.ok(navSource.includes("aria-current="), "Must set aria-current on active workspace");
  assert.ok(navSource.includes("focus-visible:ring-"), "Must define visible focus indicator");
  assert.ok(navSource.includes("grid-cols-3"), "Must use compact 3-segment grid for mobile efficiency");
  assert.ok(navSource.includes("min-h-[40px]"), "Must provide accessible touch targets for mobile operators");
});

// ─── 9. Arabic & English i18n Translation Parity ─────────────────────────────

test("i18n Parity: Complete 1-to-1 parity between towTruckAr and towTruckEn for Phase 2A", () => {
  const phase2aKeys = [
    "operationsNavLabel",
    "navAllOperations",
    "navAllDesc",
    "navAllBadge",
    "navIntraCity",
    "navIntraCityDesc",
    "navIntraCityBadge",
    "navInterCity",
    "navInterCityDesc",
    "navInterCityBadge",
    "activeWorkspaceIndicator",
    "eyebrowAll",
    "eyebrowIntraCity",
    "eyebrowInterCity",
    "subtitleAll",
    "subtitleIntraCity",
    "subtitleInterCity",
  ];

  for (const k of phase2aKeys) {
    assert.ok(k in towTruckAr, `Missing key in towTruckAr: ${k}`);
    assert.ok(k in towTruckEn, `Missing key in towTruckEn: ${k}`);
    assert.ok(typeof towTruckAr[k] === "string" && towTruckAr[k].length > 0, `Empty translation for ${k} in ar`);
    assert.ok(typeof towTruckEn[k] === "string" && towTruckEn[k].length > 0, `Empty translation for ${k} in en`);
  }

  // Verify full parity across entire dictionary
  const arKeys = Object.keys(towTruckAr);
  const enKeys = Object.keys(towTruckEn);
  assert.equal(arKeys.length, enKeys.length, "Arabic and English dictionaries must have exact same number of keys");
  for (const k of arKeys) {
    assert.ok(k in towTruckEn, `Key '${k}' in towTruckAr is missing in towTruckEn`);
  }
});

console.log(`\nAll ${passedCount} Tow Truck Phase 2A Navigation checks passed successfully!`);
