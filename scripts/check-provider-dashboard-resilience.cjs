/**
 * @file check-provider-dashboard-resilience.cjs
 *
 * Standalone structural source-contract and domain regression checks for
 * Provider Dashboards (Scrap and Workshop).
 *
 * Checks:
 *   1. Repository root is resolved portably (no hardcoded Windows or absolute paths).
 *   2. Dashboard pages no longer invoke legacy/unsupported queries (useScrapProfileQuery,
 *      usePartRequestsQuery, useScrapStatsQuery, useWorkshopProfileQuery, useWorkshopSubscriptionQuery).
 *   3. Dashboard heroes use authenticated account identity with session fallback.
 *   4. Profile completeness differentiates missing profile (null -> "—") from true 0%.
 *   5. Scrap requests KPI uses "Total Requests" (kpiTotalRequests), not "Open Requests" (kpiOpenRequests),
 *      when bound to the unfiltered /api/Orders?OrderType=2 total.
 *   6. Query failures display read-error wording, never save-failure wording.
 *   7. Mock mode configuration remains untouched.
 *   8. PartRequestPreviewRow accepts SalvageOrder, uses verified status mapping, and links to live detail.
 *   9. Bilingual i18n keys for kpiTotalRequests and workshop subtitle are present in AR and EN.
 *
 * Note: These are structural and source-contract checks; they verify integration
 * contracts and boundary compliance, not end-to-end browser runtime behavior.
 */

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");

// 1. Portable repository root resolution
const root = path.resolve(__dirname, "..");
const req = createRequire(path.join(root, "package.json"));
const ts = req("typescript");

function transpileAndLoad(relativePath) {
  const fullPath = path.resolve(root, relativePath);
  const src = fs.readFileSync(fullPath, "utf8");
  const code = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(req, mod, mod.exports);
  return mod.exports;
}

console.log("--- Provider Dashboard Resilience Structural Contract Checks ---");

// ── Check 1: Portable path resolution ─────────────────────────────────────────
assert(!root.includes("\\..") && !root.includes("/.."), "Root path must be fully resolved");
assert(fs.existsSync(path.join(root, "package.json")), "Must locate package.json at resolved root");
console.log("PASS 1: Portable repository root resolution");

// ── Check 2: ScrapDashboardPage legacy queries removed ────────────────────────
const scrapDashboardPath = path.join(root, "src/modules/scrap/pages/ScrapDashboardPage.tsx");
const scrapDashboardSrc = fs.readFileSync(scrapDashboardPath, "utf8");

assert(
  !scrapDashboardSrc.includes("useScrapProfileQuery"),
  "ScrapDashboardPage must not reference legacy useScrapProfileQuery",
);
assert(
  !scrapDashboardSrc.includes("usePartRequestsQuery"),
  "ScrapDashboardPage must not reference legacy usePartRequestsQuery",
);
assert(
  !scrapDashboardSrc.includes("useScrapStatsQuery"),
  "ScrapDashboardPage must not reference unsupported useScrapStatsQuery (/scrap/stats 404)",
);
assert(
  scrapDashboardSrc.includes("useSalvageOrdersQuery"),
  "ScrapDashboardPage must use live useSalvageOrdersQuery",
);
console.log("PASS 2: Scrap dashboard does not call legacy/unsupported queries");

// ── Check 3: WorkshopDashboardPage legacy queries removed ─────────────────────
const workshopDashboardPath = path.join(
  root,
  "src/modules/workshop/pages/WorkshopDashboardPage.tsx",
);
const workshopDashboardSrc = fs.readFileSync(workshopDashboardPath, "utf8");

assert(
  !workshopDashboardSrc.includes("useWorkshopProfileQuery"),
  "WorkshopDashboardPage must not reference legacy useWorkshopProfileQuery",
);
assert(
  !workshopDashboardSrc.includes("useWorkshopSubscriptionQuery"),
  "WorkshopDashboardPage must not reference unsupported useWorkshopSubscriptionQuery (/workshop/subscription 404)",
);
console.log("PASS 3: Workshop dashboard does not call legacy/unsupported queries");

// ── Check 4: Hero identity fallbacks ──────────────────────────────────────────
assert(
  scrapDashboardSrc.includes("useAccountProfileQuery") &&
    scrapDashboardSrc.includes("useAppSelector"),
  "ScrapDashboardPage must use useAccountProfileQuery with Redux auth user fallback",
);
assert(
  scrapDashboardSrc.includes("accountProfile?.fullName || user?.fullName"),
  "ScrapDashboardPage must implement displayName fallback from account profile to session user",
);
assert(
  workshopDashboardSrc.includes("useAccountProfileQuery") &&
    workshopDashboardSrc.includes("useAppSelector"),
  "WorkshopDashboardPage must use useAccountProfileQuery with Redux auth user fallback",
);
assert(
  workshopDashboardSrc.includes("accountProfile?.fullName || user?.fullName"),
  "WorkshopDashboardPage must implement displayName fallback from account profile to session user",
);
console.log("PASS 4: Both dashboard heroes render verified account identity with session fallback");

// ── Check 5: Profile completeness: null distinct from 0% ──────────────────────
const profileCompletenessPath = path.join(root, "src/modules/workshop/lib/profileCompleteness.ts");
const profileCompletenessSrc = fs.readFileSync(profileCompletenessPath, "utf8");

assert(
  profileCompletenessSrc.includes("if (!profile) return null;"),
  "computeProfileCompleteness must return null when profile is undefined or null",
);
assert(
  !profileCompletenessSrc.includes("if (!profile) return 0;"),
  "computeProfileCompleteness must NOT return 0 when profile is undefined or null",
);
assert(
  workshopDashboardSrc.includes("profileCompleteness === null"),
  "WorkshopDashboardPage must check profileCompleteness === null before formatting",
);

// Functional test of computeProfileCompleteness
const { computeProfileCompleteness } = transpileAndLoad(
  "src/modules/workshop/lib/profileCompleteness.ts",
);
assert.strictEqual(
  computeProfileCompleteness(undefined),
  null,
  "Undefined profile must return null",
);
assert.strictEqual(computeProfileCompleteness(null), null, "Null profile must return null");

const emptyProfile = {
  bannerUrl: null,
  photos: [],
  workingHours: {
    sat: { isClosed: false, open: "", close: "" },
    sun: { isClosed: false, open: "", close: "" },
    mon: { isClosed: false, open: "", close: "" },
    tue: { isClosed: false, open: "", close: "" },
    wed: { isClosed: false, open: "", close: "" },
    thu: { isClosed: false, open: "", close: "" },
    fri: { isClosed: false, open: "", close: "" },
  },
  location: null,
  specializations: { serviceTypes: [], vehicleBrands: [] },
  contact: { phone: "" },
};
assert.strictEqual(
  computeProfileCompleteness(emptyProfile),
  0,
  "Empty profile must compute 0%, distinct from null",
);
console.log(
  "PASS 5: Profile completeness correctly distinguishes missing profile (null -> '—') from true 0%",
);

// ── Check 6: Scrap requests KPI semantics (kpiTotalRequests) ─────────────────
assert(
  !scrapDashboardSrc.includes("scrap.dashboard.kpiOpenRequests"),
  "ScrapDashboardPage must NOT label unfiltered total as kpiOpenRequests",
);
assert(
  scrapDashboardSrc.includes("scrap.dashboard.kpiTotalRequests"),
  "ScrapDashboardPage must label the unfiltered orders query total as kpiTotalRequests",
);

const i18nPath = path.join(root, "src/app/i18n.ts");
const i18nSrc = fs.readFileSync(i18nPath, "utf8");
assert(
  i18nSrc.includes('kpiTotalRequests: "إجمالي الطلبات"'),
  "Arabic i18n must define kpiTotalRequests as 'إجمالي الطلبات'",
);
assert(
  i18nSrc.includes('kpiTotalRequests: "Total Requests"'),
  "English i18n must define kpiTotalRequests as 'Total Requests'",
);
console.log("PASS 6: Scrap requests KPI uses accurate 'Total Requests' semantics in code and i18n");

// ── Check 7: Query failures use read-error wording ────────────────────────────
assert(
  !scrapDashboardSrc.includes("common.saveFailed"),
  "ScrapDashboardPage must not show common.saveFailed for query fetch failure",
);
assert(
  scrapDashboardSrc.includes("scrap.partRequests.errorTitle"),
  "ScrapDashboardPage must show scrap.partRequests.errorTitle on fetch failure",
);
console.log("PASS 7: Query failures render load-error message, not mutation save-failed");

// ── Check 8: Mock mode configuration unchanged ────────────────────────────────
const mockModePath = path.join(root, "src/shared/config/mockMode.ts");
const mockModeSrc = fs.readFileSync(mockModePath, "utf8");
assert(mockModeSrc.includes("resolveMockMode"), "mockMode.ts must preserve resolveMockMode");
assert(mockModeSrc.includes("mockModeEnabled"), "mockMode.ts must preserve mockModeEnabled");
console.log("PASS 8: Mock mode configuration remains intact and unchanged");

// ── Check 9: PartRequestPreviewRow contract ───────────────────────────────────
const previewRowPath = path.join(
  root,
  "src/modules/scrap/components/dashboard/PartRequestPreviewRow.tsx",
);
const previewRowSrc = fs.readFileSync(previewRowPath, "utf8");

assert(
  previewRowSrc.includes("request: SalvageOrder"),
  "PartRequestPreviewRow must accept SalvageOrder",
);
assert(
  !previewRowSrc.includes("useEscrowQuery"),
  "PartRequestPreviewRow must not call mock useEscrowQuery",
);
assert(
  !previewRowSrc.includes("customerPhoneMasked"),
  "PartRequestPreviewRow must not use mock customerPhoneMasked",
);
assert(
  previewRowSrc.includes("salvageOrderStatusI18nKey"),
  "PartRequestPreviewRow must use salvageOrderStatusI18nKey",
);
assert(
  previewRowSrc.includes("/provider/scrap/part-requests/${request.id}"),
  "PartRequestPreviewRow must link to live part-requests detail route",
);
console.log("PASS 9: PartRequestPreviewRow complies with live SalvageOrder contract");

// ── Check 10: Workshop dashboard hero subtitle ────────────────────────────────
assert(
  workshopDashboardSrc.includes("workshop.dashboard.subtitle"),
  "WorkshopDashboardPage must use workshop.dashboard.subtitle to avoid title duplication",
);
assert(
  i18nSrc.includes('subtitle: "متابعة أداء الورشة وإدارة الملف والمحادثات"'),
  "Arabic i18n must define workshop.dashboard.subtitle",
);
assert(
  i18nSrc.includes('subtitle: "Overview of workshop performance, profile, and conversations"'),
  "English i18n must define workshop.dashboard.subtitle",
);
console.log("PASS 10: Workshop hero has dedicated bilingual subtitle preventing title repetition");

console.log("\n========================================================");
console.log("ALL 10 PROVIDER DASHBOARD RESILIENCE CHECKS PASSED (PASS)");
console.log("========================================================");
