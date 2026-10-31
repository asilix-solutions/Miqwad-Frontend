/**
 * @file check-tow-truck-phase2d3-intercity-workspace.cjs
 * @description Comprehensive offline test suite for MIQWAD Phase 2D.3:
 * Dedicated InterCity Full Order Workspace Implementation.
 * Verifies all 15 Phase 2D.3 requirements:
 * 1. Correct dedicated InterCity workspace rendering
 * 2. Current IntraCity workspace remains unchanged
 * 3. Unknown service type safely avoids incorrect assignment behavior
 * 4. Origin and destination display correctly when available
 * 5. Missing corridor data produces an appropriate neutral state
 * 6. Sender and receiver remain distinct
 * 7. Missing receiver data does not imply that the sender is the receiver
 * 8. Recorded order total is separate from the current reference Road tariff
 * 9. Paid InterCity assignment remains blocked
 * 10. Existing eligible unpaid assignment behavior is preserved
 * 11. Driver unassignment and cancellation guards remain intact
 * 12. No fabricated route geometry, ETA, distance, or live GPS
 * 13. No raw placeholder values are displayed
 * 14. Arabic/English localization and RTL/LTR behavior remain correct
 * 15. Return-to-queue context and unsaved-work protection remain intact
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

const {
  adaptTowTruck,
  location,
  normalizeText,
} = load("src/modules/tow-truck/lib/towTruckModel.ts");
const { initialAssignmentBlock } = load("src/modules/tow-truck/lib/dispatchModel.ts");
const { towTruckAr, towTruckEn } = load("src/modules/tow-truck/i18n.ts");

async function runTests() {
  console.log("=== RUNNING TOW TRUCK PHASE 2D.3 INTERCITY WORKSPACE TEST SUITE ===");

  let passed = 0;
  async function test(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL: ${name}`);
      console.error(err);
      process.exit(1);
    }
  }

  // 1. Correct dedicated InterCity workspace rendering
  await test("Req 1: Correct dedicated InterCity workspace rendering", () => {
    const pageSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/pages/TowTruckOrderWorkspacePage.tsx"),
      "utf8",
    );
    assert.ok(
      pageSrc.includes('import { TowTruckInterCityWorkspace } from "../components/TowTruckInterCityWorkspace";'),
      "TowTruckOrderWorkspacePage must import TowTruckInterCityWorkspace",
    );
    assert.ok(
      pageSrc.includes('detail.data.serviceType === "intercity"'),
      "TowTruckOrderWorkspacePage must check serviceType === 'intercity'",
    );
    assert.ok(
      pageSrc.includes("<TowTruckInterCityWorkspace"),
      "TowTruckOrderWorkspacePage must render TowTruckInterCityWorkspace for intercity orders",
    );

    const interCityWorkspaceSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityWorkspace.tsx"),
      "utf8",
    );
    assert.ok(
      interCityWorkspaceSrc.includes("<TowTruckInterCityHeader"),
      "TowTruckInterCityWorkspace must render TowTruckInterCityHeader",
    );
    assert.ok(
      interCityWorkspaceSrc.includes("<TowTruckInterCityCorridorSection"),
      "TowTruckInterCityWorkspace must render TowTruckInterCityCorridorSection",
    );
    assert.ok(
      interCityWorkspaceSrc.includes("<TowTruckInterCityPartiesSection"),
      "TowTruckInterCityWorkspace must render TowTruckInterCityPartiesSection",
    );
    assert.ok(
      interCityWorkspaceSrc.includes("<TowTruckInterCityVehicleSection"),
      "TowTruckInterCityWorkspace must render TowTruckInterCityVehicleSection",
    );
    assert.ok(
      interCityWorkspaceSrc.includes("<TowTruckInterCityFinanceSection"),
      "TowTruckInterCityWorkspace must render TowTruckInterCityFinanceSection",
    );
    assert.ok(
      interCityWorkspaceSrc.includes("<TowTruckInterCityDispatchSection"),
      "TowTruckInterCityWorkspace must render TowTruckInterCityDispatchSection",
    );
  });

  // 2. Current IntraCity workspace remains unchanged
  await test("Req 2: Current IntraCity workspace remains unchanged", () => {
    const pageSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/pages/TowTruckOrderWorkspacePage.tsx"),
      "utf8",
    );
    assert.ok(
      pageSrc.includes('import { TowTruckIntraCityWorkspace } from "../components/TowTruckIntraCityWorkspace";'),
      "TowTruckOrderWorkspacePage must import TowTruckIntraCityWorkspace",
    );
    assert.ok(
      pageSrc.includes('detail.data.serviceType === "intracity"'),
      "TowTruckOrderWorkspacePage must check serviceType === 'intracity'",
    );
    assert.ok(
      pageSrc.includes("<TowTruckIntraCityWorkspace"),
      "TowTruckOrderWorkspacePage must render TowTruckIntraCityWorkspace for intracity orders",
    );

    const intraCityWorkspaceSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckIntraCityWorkspace.tsx"),
      "utf8",
    );
    assert.ok(
      intraCityWorkspaceSrc.includes("<TowTruckRouteSection"),
      "TowTruckIntraCityWorkspace must preserve TowTruckRouteSection",
    );
    assert.ok(
      intraCityWorkspaceSrc.includes("<TowTruckDriverDispatchSection"),
      "TowTruckIntraCityWorkspace must preserve TowTruckDriverDispatchSection",
    );
    assert.ok(
      intraCityWorkspaceSrc.includes("<TowTruckCustomerVehicleSection"),
      "TowTruckIntraCityWorkspace must preserve TowTruckCustomerVehicleSection",
    );
  });

  // 3. Unknown service type safely avoids incorrect assignment behavior
  await test("Req 3: Unknown service type safely avoids incorrect assignment behavior", () => {
    const pageSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/pages/TowTruckOrderWorkspacePage.tsx"),
      "utf8",
    );
    assert.ok(
      pageSrc.includes('import { TowTruckUnknownServiceFallback } from "../components/TowTruckUnknownServiceFallback";'),
      "TowTruckOrderWorkspacePage must import TowTruckUnknownServiceFallback",
    );
    assert.ok(
      pageSrc.includes("<TowTruckUnknownServiceFallback"),
      "TowTruckOrderWorkspacePage must render TowTruckUnknownServiceFallback for unknown serviceType",
    );

    const fallbackSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckUnknownServiceFallback.tsx"),
      "utf8",
    );
    assert.ok(
      fallbackSrc.includes("unknownServiceTypeTitle"),
      "Fallback must render localized unknownServiceTypeTitle",
    );
    assert.ok(
      fallbackSrc.includes("unknownServiceSafeModeNotice"),
      "Fallback must render safe mode notice",
    );
    // Must NOT contain driver dispatch or quoting mutations
    assert.ok(
      !fallbackSrc.includes("TowTruckDispatch"),
      "Fallback must not render TowTruckDispatch mutation flow",
    );
    assert.ok(
      !fallbackSrc.includes("TowTruckDriverDispatchSection"),
      "Fallback must not render TowTruckDriverDispatchSection",
    );
    assert.ok(
      !fallbackSrc.includes("TowTruckInterCityDispatchSection"),
      "Fallback must not render TowTruckInterCityDispatchSection",
    );
  });

  // 4. Origin and destination display correctly when available
  await test("Req 4: Origin and destination display correctly when available", () => {
    const raw = {
      id: 401,
      orderType: 3,
      towTruckServiceType: 2,
      intercityTowTruckDetails: {
        originCityNameSnapshot: "الرياض",
        destinationCityNameSnapshot: "الدمام",
        roadId: 42,
      },
      addressTitle: "حي الملقا",
      destinationAddressTitle: "حي الشاطئ",
    };
    const order = adaptTowTruck(raw);
    assert.equal(order.intercityDetails.originCityName, "الرياض");
    assert.equal(order.intercityDetails.destinationCityName, "الدمام");
    assert.equal(order.hasInterCityRoute, true);
    assert.equal(order.routeSummary, "الرياض → الدمام");

    const headerSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityHeader.tsx"),
      "utf8",
    );
    assert.ok(
      headerSrc.includes("departureCity") && headerSrc.includes("arrivalCity"),
      "Header must render departureCity and arrivalCity labels",
    );
  });

  // 5. Missing corridor data produces an appropriate neutral state
  await test("Req 5: Missing corridor data produces an appropriate neutral state", () => {
    const rawNoRoute = {
      id: 402,
      orderType: 3,
      towTruckServiceType: 2,
      intercityTowTruckDetails: null,
      addressTitle: "شارع التحلية، الرياض",
      destinationAddressTitle: "طريق الملك، جدة",
    };
    const order = adaptTowTruck(rawNoRoute);
    assert.equal(order.intercityDetails.originCityName, null);
    assert.equal(order.intercityDetails.destinationCityName, null);
    assert.equal(order.hasInterCityRoute, false);
    assert.equal(order.routeSummary, null);

    const headerSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityHeader.tsx"),
      "utf8",
    );
    assert.ok(
      headerSrc.includes("towTruck.intercityRouteDetailsMissing"),
      "Header must render neutral missing route notice when corridor cities are absent",
    );
  });

  // 6. Sender and receiver remain distinct
  await test("Req 6: Sender and receiver remain distinct", () => {
    const rawWithReceiver = {
      id: 403,
      orderType: 3,
      towTruckServiceType: 2,
      userFullName: "سعد القحطاني",
      customerPhoneNumber: "0501234567",
      userId: 88,
      intercityTowTruckDetails: {
        receiverName: "فهد العتيبي",
        receiverPhone: "+966559876543",
      },
    };
    const order = adaptTowTruck(rawWithReceiver);
    assert.equal(order.customer, "سعد القحطاني");
    assert.equal(order.phone, "0501234567");
    assert.equal(order.intercityDetails.receiverName, "فهد العتيبي");
    assert.equal(order.intercityDetails.receiverPhone, "+966559876543");
    assert.notEqual(order.customer, order.intercityDetails.receiverName);

    const partiesSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityPartiesSection.tsx"),
      "utf8",
    );
    assert.ok(
      partiesSrc.includes("senderParty") && partiesSrc.includes("receiverParty"),
      "Parties section must have distinct senderParty and receiverParty",
    );
    assert.ok(
      partiesSrc.includes("tel:"),
      "Parties section must generate accessible tel: links",
    );
  });

  // 7. Missing receiver data does not imply that the sender is the receiver
  await test("Req 7: Missing receiver data does not imply that the sender is the receiver", () => {
    const rawNoReceiver = {
      id: 404,
      orderType: 3,
      towTruckServiceType: 2,
      userFullName: "عبدالله الشمري",
      customerPhoneNumber: "0551112233",
      userId: 90,
      intercityTowTruckDetails: null,
    };
    const order = adaptTowTruck(rawNoReceiver);
    assert.equal(order.customer, "عبدالله الشمري");
    assert.equal(order.intercityDetails.receiverName, null);
    assert.equal(order.intercityDetails.receiverPhone, null);

    const partiesSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityPartiesSection.tsx"),
      "utf8",
    );
    assert.ok(
      partiesSrc.includes("towTruck.receiverUnavailable"),
      "Parties section must render receiverUnavailable when receiver data is absent",
    );
    assert.ok(
      partiesSrc.includes("towTruck.receiverNotCustomerNote"),
      "Parties section must render receiverNotCustomerNote explicitly",
    );
  });

  // 8. Recorded order total is separate from current reference Road tariff
  await test("Req 8: Recorded order total is separate from current reference Road tariff", () => {
    const raw = {
      id: 405,
      orderType: 3,
      towTruckServiceType: 2,
      totalPrice: 650,
      intercityTowTruckDetails: {
        roadId: 10,
        originCityNameSnapshot: "الرياض",
        destinationCityNameSnapshot: "القصيم",
      },
    };
    const order = adaptTowTruck(raw);
    assert.equal(order.total, 650);

    const financeSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityFinanceSection.tsx"),
      "utf8",
    );
    assert.ok(
      financeSrc.includes("recordedTotal"),
      "Finance section must display recordedTotal",
    );
    assert.ok(
      financeSrc.includes("referenceTariffCardTitle"),
      "Finance section must separately display referenceTariffCardTitle",
    );
    assert.ok(
      financeSrc.includes("financialRecordNotice"),
      "Finance section must include financialRecordNotice",
    );

    const corridorSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityCorridorSection.tsx"),
      "utf8",
    );
    assert.ok(
      corridorSrc.includes("referenceTariffNotice"),
      "Corridor section must include referenceTariffNotice",
    );
  });

  // 9. Paid InterCity assignment remains blocked
  await test("Req 9: Paid InterCity assignment remains blocked", () => {
    const paidInterCity = adaptTowTruck({
      id: 406,
      orderType: 3,
      towTruckServiceType: 2,
      status: 1, // InWaiting
      paymentStatus: 2, // Paid
      totalPrice: 500,
      userId: 1,
    });
    assert.equal(
      initialAssignmentBlock(paidInterCity),
      "assignmentPaidInterCityBlocked",
      "Paid InterCity assignment must remain blocked by initialAssignmentBlock",
    );

    const dispatchSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityDispatchSection.tsx"),
      "utf8",
    );
    assert.ok(
      dispatchSrc.includes("intercityPaidSafeguardTitle"),
      "InterCity dispatch section must render intercityPaidSafeguardTitle",
    );
    assert.ok(
      dispatchSrc.includes("intercityPaidSafeguardDesc"),
      "InterCity dispatch section must render intercityPaidSafeguardDesc",
    );
  });

  // 10. Existing eligible unpaid assignment behavior is preserved
  await test("Req 10: Existing eligible unpaid assignment behavior is preserved", () => {
    const eligibleInterCity = adaptTowTruck({
      id: 407,
      orderType: 3,
      towTruckServiceType: 2,
      status: 1, // InWaiting
      paymentStatus: 1, // Pending
      totalPrice: 450,
      userId: 1,
    });
    assert.equal(
      initialAssignmentBlock(eligibleInterCity),
      null,
      "Eligible unpaid InterCity order must not be blocked",
    );

    const dispatchSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDispatch.tsx"),
      "utf8",
    );
    assert.ok(
      dispatchSrc.includes("form.setValue(\"cost\", String(order.total)"),
      "TowTruckDispatch must pre-populate recorded total for InterCity without mutating backend contract",
    );
  });

  // 11. Driver unassignment and cancellation guards remain intact
  await test("Req 11: Driver unassignment and cancellation guards remain intact", () => {
    const dispatchSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityDispatchSection.tsx"),
      "utf8",
    );
    assert.ok(
      dispatchSrc.includes("<TowTruckDriverOperations"),
      "InterCity dispatch section must house TowTruckDriverOperations",
    );

    const headerSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityHeader.tsx"),
      "utf8",
    );
    assert.ok(
      headerSrc.includes("isPaid ? t(\"towTruck.cancelBlockedPaid\") : undefined"),
      "Cancellation action in header must be disabled when order is Paid",
    );
    assert.ok(
      headerSrc.includes("!isAlreadyCancelled && onCancelOrder"),
      "Cancellation action must be withheld if already cancelled",
    );
  });

  // 12. No fabricated route geometry, ETA, distance, or live GPS
  await test("Req 12: No fabricated route geometry, ETA, distance, or live GPS", () => {
    const corridorSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityCorridorSection.tsx"),
      "utf8",
    );
    assert.ok(
      !corridorSrc.includes("distanceKm") && !corridorSrc.includes("calculatedEta"),
      "Corridor section must not calculate fake distance or ETA",
    );
    assert.ok(
      corridorSrc.includes("point.latitude === 0 && point.longitude === 0"),
      "Corridor section must reject suspect (0,0) coordinates from generating map links",
    );
  });

  // 13. No raw placeholder values are displayed
  await test("Req 13: No raw placeholder values are displayed", () => {
    const rawWithSwagger = {
      id: 408,
      orderType: 3,
      towTruckServiceType: 2,
      brandName: "string",
      brandModel: "null",
      brandYear: "undefined",
      serialNumber: "string",
      plateNumber: "   ",
    };
    const order = adaptTowTruck(rawWithSwagger);
    assert.equal(order.brandName, null);
    assert.equal(order.brandModel, null);
    assert.equal(order.brandYear, null);
    assert.equal(order.serialNumber, null);
    assert.equal(order.plate, null);

    const vehicleSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckInterCityVehicleSection.tsx"),
      "utf8",
    );
    assert.ok(
      vehicleSrc.includes("towTruck.missing"),
      "Vehicle section must display localized missing placeholder instead of raw placeholders",
    );
  });

  // 14. Arabic/English localization and RTL/LTR behavior remain correct
  await test("Req 14: Arabic/English localization and RTL/LTR behavior remain correct", () => {
    const phase2d3Keys = [
      "interCityWorkspaceEyebrow",
      "transportJourney",
      "departureCity",
      "arrivalCity",
      "cityMissing",
      "routeCorridor",
      "interCityBadge",
      "corridorSectionTitle",
      "corridorSectionSubtitle",
      "originPoint",
      "destinationPoint",
      "configuredRoadId",
      "referenceRoadTariff",
      "referenceTariffLoading",
      "referenceTariffUnavailable",
      "referenceTariffComparisonMatch",
      "referenceTariffComparisonDiff",
      "recordedOrderAmount",
      "referenceTariffNotice",
      "openNetworkOverview",
      "directJourneyRoute",
      "noRoadConfigured",
      "logisticsPartiesTitle",
      "logisticsPartiesSubtitle",
      "senderParty",
      "receiverParty",
      "senderPickupAddress",
      "receiverDeliveryAddress",
      "receiverUnavailable",
      "receiverNotCustomerNote",
      "cargoVehicleTitle",
      "cargoVehicleSubtitle",
      "vehicleMake",
      "vehicleModel",
      "vehicleYear",
      "vehiclePlate",
      "vehicleVin",
      "vehicleCargoClassification",
      "vehicleCargoType",
      "intercityFinanceTitle",
      "intercityFinanceSubtitle",
      "recordedSubtotal",
      "recordedDiscount",
      "recordedTotal",
      "referenceTariffCardTitle",
      "financialRecordNotice",
      "intercityDispatchTitle",
      "intercityDispatchSubtitle",
      "assignedCarrier",
      "unassignedCarrier",
      "intercityPaidSafeguardTitle",
      "intercityPaidSafeguardDesc",
      "intercityEligibleDispatchDesc",
      "unknownServiceTypeTitle",
      "unknownServiceTypeDesc",
      "unknownServiceSafeModeNotice",
    ];

    for (const key of phase2d3Keys) {
      assert.ok(key in towTruckAr, `Key '${key}' must exist in towTruckAr`);
      assert.ok(key in towTruckEn, `Key '${key}' must exist in towTruckEn`);
      assert.ok(
        typeof towTruckAr[key] === "string" && towTruckAr[key].length > 0,
        `towTruckAr.${key} must be non-empty`,
      );
      assert.ok(
        typeof towTruckEn[key] === "string" && towTruckEn[key].length > 0,
        `towTruckEn.${key} must be non-empty`,
      );
    }
  });

  // 15. Return-to-queue context and unsaved-work protection remain intact
  await test("Req 15: Return-to-queue context and unsaved-work protection remain intact", () => {
    const pageSrc = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/pages/TowTruckOrderWorkspacePage.tsx"),
      "utf8",
    );
    assert.ok(
      pageSrc.includes("useBlocker"),
      "Workspace page must use useBlocker for draft protection",
    );
    assert.ok(
      pageSrc.includes("useBeforeUnload"),
      "Workspace page must use useBeforeUnload for reload/tab close protection",
    );
    assert.ok(
      pageSrc.includes("fromQueue"),
      "Workspace page must preserve fromQueue navigation state",
    );
  });

  console.log(`\nALL ${passed}/15 Phase 2D.3 tests passed successfully (OFFLINE)!`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
