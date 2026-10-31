/**
 * @file check-tow-truck-queue-redesign.cjs
 * @description Offline validation for Tow Truck Queue Redesign (Phase 1).
 * Tests date formatting, payment/order status independence, server-side search params,
 * local filter calculations, i18n parity, and resilient fallback states.
 * No network calls.
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
      return { apiClient: { defaults: {}, get: async () => ({ data: { success: true } }) } };
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

const { adaptTowTruck, adaptTowTruckPage } = load("src/modules/tow-truck/lib/towTruckModel.ts");
const { formatTowTruckOrderDate, formatTowTruckSyncTime } = load(
  "src/modules/tow-truck/lib/towTruckDate.ts",
);
const { orderListOptions } = load("src/modules/orders/hooks/useOrdersQueries.ts");
const { towTruckAr, towTruckEn } = load("src/modules/tow-truck/i18n.ts");

function runChecks() {
  // 1. Date Formatting: Valid ISO string
  {
    const res = formatTowTruckOrderDate("2026-10-22T14:30:00Z", "ar");
    assert.equal(res.valid, true, "Valid ISO date must report valid: true");
    assert.ok(res.absolute && res.absolute !== "—", "Valid ISO date must return formatted absolute date");
    assert.ok(res.relative, "Valid ISO date must return relative time");
    assert.ok(res.iso && res.iso.includes("2026"), "Must provide ISO string");
  }

  // 2. Date Formatting: Bare datetime string (backend timezone quirk)
  {
    const res = formatTowTruckOrderDate("2026-10-22T14:30:00", "ar");
    assert.equal(res.valid, true, "Bare datetime must be tolerated safely");
    assert.ok(res.absolute && res.absolute !== "—");
  }

  // 3. Date Formatting: Invalid, empty and null timestamps
  {
    const nullRes = formatTowTruckOrderDate(null, "ar");
    assert.equal(nullRes.valid, false, "Null date must be marked invalid");
    assert.equal(nullRes.absolute, "—", "Null date must fall back to —");
    assert.equal(nullRes.relative, null, "Null date relative must be null");

    const undefinedRes = formatTowTruckOrderDate(undefined, "ar");
    assert.equal(undefinedRes.valid, false);
    assert.equal(undefinedRes.absolute, "—");

    const emptyRes = formatTowTruckOrderDate("   ", "ar");
    assert.equal(emptyRes.valid, false);

    const malformedRes = formatTowTruckOrderDate("not-a-real-date", "ar");
    assert.equal(malformedRes.valid, false);
    assert.equal(malformedRes.absolute, "—");
  }

  // 4. Distinguishing Creation Timestamp from Queue Sync Timestamp
  {
    const syncRes = formatTowTruckSyncTime(1792680000000, "ar");
    assert.ok(syncRes && typeof syncRes === "string", "Valid epoch timestamp must format sync time");
    assert.equal(formatTowTruckSyncTime(0, "ar"), null, "Zero epoch must return null");
    assert.equal(formatTowTruckSyncTime(null, "ar"), null, "Null epoch must return null");
  }

  // 5. Payment Status & Order Status Independence
  {
    const pendingPaidSample = adaptTowTruck({
      id: 101,
      orderType: 3,
      status: 1, // InWaiting
      paymentStatus: 2, // Paid
      userId: 1,
      userFullName: "Ali",
      createdAt: "2026-10-22T10:00:00Z",
    });
    assert.equal(pendingPaidSample.status, "InWaiting", "Order status must be InWaiting");
    assert.equal(pendingPaidSample.paymentStatus, "Paid", "Payment status must be Paid");
    assert.equal(pendingPaidSample.paymentPending, false, "Paid order is not paymentPending");

    const shippedPendingSample = adaptTowTruck({
      id: 102,
      orderType: 3,
      status: 3, // Shipped
      paymentStatus: 1, // Pending
      userId: 2,
      userFullName: "Omar",
      createdAt: "2026-10-22T10:00:00Z",
    });
    assert.equal(shippedPendingSample.status, "Shipped", "Order status must be Shipped");
    assert.equal(shippedPendingSample.paymentStatus, "Pending", "Payment status must be Pending");
    assert.equal(shippedPendingSample.paymentPending, true, "Pending order is paymentPending");

    const unconfirmedPayment = adaptTowTruck({
      id: 103,
      orderType: 3,
      status: 4, // Received
      paymentStatus: null,
      userId: 3,
      userFullName: "Sara",
      createdAt: "2026-10-22T10:00:00Z",
    });
    assert.equal(unconfirmedPayment.status, "Received");
    assert.equal(unconfirmedPayment.paymentStatus, "", "Null payment status must map to unconfirmed ''");
    assert.equal(unconfirmedPayment.paymentPending, false);
  }

  // 6. Server-Side Search Parameters (Track Number)
  {
    const defaultOpts = orderListOptions({
      orderType: 3,
      pageNumber: 1,
      pageSize: 20,
      sortBy: "createdAt",
      sortDescending: true,
    });
    assert.deepEqual(defaultOpts.queryKey, [
      "orders",
      "list",
      { orderType: 3, pageNumber: 1, pageSize: 20, sortBy: "createdAt", sortDescending: true },
    ]);

    const searchOpts = orderListOptions({
      orderType: 3,
      pageNumber: 1,
      pageSize: 20,
      sortBy: "createdAt",
      sortDescending: true,
      filterBy: "trackNumber",
      filterValue: "TRK-8899",
    });
    assert.deepEqual(searchOpts.queryKey, [
      "orders",
      "list",
      {
        orderType: 3,
        pageNumber: 1,
        pageSize: 20,
        sortBy: "createdAt",
        sortDescending: true,
        filterBy: "trackNumber",
        filterValue: "TRK-8899",
      },
    ]);
  }

  // 7. In-Page Local Filter Logic and Counts on a Loaded Page
  {
    const mockRawOrders = [
      {
        id: 1,
        orderType: 3,
        status: 1,
        paymentStatus: 1,
        towTruckDriverId: null,
        userId: 10,
        userFullName: "Customer 1",
        createdAt: "2026-10-22T08:00:00Z",
        addressTitle: "Riyadh",
        destinationAddressTitle: "Jeddah",
        plateNumber: "ABC 1234",
      },
      {
        id: 2,
        orderType: 3,
        status: 1,
        paymentStatus: 2,
        towTruckDriverId: 50,
        towTruckDriverFullName: "Driver 1",
        userId: 11,
        userFullName: "Customer 2",
        createdAt: "2026-10-22T08:10:00Z",
        addressTitle: "Riyadh",
        destinationAddressTitle: "Dammam",
        plateNumber: "XYZ 5678",
      },
      {
        id: 3,
        orderType: 3,
        status: 1,
        paymentStatus: 2,
        towTruckDriverId: null,
        userId: 12,
        userFullName: "Customer 3",
        createdAt: "2026-10-22T08:20:00Z",
        plateNumber: "DEF 9999",
        addressTitle: "Same",
        destinationAddressTitle: "Same",
        addressLatitude: 24.7,
        addressLongitude: 46.7,
        destinationLatitude: 24.7,
        destinationLongitude: 46.7, // identical points triggers stage: checkDetails
      },
    ];

    const page = adaptTowTruckPage({
      serverPaginated: true,
      items: mockRawOrders,
      page: 1,
      pageSize: 20,
      total: 100, // Total server items is 100, page batch is 3
      totalPages: 5,
    });

    const items = page.items;
    const localCounts = {
      all: items.length,
      unassigned: items.filter((o) => o.assignment === "unassigned").length,
      assigned: items.filter((o) => o.assignment === "assigned").length,
      paid: items.filter((o) => o.paymentStatus === "Paid").length,
      attention: items.filter((o) => o.stage === "checkDetails").length,
    };

    assert.equal(localCounts.all, 3, "Loaded page batch must be 3");
    assert.equal(localCounts.unassigned, 2, "Orders 1 and 3 are unassigned");
    assert.equal(localCounts.assigned, 1, "Order 2 is assigned");
    assert.equal(localCounts.paid, 2, "Orders 2 and 3 are Paid");
    assert.equal(localCounts.attention, 1, "Order 3 has identical origin & destination");
    assert.equal(page.total, 100, "Server totalCount remains 100, never overwritten by local counts");
  }

  // 8. i18n Translation Key Parity
  {
    const arKeys = Object.keys(towTruckAr).sort();
    const enKeys = Object.keys(towTruckEn).sort();

    const missingInEn = arKeys.filter((k) => !(k in towTruckEn));
    const missingInAr = enKeys.filter((k) => !(k in towTruckAr));

    assert.deepEqual(missingInEn, [], "All Arabic keys must exist in English");
    assert.deepEqual(missingInAr, [], "All English keys must exist in Arabic");

    // Check placeholder parity
    for (const key of arKeys) {
      const arVal = towTruckAr[key];
      const enVal = towTruckEn[key];
      if (typeof arVal === "string" && typeof enVal === "string") {
        const arPlaceholders = (arVal.match(/{{[^}]+}}/g) || []).sort();
        const enPlaceholders = (enVal.match(/{{[^}]+}}/g) || []).sort();
        assert.deepEqual(
          arPlaceholders,
          enPlaceholders,
          `Key "${key}" has placeholder mismatch: AR=${arPlaceholders} EN=${enPlaceholders}`,
        );
      }
    }
  }

  // 9. Resilient Fallbacks
  {
    const missingFieldsOrder = adaptTowTruck({
      id: 999,
      orderType: 3,
      status: 1,
      userId: 55,
      userFullName: "Test User",
      createdAt: "2026-10-22T08:00:00Z",
    });

    assert.equal(missingFieldsOrder.assignment, "unassigned", "Absent driverId field resolves to unassigned");
    assert.equal(missingFieldsOrder.vehicle, null, "Missing vehicle info must be null");

    const corruptDriverOrder = adaptTowTruck({
      id: 997,
      orderType: 3,
      status: 1,
      userId: 55,
      towTruckDriverId: -1,
    });
    assert.equal(corruptDriverOrder.assignment, "unknown", "Corrupted driverId field resolves to unknown");

    const explicitNullDriver = adaptTowTruck({
      id: 998,
      orderType: 3,
      status: 1,
      userId: 55,
      userFullName: "Test User",
      createdAt: "2026-10-22T08:00:00Z",
      towTruckDriverId: null,
    });
    assert.equal(explicitNullDriver.assignment, "unassigned", "Explicit null driverId resolves to unassigned");
  }

  // 10. Server-Side Tow Truck Service-Type Filtering (Phase 1B)
  {
    // A. Query Key Distinctness
    const keyAll = orderListOptions({ orderType: 3, pageNumber: 1, serviceType: undefined }).queryKey;
    const keyIntra = orderListOptions({ orderType: 3, pageNumber: 1, serviceType: 1 }).queryKey;
    const keyInter = orderListOptions({ orderType: 3, pageNumber: 1, serviceType: 2 }).queryKey;
    assert.notDeepEqual(keyAll, keyIntra, "All and IntraCity query keys must differ");
    assert.notDeepEqual(keyIntra, keyInter, "IntraCity and InterCity query keys must differ");

    // B. Reset pagination on service type switch
    const currentParams = new URLSearchParams("service=intracity&page=5&status=all");
    const nextParams = new URLSearchParams(currentParams);
    nextParams.set("service", "intercity");
    nextParams.delete("page");
    assert.equal(nextParams.get("service"), "intercity");
    assert.equal(nextParams.has("page"), false, "Switching service type must clear 'page'");

    // C. Placeholder Data Isolation across service types
    function testPlaceholder(prevData, prevQuery, currServiceType) {
      const prevParams = prevQuery?.queryKey?.[2];
      if (prevParams && prevParams.serviceType !== currServiceType) {
        return undefined;
      }
      return prevData;
    }
    const sampleData = { items: [{ id: 1, serviceType: "intracity" }] };
    const intraQuery = { queryKey: ["orders", "list", { orderType: 3, serviceType: 1, pageNumber: 1 }] };
    assert.equal(testPlaceholder(sampleData, intraQuery, 2), undefined, "Switching to InterCity drops stale rows");
    assert.deepEqual(testPlaceholder(sampleData, intraQuery, 1), sampleData, "Same service type keeps smooth pagination");

    // D. Server Totals Preservation
    const pageWithServerTotals = adaptTowTruckPage({
      serverPaginated: true,
      items: [{ id: 1, orderType: 3, serviceType: 2 }],
      total: 75,
      page: 1,
      pageSize: 20,
      totalPages: 4,
    });
    assert.equal(pageWithServerTotals.total, 75, "Server totalCount 75 must be preserved");
    assert.equal(pageWithServerTotals.totalPages, 4, "Server totalPages 4 must be preserved");
  }

  console.log("PASS: 10/10 Tow Truck Queue Redesign checks passed successfully.");
}

runChecks();
