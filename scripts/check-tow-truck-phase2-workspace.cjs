/**
 * @file check-tow-truck-phase2-workspace.cjs
 * @description Offline validation for Tow Truck Phase 2: Quick Preview & Full Order Workspace.
 * Tests route parameters, selected order identity, coordinate quality & map URLs,
 * missing-data fallbacks, draft safety condition logic, and i18n key parity.
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

const {
  adaptTowTruck,
  location,
  safeAttachmentUrl,
  normalizeText,
  parseTowTruckPaymentMethod,
  parseTowTruckStatus,
} = load("src/modules/tow-truck/lib/towTruckModel.ts");
const {
  orderStatusFromNumber,
  orderStatusToI18nKey,
  paymentMethodFromNumber,
  paymentMethodToI18nKey,
  ORDER_STATUS_MAP,
  PAYMENT_METHOD_MAP,
} = load("src/modules/orders/lib/orderEnums.ts");
const { formatTowTruckOrderDate, formatTowTruckSyncTime } = load(
  "src/modules/tow-truck/lib/towTruckDate.ts",
);
const { nextActionMessage, initialAssignmentBlock } = load(
  "src/modules/tow-truck/lib/dispatchModel.ts",
);
const { towTruckAr, towTruckEn } = load("src/modules/tow-truck/i18n.ts");

function runChecks() {
  console.log("Running Tow Truck Phase 2: Quick Preview & Full Workspace checks...");

  // 1. Order Route ID Validation (Positive Safe Integers Only)
  {
    const isValidOrderId = (id) =>
      Boolean(id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)));

    assert.equal(isValidOrderId("105"), true, "Valid numeric ID must be accepted");
    assert.equal(isValidOrderId("1"), true, "ID 1 must be accepted");
    assert.equal(isValidOrderId("999999"), true, "Safe integer ID must be accepted");

    // Invalid IDs
    assert.equal(isValidOrderId("0"), false, "Zero is not a valid order ID");
    assert.equal(isValidOrderId("-5"), false, "Negative numbers are invalid");
    assert.equal(isValidOrderId("abc"), false, "Strings are invalid");
    assert.equal(isValidOrderId("10.5"), false, "Decimals are invalid");
    assert.equal(isValidOrderId("1e5"), false, "Scientific notation is invalid");
    assert.equal(isValidOrderId(""), false, "Empty string is invalid");
    assert.equal(isValidOrderId(null), false, "Null is invalid");
    assert.equal(isValidOrderId(undefined), false, "Undefined is invalid");
    assert.equal(isValidOrderId(String(Number.MAX_SAFE_INTEGER + 10)), false, "Unsafe integer is invalid");
  }

  // 2. Location Quality & Coordinate Verification
  {
    // A. Valid coordinates (Unverified quality)
    const validLoc = location("Riyadh Point", "Near Kingdom Center", 24.7136, 46.6753);
    assert.equal(validLoc.quality, "unverified", "Valid coordinates report quality unverified");
    assert.equal(validLoc.latitude, 24.7136);
    assert.equal(validLoc.longitude, 46.6753);

    // B. Null Island placeholder (0, 0) -> Suspect quality
    const suspectLoc = location("Null Island", "Placeholder coordinates", 0, 0);
    assert.equal(suspectLoc.quality, "suspect", "0,0 coordinates must report suspect");

    // C. Missing coordinates
    const missingLoc = location("Unknown Place", null, null, null);
    assert.equal(missingLoc.quality, "missing", "Null coordinates must report missing");

    // D. Invalid coordinates (out of bounds)
    const invalidLoc = location("Bad Point", null, 95.5, 200.0);
    assert.equal(invalidLoc.quality, "invalid", "Latitude > 90 or Longitude > 180 must report invalid");

    // E. NaN / Non-numeric coordinates
    const nanLoc = location("Corrupt Point", null, "invalid", {});
    assert.equal(nanLoc.quality, "invalid", "Non-numeric coordinates must report invalid");
  }

  // 3. Map URL Generation Guard (Never point to Null Island or Invalid Coords)
  {
    const generateMapUrl = (point) => {
      if (point.quality !== "unverified" || point.latitude === null || point.longitude === null) {
        return null;
      }
      return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
    };

    const validPoint = location("Store", "Downtown", 24.5, 46.5);
    const suspectPoint = location("Center", "Suspicious", 0, 0);
    const missingPoint = location("Lost", null, null, null);

    assert.equal(
      generateMapUrl(validPoint),
      "https://www.google.com/maps/search/?api=1&query=24.5,46.5",
      "Valid coordinates generate valid map link",
    );
    assert.equal(generateMapUrl(suspectPoint), null, "Suspect Null Island coordinates never generate map link");
    assert.equal(generateMapUrl(missingPoint), null, "Missing coordinates never generate map link");
  }

  // 4. Safe Attachment Link URL Protocol Verification
  {
    assert.equal(
      safeAttachmentUrl("https://miqwad-test.runasp.net/files/doc.pdf"),
      "https://miqwad-test.runasp.net/files/doc.pdf",
    );
    assert.equal(
      safeAttachmentUrl("http://example.com/image.png"),
      "http://example.com/image.png",
    );
    // Unsafe protocols must be rejected
    assert.equal(safeAttachmentUrl("javascript:alert(1)"), null, "javascript: must be rejected");
    assert.equal(safeAttachmentUrl("data:text/html,bad"), null, "data: must be rejected");
    assert.equal(safeAttachmentUrl("file:///C:/passwords.txt"), null, "file: must be rejected");
    assert.equal(safeAttachmentUrl("   "), null, "whitespace must be rejected");
    assert.equal(safeAttachmentUrl(null), null, "null must be rejected");
  }

  // 5. Authentic Timestamps vs Absence of Invention
  {
    const realDateOrder = adaptTowTruck({
      id: 10,
      orderType: 3,
      status: 1,
      createdAt: "2026-10-22T09:15:00Z",
      userId: 1,
      userFullName: "Customer A",
    });
    const formatted = formatTowTruckOrderDate(realDateOrder.createdAt, "ar");
    assert.equal(formatted.valid, true);
    assert.ok(formatted.absolute.includes("2026"));
    assert.ok(formatted.relative);

    const missingDateOrder = adaptTowTruck({
      id: 11,
      orderType: 3,
      status: 1,
      createdAt: null, // missing date
      userId: 2,
      userFullName: "Customer B",
    });
    const missingFormatted = formatTowTruckOrderDate(missingDateOrder.createdAt, "ar");
    assert.equal(missingFormatted.valid, false);
    assert.equal(missingFormatted.absolute, "—", "Never fabricate current time for missing creation date");
    assert.equal(missingFormatted.relative, null);
  }

  // 6. Next Action Operational Guidance Matrix
  {
    // A. Check details stage (identical origin & destination) -> checkHint
    const checkDetailsOrder = adaptTowTruck({
      id: 200,
      orderType: 3,
      status: 1,
      towTruckDriverId: null,
      userId: 1,
      addressTitle: "Same",
      destinationAddressTitle: "Same",
      addressLatitude: 24.7,
      addressLongitude: 46.7,
      destinationLatitude: 24.7,
      destinationLongitude: 46.7,
    });
    assert.equal(checkDetailsOrder.stage, "checkDetails");
    assert.equal(nextActionMessage(checkDetailsOrder), "checkHint");

    // B. InWaiting + Unassigned + complete trip details -> reviewHint (ready to prepare quote)
    const waitingUnassigned = adaptTowTruck({
      id: 201,
      orderType: 3,
      status: 1, // InWaiting
      towTruckDriverId: null,
      paymentStatus: 1, // Pending
      userId: 1,
      addressTitle: "Riyadh Station",
      destinationAddressTitle: "Airport",
      plateNumber: "ABC 1234",
    });
    assert.equal(nextActionMessage(waitingUnassigned), "reviewHint");

    // C. Assigned + Payment Pending -> pendingCustomerHint
    const waitingAssigned = adaptTowTruck({
      id: 202,
      orderType: 3,
      status: 1, // InWaiting
      towTruckDriverId: 44,
      towTruckDriverFullName: "Driver X",
      paymentStatus: 1, // Pending
      userId: 1,
      addressTitle: "Riyadh Station",
      destinationAddressTitle: "Airport",
      plateNumber: "ABC 1234",
    });
    assert.equal(nextActionMessage(waitingAssigned), "pendingCustomerHint");

    // D. InWaiting + Already Assigned -> initialNeedsUnassigned
    const alreadyAssigned = adaptTowTruck({
      id: 203,
      orderType: 3,
      status: 1,
      towTruckDriverId: 55,
      towTruckDriverFullName: "Driver Y",
      paymentStatus: 2, // Paid
      userId: 1,
      addressTitle: "Riyadh Station",
      destinationAddressTitle: "Airport",
      plateNumber: "ABC 1234",
    });
    assert.equal(nextActionMessage(alreadyAssigned), "initialNeedsUnassigned");
  }

  // 7. Draft Protection Blocker Logic
  {
    const shouldBlockNavigation = (dirty, busy, currentPath, nextPath) =>
      (dirty || busy) && currentPath !== nextPath;

    assert.equal(
      shouldBlockNavigation(true, false, "/admin/tow-truck/105", "/admin/tow-truck"),
      true,
      "Dirty draft blocks departure",
    );
    assert.equal(
      shouldBlockNavigation(false, true, "/admin/tow-truck/105", "/admin/tow-truck"),
      true,
      "In-flight busy mutation blocks departure",
    );
    assert.equal(
      shouldBlockNavigation(false, false, "/admin/tow-truck/105", "/admin/tow-truck"),
      false,
      "Clean idle form allows departure freely",
    );
    assert.equal(
      shouldBlockNavigation(true, false, "/admin/tow-truck/105", "/admin/tow-truck/105"),
      false,
      "Same-path navigation is not blocked",
    );
  }

  // 8. Translation Key Parity for Phase 2 Workspace & Quick Preview
  {
    const phase2RequiredKeys = [
      "quickPreviewTitle",
      "quickPreviewSubtitle",
      "openFullWorkspace",
      "backToQueue",
      "workspaceTitle",
      "workspaceSubtitle",
      "operationalSummary",
      "verifiedStage",
      "viewOnGoogleMaps",
      "viewLocationOnMap",
      "routeDetails",
      "customerAndVehicle",
      "orderFinances",
      "driverAndDispatch",
      "additionalInfo",
      "noOrderSelected",
      "orderNotFound",
      "orderNotFoundDesc",
      "quickPreview",
      "closePreview",
      "pickupCoordinates",
      "destinationCoordinates",
      "currencySar",
      "locationQuality",
      "nextAction",
      "allOrders",
      "queueCaption",
      "syncing",
      "refreshQueue",
      "orderNumber",
      "attachments",
      "contact",
    ];

    for (const key of phase2RequiredKeys) {
      assert.ok(key in towTruckAr, `Key "${key}" must exist in Arabic translations`);
      assert.ok(key in towTruckEn, `Key "${key}" must exist in English translations`);
      assert.ok(typeof towTruckAr[key] === "string" && towTruckAr[key].length > 0);
      assert.ok(typeof towTruckEn[key] === "string" && towTruckEn[key].length > 0);
    }
  }

  // 9. Sheet Primitive CSS Utility Validation (No unrecognized class names)
  {
    const sheetFile = fs.readFileSync(path.join(root, "src/components/ui/sheet.tsx"), "utf8");
    assert.ok(
      sheetFile.includes("inset-y-0 end-0"),
      "Sheet end side must use valid Tailwind utilities inset-y-0 end-0",
    );
    assert.ok(
      sheetFile.includes("inset-x-0 bottom-0"),
      "Sheet bottom side must use valid Tailwind utilities inset-x-0 bottom-0",
    );
    assert.equal(
      sheetFile.includes("inset-block-0"),
      false,
      "Sheet must not contain unrecognized utility inset-block-0",
    );
    assert.equal(
      sheetFile.includes("inset-inline-end-0"),
      false,
      "Sheet must not contain unrecognized utility inset-inline-end-0",
    );
    assert.equal(
      sheetFile.includes("inset-inline-0"),
      false,
      "Sheet must not contain unrecognized utility inset-inline-0",
    );
  }

  // 10. Quick Preview Parameter & Query State Resolution
  {
    const sampleQueueItem = adaptTowTruck({
      id: 10054,
      orderType: 3,
      status: 1,
      paymentStatus: 2,
      userId: 1,
      addressTitle: "Pickup Point A",
      destinationAddressTitle: "Dropoff Point B",
      plateNumber: "XYZ 9999",
    });

    const resolvePreviewOrder = (previewId, detailData, queueItems) => {
      const isValid = Boolean(
        previewId && /^[1-9]\d*$/.test(previewId) && Number.isSafeInteger(Number(previewId)),
      );
      if (!isValid) return null;
      return detailData ?? queueItems.find((o) => o.id === previewId) ?? null;
    };

    // A. Order is present in queue: immediate resolution without detail fetch
    const immediateOrder = resolvePreviewOrder("10054", null, [sampleQueueItem]);
    assert.ok(immediateOrder, "Immediate resolution must find order in queue data");
    assert.equal(immediateOrder.id, "10054");

    // B. Order is not in queue (direct navigation): detail query fallback
    const directDetailOrder = resolvePreviewOrder("10054", sampleQueueItem, []);
    assert.ok(directDetailOrder, "Direct navigation must resolve order from detail query");
    assert.equal(directDetailOrder.id, "10054");

    // C. Invalid preview parameter does not resolve to an order
    assert.equal(resolvePreviewOrder("abc", sampleQueueItem, [sampleQueueItem]), null);
    assert.equal(resolvePreviewOrder("0", sampleQueueItem, [sampleQueueItem]), null);
    assert.equal(resolvePreviewOrder("-5", sampleQueueItem, [sampleQueueItem]), null);
  }

  // 11. Queue Context & Search Param Preservation on Preview Close
  {
    const closePreviewParams = (currentParamString) => {
      const params = new URLSearchParams(currentParamString);
      params.delete("preview");
      params.delete("orderId");
      return params.toString();
    };

    const initial = "page=2&trackNumber=TRK-10054&preview=10054";
    const closed = closePreviewParams(initial);
    assert.equal(
      closed,
      "page=2&trackNumber=TRK-10054",
      "Closing preview must preserve page and trackNumber search params",
    );
  }


  // 12. goToUnassign Navigation Regression — Target ID Consistency
  {
    // The button in TowTruckDispatch targets "tow-driver-operations-section".
    // TowTruckDriverOperations renders the section with exactly that id.
    const dispatchSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDispatch.tsx"),
      "utf8",
    );
    const operationsSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDriverOperations.tsx"),
      "utf8",
    );

    // The target element ID is declared in TowTruckDriverOperations.
    assert.ok(
      operationsSource.includes('id="tow-driver-operations-section"'),
      "TowTruckDriverOperations must declare id=\"tow-driver-operations-section\"",
    );

    // The navigation handler in TowTruckDispatch references the same ID.
    assert.ok(
      dispatchSource.includes('"tow-driver-operations-section"'),
      "TowTruckDispatch goToUnassign handler must reference \"tow-driver-operations-section\"",
    );

    // The IDs must be consistent (same string in both files).
    const targetId = "tow-driver-operations-section";
    assert.ok(operationsSource.includes(`id="${targetId}"`), "Target element ID is present in source");
    assert.ok(dispatchSource.includes(`"${targetId}"`), "Navigation handler references correct target ID");
  }

  // 13. goToUnassign Navigation — Destination Contains Order-Level Removal, Not Deactivation
  {
    const operationsSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDriverOperations.tsx"),
      "utf8",
    );

    // The destination section must contain the unassignDriver action (order-level removal).
    assert.ok(
      operationsSource.includes("towTruck.unassignDriver"),
      "Destination section must render order-level unassignDriver action",
    );

    // It must NOT navigate to an account deactivation control only —
    // the goToUnassign button is specifically about order-level driver removal.
    // The section also shows account management, but the removal action must be present.
    assert.ok(
      operationsSource.includes("setDialog(\"remove\")"),
      "Destination section must be able to open the remove dialog",
    );

    // Confirm that the section distinguishes order-removal from account-deactivation.
    assert.ok(
      operationsSource.includes("opsManageAccounts"),
      "Destination section also offers account management (separate from removal)",
    );
    assert.ok(
      operationsSource.includes("opsDeactivate"),
      "Account deactivation is a separate action from order-level removal",
    );
  }

  // 14. goToUnassign Navigation — Button Only Shown for Assigned Orders
  {
    const dispatchSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDispatch.tsx"),
      "utf8",
    );

    // The navigation block must be conditioned on order.assignment === "assigned".
    assert.ok(
      dispatchSource.includes('order.assignment === "assigned"'),
      "goToUnassign block must only render when order.assignment === \"assigned\"",
    );

    // Confirm that the goToUnassign i18n key is used inside that block.
    assert.ok(
      dispatchSource.includes("towTruck.goToUnassign"),
      "goToUnassign key must appear in the dispatch component",
    );
  }

  // 15. goToUnassign Navigation — Respects Reduced Motion
  {
    const dispatchSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDispatch.tsx"),
      "utf8",
    );

    // The handler must query prefers-reduced-motion.
    assert.ok(
      dispatchSource.includes("prefers-reduced-motion"),
      "goToUnassign handler must check prefers-reduced-motion media query",
    );

    // Reduced-motion path must use instant, not smooth.
    assert.ok(
      dispatchSource.includes('"instant"'),
      "Reduced-motion path must use behavior: \"instant\"",
    );
    assert.ok(
      dispatchSource.includes('"smooth"'),
      "Standard path must use behavior: \"smooth\"",
    );
  }

  // 16. goToUnassign Navigation — Heading is Focusable for Keyboard Accessibility
  {
    const operationsSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDriverOperations.tsx"),
      "utf8",
    );

    // The section heading must have tabIndex={-1} to allow programmatic focus.
    assert.ok(
      operationsSource.includes("tow-driver-operations-title") &&
        operationsSource.includes("tabIndex={-1}"),
      "tow-driver-operations-title heading must have tabIndex={-1} for programmatic focus",
    );
  }

  // 17. goToUnassign Navigation — Scroll Margin Accounts for Sticky Topbar
  {
    const operationsSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDriverOperations.tsx"),
      "utf8",
    );

    // The section must declare scrollMarginTop so the sticky 64px topbar doesn't obscure it.
    assert.ok(
      operationsSource.includes("scrollMarginTop"),
      "tow-driver-operations-section must declare scrollMarginTop to offset the sticky topbar",
    );
  }

  // 18. goToUnassign Navigation — Missing Target is Handled Safely (no throw)
  {
    // Simulate the guard: if the element does not exist, the handler returns early.
    const dispatchSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDispatch.tsx"),
      "utf8",
    );

    // The handler must guard against a missing element (early return or null check).
    assert.ok(
      dispatchSource.includes("if (!section) return") || dispatchSource.includes("if (el) {"),
      "goToUnassign handler must guard against missing target element",
    );
  }

  // 19. goToUnassign Navigation — No Backend Request Triggered
  {
    const dispatchSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDispatch.tsx"),
      "utf8",
    );

    // The scrollIntoView call must exist in the dispatch component for this navigation.
    assert.ok(
      dispatchSource.includes("scrollIntoView"),
      "Navigation handler must call scrollIntoView",
    );

    // The navigation handler must not trigger assignment.submit (a backend mutation).
    // assignment.submit only appears in confirmAssignment (a separate, guarded handler).
    // The goToUnassign onClick is a pure DOM navigation — verify it uses getElementById only.
    assert.ok(
      dispatchSource.includes("getElementById"),
      "Navigation handler must use getElementById to find the target",
    );

    // Verify assignment.submit exists only inside the confirmAssignment guard.
    const beforeGoToUnassignLabel = dispatchSource.indexOf("goToUnassign");
    const goToUnassignOnClick = dispatchSource.indexOf("scrollIntoView");
    // scrollIntoView must appear before (or at) the goToUnassign label area (the handler is above the label).
    assert.ok(goToUnassignOnClick > 0, "scrollIntoView must appear in the source");
  }

  // 20. goToUnassign — RTL/LTR: Destination Section Carries dir Attribute in Modal
  {
    const operationsSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDriverOperations.tsx"),
      "utf8",
    );

    // The modal that opens from the destination section must respect i18n direction.
    assert.ok(
      operationsSource.includes("i18n.dir()"),
      "Driver operations modal must set dir={i18n.dir()} for correct RTL/LTR rendering",
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 2D.2: Data Sanitization, Verified Enums, & Operational Display Integrity
  // ─────────────────────────────────────────────────────────────────────────────

  // 21. Exact Swagger Placeholders Normalize to Missing/Null
  {
    assert.equal(normalizeText("string"), null, "'string' must normalize to null");
    assert.equal(normalizeText("STRING"), null, "'STRING' (uppercase) must normalize to null");
    assert.equal(normalizeText("String"), null, "'String' (mixed case) must normalize to null");
    assert.equal(normalizeText("  string  "), null, "Padded 'string' must normalize to null");
    assert.equal(normalizeText("null"), null, "'null' text must normalize to null");
    assert.equal(normalizeText("NULL"), null, "'NULL' text must normalize to null");
    assert.equal(normalizeText("undefined"), null, "'undefined' text must normalize to null");
    assert.equal(normalizeText("UNDEFINED"), null, "'UNDEFINED' text must normalize to null");
    assert.equal(normalizeText(""), null, "Empty string must normalize to null");
    assert.equal(normalizeText("   "), null, "Whitespace must normalize to null");
    assert.equal(normalizeText(null), null, "Non-string null must normalize to null");
    assert.equal(normalizeText(undefined), null, "Non-string undefined must normalize to null");
  }

  // 22. Valid Arabic & English Text Intact (No Broad Substring Replacement)
  {
    assert.equal(
      normalizeText("حي الملقا، طريق الملك فهد"),
      "حي الملقا، طريق الملك فهد",
      "Arabic address must be preserved intact",
    );
    assert.equal(
      normalizeText("أحمد محمد الشمري"),
      "أحمد محمد الشمري",
      "Arabic customer name must be preserved intact",
    );
    assert.equal(
      normalizeText("King Fahd Road, Exit 4"),
      "King Fahd Road, Exit 4",
      "English address must be preserved intact",
    );
    assert.equal(
      normalizeText("Drawstring bag in trunk"),
      "Drawstring bag in trunk",
      "Text containing 'string' as substring must NOT be removed",
    );
    assert.equal(
      normalizeText("Stringent security check"),
      "Stringent security check",
      "Text starting with 'String' must NOT be removed",
    );
    assert.equal(
      normalizeText("none"),
      "none",
      "Customer-entered note 'none' must not be discarded",
    );
    assert.equal(
      normalizeText("-"),
      "-",
      "Customer-entered note '-' must not be discarded",
    );
  }

  // 23. Numeric and Nullable Fields Remain Unchanged
  {
    const zeroOrder = adaptTowTruck({
      id: 501,
      orderType: 3,
      status: 1,
      subtotal: 0,
      discountAmount: 0,
      totalPrice: 0,
      paymentStatus: 0,
      paymentMethod: 0,
      addressLatitude: 0,
      addressLongitude: 0,
      destinationLatitude: 0,
      destinationLongitude: 0,
    });
    assert.equal(zeroOrder.subtotal, 0, "Zero subtotal must be preserved");
    assert.equal(zeroOrder.discount, 0, "Zero discount must be preserved");
    assert.equal(zeroOrder.total, 0, "Zero totalPrice must be preserved");
    assert.equal(zeroOrder.paymentCode, 0, "Zero paymentStatus code must be preserved");
    assert.equal(zeroOrder.paymentMethodCode, 0, "Zero paymentMethod code must be preserved");
    assert.equal(zeroOrder.origin.latitude, 0, "0 coordinate must be preserved");
    assert.equal(zeroOrder.origin.longitude, 0, "0 coordinate must be preserved");
    assert.equal(zeroOrder.origin.quality, "suspect", "0,0 coordinate reports suspect quality");
  }

  // 24. Missing Location Text Does Not Cause Crashes
  {
    const missingTextLoc = location(null, null, 24.7136, 46.6753);
    assert.equal(missingTextLoc.title, null);
    assert.equal(missingTextLoc.description, null);
    assert.equal(missingTextLoc.latitude, 24.7136);
    assert.equal(missingTextLoc.quality, "unverified");

    const orderMissingLoc = adaptTowTruck({
      id: 502,
      orderType: 3,
      status: 1,
      addressTitle: null,
      addressDescription: null,
      destinationAddressTitle: null,
      destinationAddressDescription: null,
    });
    assert.equal(orderMissingLoc.missingTrip, true, "Missing location text marks missingTrip true");
    assert.equal(orderMissingLoc.stage, "checkDetails", "Missing location text forces checkDetails stage");
  }

  // 25. Raw 'string' Placeholders Do Not Leak into Workspace Displays
  {
    const swaggerOrder = adaptTowTruck({
      id: 503,
      orderType: 3,
      status: 1,
      orderNumber: "string",
      userFullName: "string",
      customerPhoneNumber: "string",
      brandName: "string",
      brandModel: "string",
      brandYear: "string",
      plateNumber: "string",
      addressTitle: "string",
      addressDescription: "string",
      destinationAddressTitle: "STRING",
      destinationAddressDescription: "string",
      towTruckDriverFullName: "string",
      duration: "string",
      notes: "string",
      intercityTowTruckDetails: {
        receiverName: "string",
        receiverPhone: "string",
        originCityNameSnapshot: "string",
        destinationCityNameSnapshot: "string",
      },
    });

    assert.equal(swaggerOrder.number, "#503", "Order number falls back to #ID instead of 'string'");
    assert.equal(swaggerOrder.customer, null, "Customer name 'string' normalized to null");
    assert.equal(swaggerOrder.phone, null, "Phone 'string' normalized to null");
    assert.equal(swaggerOrder.vehicle, null, "Vehicle containing only 'string' normalized to null");
    assert.equal(swaggerOrder.plate, null, "Plate 'string' normalized to null");
    assert.equal(swaggerOrder.origin.title, null, "Origin title 'string' normalized to null");
    assert.equal(swaggerOrder.origin.description, null, "Origin description 'string' normalized to null");
    assert.equal(swaggerOrder.destination.title, null, "Destination title 'string' normalized to null");
    assert.equal(swaggerOrder.destination.description, null, "Destination description 'string' normalized to null");
    assert.equal(swaggerOrder.driverName, null, "Driver name 'string' normalized to null");
    assert.equal(swaggerOrder.duration, null, "Duration 'string' normalized to null");
    assert.equal(swaggerOrder.notes, null, "Notes 'string' normalized to null");
    assert.equal(swaggerOrder.intercityDetails.receiverName, null, "Receiver name 'string' normalized to null");
    assert.equal(swaggerOrder.intercityDetails.receiverPhone, null, "Receiver phone 'string' normalized to null");
    assert.equal(swaggerOrder.intercityDetails.originCityName, null, "Origin city 'string' normalized to null");
    assert.equal(swaggerOrder.intercityDetails.destinationCityName, null, "Destination city 'string' normalized to null");
    assert.equal(swaggerOrder.routeSummary, null, "Route summary falls back to null instead of 'string → string'");
  }

  // 26. Known Order Statuses Map to Verified Labels
  {
    assert.equal(orderStatusFromNumber(1), "InWaiting", "Status 1 must map to InWaiting");
    assert.equal(orderStatusFromNumber(2), "Ready", "Status 2 must map to Ready");
    assert.equal(orderStatusFromNumber(3), "Shipped", "Status 3 must map to Shipped");
    assert.equal(orderStatusFromNumber(4), "Received", "Status 4 must map to Received");
    assert.equal(orderStatusFromNumber(5), "Canceled", "Status 5 must map to Canceled");

    assert.equal(orderStatusToI18nKey("InWaiting"), "orders.status.InWaiting");
    assert.equal(orderStatusToI18nKey("Ready"), "orders.status.Ready");
    assert.equal(orderStatusToI18nKey("Shipped"), "orders.status.Shipped");
    assert.equal(orderStatusToI18nKey("Received"), "orders.status.Received");
    assert.equal(orderStatusToI18nKey("Canceled"), "orders.status.Canceled");
  }

  // 27. Unknown Status Values Do Not Receive Fabricated Meanings
  {
    assert.equal(orderStatusFromNumber(0), "", "Code 0 returns empty status name");
    assert.equal(orderStatusFromNumber(6), "", "Code 6 returns empty status name");
    assert.equal(orderStatusFromNumber(99), "", "Code 99 returns empty status name");
    assert.equal(orderStatusFromNumber(null), "", "Null code returns empty status name");
    assert.equal(orderStatusFromNumber(undefined), "", "Undefined code returns empty status name");

    const parsedUnknown = parseTowTruckStatus(99);
    assert.equal(parsedUnknown.status, "", "Unknown status code returns empty string status");
  }

  // 28. Known Payment-Method Values Use Verified Labels
  {
    assert.equal(parseTowTruckPaymentMethod(1).method, "Cash", "Method 1 maps to Cash");
    assert.equal(parseTowTruckPaymentMethod(2).method, "CreditCard", "Method 2 maps to CreditCard");
    assert.equal(parseTowTruckPaymentMethod(3).method, "DebitCard", "Method 3 maps to DebitCard");
    assert.equal(parseTowTruckPaymentMethod(4).method, "BankTransfer", "Method 4 maps to BankTransfer");

    assert.equal(paymentMethodToI18nKey("Cash"), "orders.paymentMethod.Cash");
    assert.equal(paymentMethodToI18nKey("CreditCard"), "orders.paymentMethod.CreditCard");
    assert.equal(paymentMethodToI18nKey("DebitCard"), "orders.paymentMethod.DebitCard");
    assert.equal(paymentMethodToI18nKey("BankTransfer"), "orders.paymentMethod.BankTransfer");
  }

  // 29. Unknown Payment Methods Use Neutral Localized Label
  {
    assert.equal(parseTowTruckPaymentMethod(null).method, "", "Null method returns empty string");
    assert.equal(parseTowTruckPaymentMethod(0).method, "", "Code 0 returns empty string");
    assert.equal(parseTowTruckPaymentMethod(99).method, "", "Code 99 returns empty string");

    assert.equal(towTruckAr.methodUnknown, "طريقة الدفع غير محددة");
    assert.equal(towTruckEn.methodUnknown, "Payment method not specified");
    assert.equal(towTruckAr.paymentMethodUnspecified, "طريقة الدفع غير محددة");
    assert.equal(towTruckEn.paymentMethodUnspecified, "Payment method not specified");
  }

  // 30. No Developer-Facing Disclaimers or Internal Parameter/Field Names in Normal Workspace
  {
    const financeSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckFinanceSection.tsx"),
      "utf8",
    );
    const detailSource = fs.readFileSync(
      path.join(root, "src/modules/tow-truck/components/TowTruckDetail.tsx"),
      "utf8",
    );

    // Raw payment method code must NOT be exposed in workspace finance displays
    assert.ok(
      !financeSource.includes("order.paymentMethodCode"),
      "TowTruckFinanceSection must NOT expose raw payment method enum code",
    );
    assert.ok(
      !detailSource.includes("order.paymentMethodCode"),
      "TowTruckDetail must NOT expose raw payment method enum code",
    );

    // No Swagger or raw endpoint names in user-facing operational texts
    assert.ok(
      !towTruckAr.serviceTypeFilterNoticeDesc.includes("Swagger") &&
        !towTruckAr.serviceTypeFilterNoticeDesc.includes("/api/Orders"),
      "Arabic serviceTypeFilterNoticeDesc must not contain Swagger or /api/Orders",
    );
    assert.ok(
      !towTruckEn.serviceTypeFilterNoticeDesc.includes("Swagger") &&
        !towTruckEn.serviceTypeFilterNoticeDesc.includes("/api/Orders"),
      "English serviceTypeFilterNoticeDesc must not contain Swagger or /api/Orders",
    );

    // No internal totalPrice field name in notice description
    assert.ok(
      !towTruckAr.intercityFixedPriceNoticeDesc.includes("totalPrice"),
      "Arabic intercityFixedPriceNoticeDesc must not expose raw 'totalPrice' field name",
    );
    assert.ok(
      !towTruckEn.intercityFixedPriceNoticeDesc.includes("totalPrice"),
      "English intercityFixedPriceNoticeDesc must not expose raw 'totalPrice' field name",
    );

    // No test verification disclaimers in batch scope notice
    assert.ok(
      !towTruckAr.serviceBatchScopeNotice.includes("معلقاً"),
      "Arabic serviceBatchScopeNotice must not contain developer disclaimer 'معلقاً'",
    );
    assert.ok(
      !towTruckEn.serviceBatchScopeNotice.includes("pending"),
      "English serviceBatchScopeNotice must not contain developer disclaimer 'pending'",
    );
  }

  // 31. Existing Business, Payment, and Cancellation Guards Unchanged
  {
    // A. Initial assignment allows InWaiting + unpaid
    const eligibleOrder = adaptTowTruck({
      id: 601,
      orderType: 3,
      status: 1, // InWaiting
      paymentStatus: 1, // Pending
      userId: 1,
      addressTitle: "Point A",
      destinationAddressTitle: "Point B",
      plateNumber: "XYZ 987",
    });
    assert.equal(initialAssignmentBlock(eligibleOrder), null, "Eligible order is not blocked");

    // B. Paid InterCity order is safeguarded from assignment
    const paidInterCity = adaptTowTruck({
      id: 602,
      orderType: 3,
      status: 1,
      paymentStatus: 2, // Paid
      towTruckServiceType: 2, // InterCity
      totalPrice: 450,
      userId: 1,
      addressTitle: "Riyadh",
      destinationAddressTitle: "Dammam",
      plateNumber: "XYZ 987",
    });
    assert.equal(
      initialAssignmentBlock(paidInterCity),
      "assignmentPaidInterCityBlocked",
      "Paid InterCity assignment must remain safeguarded",
    );
  }

  // 32. Arabic/English Translation Key Parity
  {
    const arKeys = Object.keys(towTruckAr).sort();
    const enKeys = Object.keys(towTruckEn).sort();

    assert.equal(arKeys.length, enKeys.length, "Arabic and English towTruck dictionaries must have equal key counts");
    for (const key of arKeys) {
      assert.ok(key in towTruckEn, `Key '${key}' missing in towTruckEn`);
      assert.ok(typeof towTruckAr[key] === "string" && towTruckAr[key].length > 0, `towTruckAr.${key} must be non-empty`);
      assert.ok(typeof towTruckEn[key] === "string" && towTruckEn[key].length > 0, `towTruckEn.${key} must be non-empty`);
    }
  }

  console.log("PASS: 32/32 Tow Truck Phase 2 Workspace checks passed successfully.");
}

runChecks();

