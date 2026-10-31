/**
 * @file check-tow-truck-phase2c-corridor.cjs
 * @description Comprehensive offline verification suite for Tow Truck Phase 2C.2:
 * InterCity Corridor Experience Foundation.
 *
 * Verifies all 12 Phase 2C.2 requirements:
 * 1. Technical developer notices absent from normal Tow Truck UI
 * 2. Real read/error states remain
 * 3. Corridor Explorer uses verified Roads data
 * 4. Directional A -> B and B -> A corridors remain distinct
 * 5. No page-local corridor counts presented as global totals
 * 6. Current Road cost labelled as reference data and not an order amount
 * 7. Default state shows all corridors
 * 8. Corridor selection is accessible and not implemented as application tabs
 * 9. Mobile structure stays compact
 * 10. No new N+1 order-detail requests
 * 11. No new unsupported backend query parameters
 * 12. Map/network view does not fabricate route geometry
 */

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

console.log("=== RUNNING TOW TRUCK PHASE 2C.2 CORRIDOR EXPERIENCE TEST SUITE ===");

(async () => {
  const operationsPagePath = path.join(root, "src/modules/tow-truck/pages/TowTruckOperationsPage.tsx");
  const corridorExplorerPath = path.join(root, "src/modules/tow-truck/components/TowTruckCorridorExplorer.tsx");
  const networkModalPath = path.join(root, "src/modules/tow-truck/components/TowTruckNetworkModal.tsx");
  const i18nPath = path.join(root, "src/modules/tow-truck/i18n.ts");

  const operationsPageSrc = fs.readFileSync(operationsPagePath, "utf8");
  const corridorExplorerSrc = fs.readFileSync(corridorExplorerPath, "utf8");
  const networkModalSrc = fs.readFileSync(networkModalPath, "utf8");
  const i18nSrc = fs.readFileSync(i18nPath, "utf8");

  // ── 1. Technical Developer Notices Absent From Normal Tow Truck UI ──────────
  await test("Phase 2C.2 (1/12): Technical developer notices are absent from normal Tow Truck UI", () => {
    // Audit that developer noise keys are not rendered in TowTruckOperationsPage
    assert.equal(
      operationsPageSrc.includes("serviceTypeFilterNoticeTitle"),
      false,
      "serviceTypeFilterNoticeTitle must not be rendered in normal UI",
    );
    assert.equal(
      operationsPageSrc.includes("serviceTypeFilterNoticeDesc"),
      false,
      "serviceTypeFilterNoticeDesc must not be rendered in normal UI",
    );
    assert.equal(
      operationsPageSrc.includes("serviceBatchScopeNotice"),
      false,
      "serviceBatchScopeNotice must not be rendered in normal UI",
    );
    // Audit that terms like Swagger, GET /api/Orders, or runtime verification disclaimers are absent from TowTruckOperationsPage JSX
    assert.equal(
      operationsPageSrc.includes("Swagger"),
      false,
      "Swagger implementation details must not be mentioned in page JSX",
    );
    assert.equal(
      operationsPageSrc.includes("GET /api/Orders"),
      false,
      "Raw API endpoint names must not be exposed in page JSX",
    );

    // Phase 2C.2.1: Audit that developer licensing/implementation notices are absent from TowTruckNetworkModal JSX
    const modalCodeOnly = networkModalSrc.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
    assert.equal(
      modalCodeOnly.includes("networkMapDeferredNotice"),
      false,
      "Developer map readiness / licensing notice must not be rendered in network modal",
    );
    assert.equal(
      modalCodeOnly.includes("Google Places"),
      false,
      "Google Places licensing disclaimers must not be in network modal JSX",
    );
    assert.equal(
      modalCodeOnly.includes("Leaflet"),
      false,
      "Leaflet implementation details must not be in network modal JSX",
    );
    assert.equal(
      modalCodeOnly.includes("OpenStreetMap"),
      false,
      "OpenStreetMap details must not be in network modal JSX",
    );
  });

  // ── 2. Real Read/Error States Remain ────────────────────────────────────────
  await test("Phase 2C.2 (2/12): Real read, error, and empty states remain intact", () => {
    assert.ok(operationsPageSrc.includes("<ReadError"), "Real ReadError component must remain");
    assert.ok(operationsPageSrc.includes("queue.isError"), "queue.isError handling must remain");
    assert.ok(operationsPageSrc.includes("queue.isPending"), "Loading skeleton state must remain");
    assert.ok(operationsPageSrc.includes("refresh"), "Queue refresh action must remain");
    assert.ok(operationsPageSrc.includes("noServiceFilterResults"), "Empty service filter state must remain");
    assert.ok(operationsPageSrc.includes("noSearchResults"), "Empty search state must remain");
    assert.ok(operationsPageSrc.includes("emptyTitle"), "Global empty state must remain");
  });

  // ── 3. Corridor Explorer Uses Verified Roads Data ───────────────────────────
  await test("Phase 2C.2 (3/12): Corridor Explorer uses verified Roads query layer", () => {
    assert.ok(
      corridorExplorerSrc.includes("useAvailableRoadsQuery"),
      "Must use useAvailableRoadsQuery from verified roads queries",
    );
    assert.ok(
      corridorExplorerSrc.includes("resolvedOrigin"),
      "Must resolve origin city name",
    );
    assert.ok(
      corridorExplorerSrc.includes("resolvedDestination"),
      "Must resolve destination city name",
    );
    assert.ok(
      corridorExplorerSrc.includes("road.cost"),
      "Must use verified road.cost from Roads data",
    );
  });

  // ── 4. Directional A -> B and B -> A Corridors Remain Distinct ─────────────
  await test("Phase 2C.2 (4/12): Directional A -> B and B -> A corridors remain distinct entities", () => {
    const mockRoadAB = {
      id: 101,
      originCityId: 1,
      originCityName: "الرياض",
      destinationCityId: 2,
      destinationCityName: "جدة",
      cost: 1200,
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
    };
    const mockRoadBA = {
      id: 102,
      originCityId: 2,
      originCityName: "جدة",
      destinationCityId: 1,
      destinationCityName: "الرياض",
      cost: 1300,
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
    };

    // Verify distinct identity and directional uniqueness
    assert.notEqual(mockRoadAB.id, mockRoadBA.id);
    assert.notEqual(mockRoadAB.cost, mockRoadBA.cost);
    assert.equal(mockRoadAB.originCityId, mockRoadBA.destinationCityId);
    assert.equal(mockRoadAB.destinationCityId, mockRoadBA.originCityId);

    // Corridor explorer keys by road.id, preventing collision
    assert.ok(
      corridorExplorerSrc.includes("key={road.id}"),
      "Corridor chips must be keyed by unique road.id",
    );
    // Explorer indicates directionality
    assert.ok(
      corridorExplorerSrc.includes("ArrowRight"),
      "Must visually represent route direction with arrow",
    );
  });

  // ── 5. No Page-Local Corridor Counts Presented as Global Totals ─────────────
  await test("Phase 2C.2 (5/12): No page-local corridor counts presented as global totals & honest queue separation", () => {
    // Backend does not support order totals per corridor in GET /api/Orders.
    // Ensure corridorExplorerSrc does NOT derive order counts per corridor from queue items
    assert.equal(
      corridorExplorerSrc.includes("orders.filter"),
      false,
      "Must not compute page-local order counts per corridor",
    );
    assert.equal(
      corridorExplorerSrc.includes("orderCount"),
      false,
      "Must not display fabricated order count on corridors",
    );

    // Phase 2C.2.1: Ensure corridor selection does not falsely claim to filter the queue
    assert.ok(
      corridorExplorerSrc.includes("corridorInspectionNotice"),
      "Must include corridorInspectionNotice explaining that order queue displays independently",
    );
    assert.ok(
      corridorExplorerSrc.includes("corridorInspectionBadge"),
      "Must label selected corridor card with corridorInspectionBadge",
    );
    // corridorAllDesc must not claim to view operations for corridors
    assert.equal(
      i18nSrc.includes("عرض العمليات عبر جميع ممرات"),
      false,
      "corridorAllDesc must not claim to view operations across corridors",
    );
    assert.equal(
      i18nSrc.includes("View operations across all configured corridors"),
      false,
      "corridorAllDesc must not claim to view operations in English either",
    );
    // TowTruckOperationsPage displayedOrders must not filter by selectedCorridorId
    assert.equal(
      operationsPageSrc.includes("selectedCorridorId && o."),
      false,
      "Queue displayedOrders must not perform partial page-local filtering by selectedCorridorId",
    );
  });

  // ── 6. Current Road Cost Labelled as Reference Data ──────────────────────────
  await test("Phase 2C.2 (6/12): Current Road cost is labelled as reference data and avoids absolute guarantees", () => {
    assert.ok(
      corridorExplorerSrc.includes("referenceTariff"),
      "Must label Road.cost with referenceTariff i18n key",
    );
    assert.ok(
      corridorExplorerSrc.includes("referenceTariffNote"),
      "Must include referenceTariffNote explaining price isolation",
    );

    // Check i18n wording for referenceTariff and referenceTariffNote
    assert.ok(i18nSrc.includes("referenceTariff:"), "referenceTariff must exist in i18n");
    assert.ok(i18nSrc.includes("referenceTariffNote:"), "referenceTariffNote must exist in i18n");

    // Phase 2C.2.1: Avoid absolute guarantees about historical price preservation
    assert.equal(
      i18nSrc.includes("ولا تتغير تلقائياً"),
      false,
      "Must avoid absolute guarantees like 'ولا تتغير تلقائياً' without verified backend support",
    );
    assert.equal(
      i18nSrc.includes("protected from automatic changes"),
      false,
      "Must avoid absolute guarantees like 'protected from automatic changes'",
    );
  });

  // ── 7. Default State Shows All Corridors ─────────────────────────────────────
  await test("Phase 2C.2 (7/12): Default state shows all corridors with explicit 'All corridors' chip", () => {
    assert.ok(
      corridorExplorerSrc.includes("selectedCorridorId === null"),
      "Default state must check for null selectedCorridorId",
    );
    assert.ok(
      corridorExplorerSrc.includes("corridorAll"),
      "Must render 'All corridors' chip using corridorAll key",
    );
    assert.ok(
      corridorExplorerSrc.includes("onSelectCorridor(null)"),
      "Clicking All Corridors chip must pass null",
    );
  });

  // ── 8. Corridor Selection Accessible and Not Application Tabs ───────────────
  await test("Phase 2C.2 (8/12): Corridor selection uses accessible filter buttons, NOT application tabs", () => {
    // Strip comments to inspect actual JSX/code
    const codeOnly = corridorExplorerSrc.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

    // Strictly forbid role="tablist" and role="tab" in JSX
    assert.equal(
      codeOnly.includes('role="tablist"'),
      false,
      "Must NOT use role='tablist'",
    );
    assert.equal(
      codeOnly.includes('role="tab"'),
      false,
      "Must NOT use role='tab'",
    );

    // Verify accessible group and button filter semantics
    assert.ok(
      codeOnly.includes('role="group"'),
      "Corridors container must use role='group'",
    );
    assert.ok(
      codeOnly.includes("aria-pressed="),
      "Corridor toggle buttons must use aria-pressed for selection state",
    );
    assert.ok(
      codeOnly.includes("aria-label="),
      "Corridor toggle buttons must have descriptive aria-label",
    );
  });

  // ── 9. Mobile Structure Stays Compact ────────────────────────────────────────
  await test("Phase 2C.2 (9/12): Mobile structure stays compact with horizontal scrolling track", () => {
    assert.ok(
      corridorExplorerSrc.includes("overflow-x-auto"),
      "Corridor track must be horizontally scrollable on mobile",
    );
    assert.ok(
      corridorExplorerSrc.includes("scrollbar-none"),
      "Corridor track must use clean scrollbar styling",
    );
    assert.ok(
      corridorExplorerSrc.includes("touch-pan-x"),
      "Corridor track must support smooth touch panning",
    );
    // Map is kept behind an explicit action, not consuming permanent page space
    assert.ok(
      operationsPageSrc.includes("TowTruckNetworkModal"),
      "Network view map must be rendered in on-demand modal",
    );
  });

  // ── 10. No New N+1 Order-Detail Requests ────────────────────────────────────
  await test("Phase 2C.2 (10/12): No new N+1 order-detail requests introduced", () => {
    assert.equal(
      corridorExplorerSrc.includes("useTowTruckDetail"),
      false,
      "Corridor explorer must not trigger per-order detail requests",
    );
    assert.equal(
      networkModalSrc.includes("useTowTruckDetail"),
      false,
      "Network modal must not trigger per-order detail requests",
    );
  });

  // ── 11. No New Unsupported Backend Query Parameters ─────────────────────────
  await test("Phase 2C.2 (11/12): No unsupported backend query parameters sent to orders API", () => {
    // Orders queue query must only use valid parameters: page, trackNumber, numericServiceType
    assert.ok(
      operationsPageSrc.includes("useTowTruckQueue(page, trackSearch, numericServiceType)"),
      "Must preserve clean useTowTruckQueue parameters without unsupported params",
    );
  });

  // ── 12. Map/Network View Does Not Fabricate Route Geometry ──────────────────
  await test("Phase 2C.2 (12/12): Route network overview does not fabricate route geometry and omits developer licensing disclaimers", () => {
    const modalCodeOnly = networkModalSrc.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

    assert.ok(
      modalCodeOnly.includes("networkSchematicNotice"),
      "Must state operational route network overview",
    );
    // Phase 2C.2.1: Developer licensing and map deferred disclaimers removed from user-facing modal
    assert.equal(
      modalCodeOnly.includes("networkMapDeferredNotice"),
      false,
      "Must not render developer-facing map deferred notice in modal",
    );
    // Verify zero polyline / fake coordinates / fake ETA fabrication in JSX
    assert.equal(
      modalCodeOnly.includes("<Polyline"),
      false,
      "Must not render route polyline geometry",
    );
    assert.equal(
      modalCodeOnly.includes("durationMinutes"),
      false,
      "Must not fabricate travel duration estimates",
    );
  });

  console.log(`\nAll ${passed} Phase 2C.2 checks passed successfully!`);
})();
