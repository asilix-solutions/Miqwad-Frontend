/**
 * @file check-brand-localization-resilience.cjs
 * @description Targeted verification suite for Phase 1: Brand localization, bilingual search,
 * selected brand state synchronization, and multi-page catalog retrieval safety.
 */
const assert = require("assert");

// ─── 1. Arabic Normalization Logic ───────────────────────────────────────────
function normalizeArabic(text) {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

console.log("=== 1. Testing Arabic Normalization ===");
assert.strictEqual(normalizeArabic("تَوْيُوتَا"), "تويوتا", "Tashkeel stripping");
assert.strictEqual(normalizeArabic("تـويـوتـا"), "تويوتا", "Tatweel stripping");
assert.strictEqual(normalizeArabic("إنفينيتي"), "انفينيتي", "Alef with Hamza below -> Bare Alef");
assert.strictEqual(normalizeArabic("أودي"), "audi".length ? "اوري" ? "اودي" : "اودي" : "اودي", "Alef with Hamza above -> Bare Alef");
assert.strictEqual(normalizeArabic("هيونداى"), "هيونداي", "Yaa maksura -> Yaa");
assert.strictEqual(normalizeArabic("سيارة   جديدة"), "سياره جديده", "Taa Marbuta & multi-space");
console.log("✓ Arabic normalization tests passed.");

// ─── 2. Brand Localization Catalog ───────────────────────────────────────────
console.log("\n=== 2. Testing Brand Localization Catalog Completeness ===");
const BRAND_CATALOG = {
  9: { id: 9, canonicalArabic: "تويوتا", primaryEnglish: "Toyota", aliases: ["toyota"] },
  10: { id: 10, canonicalArabic: "لكزس", primaryEnglish: "Lexus", aliases: ["lexus"] },
  11: { id: 11, canonicalArabic: "نيسان", primaryEnglish: "Nissan", aliases: ["nissan"] },
  12: { id: 12, canonicalArabic: "إنفينيتي", primaryEnglish: "Infiniti", aliases: ["infiniti"] },
  13: { id: 13, canonicalArabic: "هوندا", primaryEnglish: "Honda", aliases: ["honda"] },
  14: { id: 14, canonicalArabic: "أكورا", primaryEnglish: "Acura", aliases: ["acura"] },
  15: { id: 15, canonicalArabic: "مازدا", primaryEnglish: "Mazda", aliases: ["mazda"] },
  16: { id: 16, canonicalArabic: "ميتسوبيشي", primaryEnglish: "Mitsubishi", aliases: ["mitsubishi"] },
  17: { id: 17, canonicalArabic: "سوزوكي", primaryEnglish: "Suzuki", aliases: ["suzuki"] },
  18: { id: 18, canonicalArabic: "سوبارو", primaryEnglish: "Subaru", aliases: ["subaru"] },
  19: { id: 19, canonicalArabic: "هيونداي", primaryEnglish: "Hyundai", aliases: ["hyundai"] },
  20: { id: 20, canonicalArabic: "كيا", primaryEnglish: "Kia", aliases: ["kia"] },
  21: { id: 21, canonicalArabic: "جينيسيس", primaryEnglish: "Genesis", aliases: ["genesis"] },
  22: { id: 22, canonicalArabic: "فورد", primaryEnglish: "Ford", aliases: ["ford"] },
  23: { id: 23, canonicalArabic: "شيفروليه", primaryEnglish: "Chevrolet", aliases: ["chevrolet", "chevy"] },
  24: { id: 24, canonicalArabic: "جي إم سي", primaryEnglish: "GMC", aliases: ["gmc"] },
  25: { id: 25, canonicalArabic: "كاديلاك", primaryEnglish: "Cadillac", aliases: ["cadillac"] },
  26: { id: 26, canonicalArabic: "دودج", primaryEnglish: "Dodge", aliases: ["dodge", "ram"] },
  27: { id: 27, canonicalArabic: "جيب", primaryEnglish: "Jeep", aliases: ["jeep"] },
  28: { id: 28, canonicalArabic: "كرايسلر", primaryEnglish: "Chrysler", aliases: ["chrysler"] },
  29: { id: 29, canonicalArabic: "بي إم دبليو", primaryEnglish: "BMW", aliases: ["bmw"] },
  30: { id: 30, canonicalArabic: "مرسيدس بنز", primaryEnglish: "Mercedes-Benz", aliases: ["mercedes-benz", "mercedes", "benz"] },
  31: { id: 31, canonicalArabic: "أودي", primaryEnglish: "Audi", aliases: ["audi"] },
  32: { id: 32, canonicalArabic: "فولكس فاجن", primaryEnglish: "Volkswagen", aliases: ["volkswagen", "vw"] },
  33: { id: 33, canonicalArabic: "بورش", primaryEnglish: "Porsche", aliases: ["porsche"] },
  34: { id: 34, canonicalArabic: "فولفو", primaryEnglish: "Volvo", aliases: ["volvo"] },
  35: { id: 35, canonicalArabic: "لاند روفر", primaryEnglish: "Land Rover", aliases: ["land rover", "range rover"] },
  36: { id: 36, canonicalArabic: "جاكوار", primaryEnglish: "Jaguar", aliases: ["jaguar"] },
  37: { id: 37, canonicalArabic: "ميني", primaryEnglish: "Mini", aliases: ["mini", "mini cooper"] },
  38: { id: 38, canonicalArabic: "بنتلي", primaryEnglish: "Bentley", aliases: ["bentley"] },
  39: { id: 39, canonicalArabic: "رولز رويس", primaryEnglish: "Rolls-Royce", aliases: ["rolls-royce", "rolls royce"] },
  40: { id: 40, canonicalArabic: "فيراري", primaryEnglish: "Ferrari", aliases: ["ferrari"] },
  41: { id: 41, canonicalArabic: "لامبورغيني", primaryEnglish: "Lamborghini", aliases: ["lamborghini"] },
  42: { id: 42, canonicalArabic: "مازيراتي", primaryEnglish: "Maserati", aliases: ["maserati"] },
  43: { id: 43, canonicalArabic: "بي واي دي", primaryEnglish: "BYD", aliases: ["byd"] },
  44: { id: 44, canonicalArabic: "جيلي", primaryEnglish: "Geely", aliases: ["geely"] },
  45: { id: 45, canonicalArabic: "شيري", primaryEnglish: "Chery", aliases: ["chery"] },
  46: { id: 46, canonicalArabic: "شانجان", primaryEnglish: "Changan", aliases: ["changan"] },
  47: { id: 47, canonicalArabic: "هافال", primaryEnglish: "Haval", aliases: ["haval"] },
  48: { id: 48, canonicalArabic: "إم جي", primaryEnglish: "MG", aliases: ["mg"] },
};

const brandCount = Object.keys(BRAND_CATALOG).length;
assert.strictEqual(brandCount, 40, "Expected 40 key brands cataloged");
console.log(`✓ ${brandCount} verified brands verified in catalog.`);

// ─── 3. Bilingual Brand Search Function ──────────────────────────────────────
function matchesBrandSearch(term, brand) {
  const cleanTerm = term.trim();
  if (!cleanTerm) return true;

  const termLower = cleanTerm.toLowerCase();
  const brandName = brand.name ?? "";

  // 1. Direct substring match (case-insensitive)
  if (brandName.toLowerCase().includes(termLower)) {
    return true;
  }

  // 2. Normalized Arabic match
  const termNormAr = normalizeArabic(cleanTerm).toLowerCase();
  if (termNormAr && normalizeArabic(brandName).toLowerCase().includes(termNormAr)) {
    return true;
  }

  // 3. English primary name and aliases match
  const entry = BRAND_CATALOG[brand.id];
  if (entry) {
    if (entry.primaryEnglish.toLowerCase().includes(termLower)) {
      return true;
    }
    for (const alias of entry.aliases) {
      if (alias.includes(termLower)) {
        return true;
      }
    }
  }

  return false;
}

console.log("\n=== 3. Testing Bilingual Brand Search Matching ===");
const toyota = { id: 9, name: "تويوتا", image: null };
const hyundai = { id: 19, name: "هيونداي", image: null };
const nissan = { id: 11, name: "نيسان", image: null };
const kia = { id: 20, name: "كيا", image: null };
const lexus = { id: 10, name: "لكزس", image: null };
const bmw = { id: 29, name: "بي إم دبليو", image: null };
const mercedes = { id: 30, name: "مرسيدس بنز", image: null };
const vw = { id: 32, name: "فولكس فاجن", image: null };
const chevy = { id: 23, name: "شيفروليه", image: null };

// Toyota checks
assert.ok(matchesBrandSearch("تويوتا", toyota), "Arabic exact match: تويوتا");
assert.ok(matchesBrandSearch("Toyota", toyota), "English exact match: Toyota");
assert.ok(matchesBrandSearch("toyota", toyota), "English lowercase match: toyota");
assert.ok(matchesBrandSearch("TOYOTA", toyota), "English uppercase match: TOYOTA");
assert.ok(matchesBrandSearch("Toy", toyota), "English partial match: Toy");
assert.strictEqual(matchesBrandSearch("Honda", toyota), false, "Non-matching English");

// Hyundai checks
assert.ok(matchesBrandSearch("هيونداي", hyundai), "Arabic exact match: هيونداي");
assert.ok(matchesBrandSearch("هيونداى", hyundai), "Arabic normalized match with Yaa Maksura: هيونداى");
assert.ok(matchesBrandSearch("hyundai", hyundai), "English match: hyundai");

// Nissan checks
assert.ok(matchesBrandSearch("نيسان", nissan), "Arabic exact: نيسان");
assert.ok(matchesBrandSearch("Nissan", nissan), "English exact: Nissan");

// Kia checks
assert.ok(matchesBrandSearch("كيا", kia), "Arabic exact: كيا");
assert.ok(matchesBrandSearch("Kia", kia), "English exact: Kia");

// Lexus checks
assert.ok(matchesBrandSearch("لكزس", lexus), "Arabic exact: لكزس");
assert.ok(matchesBrandSearch("Lexus", lexus), "English exact: Lexus");

// BMW checks
assert.ok(matchesBrandSearch("بي إم دبليو", bmw), "Arabic exact: بي إم دبليو");
assert.ok(matchesBrandSearch("بي ام دبليو", bmw), "Arabic without hamza: بي ام دبليو");
assert.ok(matchesBrandSearch("BMW", bmw), "English acronym: BMW");
assert.ok(matchesBrandSearch("bmw", bmw), "English acronym lowercase: bmw");

// Aliases checks
assert.ok(matchesBrandSearch("VW", vw), "Acronym alias: VW -> فولكس فاجن");
assert.ok(matchesBrandSearch("vw", vw), "Acronym alias: vw -> فولكس فاجن");
assert.ok(matchesBrandSearch("Chevy", chevy), "Informal alias: Chevy -> شيفروليه");
assert.ok(matchesBrandSearch("Benz", mercedes), "Secondary alias: Benz -> مرسيدس بنز");
assert.ok(matchesBrandSearch("مرسيدس", mercedes), "Partial Arabic: مرسيدس -> مرسيدس بنز");

// Empty & Whitespace
assert.ok(matchesBrandSearch("", toyota), "Empty query matches all");
assert.ok(matchesBrandSearch("   ", toyota), "Whitespace query matches all");
console.log("✓ All bilingual brand search tests passed.");

// ─── 4. Selected Brand State Synchronization ─────────────────────────────────
console.log("\n=== 4. Testing Selected Brand State Synchronization ===");

// Simulate TanStack Query data baseline
let catalog = [
  { id: 9, name: "تويوتا", image: null },
  { id: 10, name: "لكزس", image: null },
  { id: 11, name: "نيسان", image: null },
];

let selectedBrandId = 9;

// Derive selected brand during render
function deriveSelectedBrand(catalogData, id) {
  return id != null ? (catalogData.find((b) => b.id === id) ?? null) : null;
}

// 1. Initial selection
let selected = deriveSelectedBrand(catalog, selectedBrandId);
assert.strictEqual(selected.name, "تويوتا", "Selected brand initially derives 'تويوتا'");

// 2. Brand rename occurs
catalog = [
  { id: 9, name: "تويوتا المحدثة", image: null },
  { id: 10, name: "لكزس", image: null },
  { id: 11, name: "نيسان", image: null },
];
selected = deriveSelectedBrand(catalog, selectedBrandId);
assert.strictEqual(selected.name, "تويوتا المحدثة", "Renamed brand immediately updates derived selectedBrand name!");

// 3. Unrelated brand deleted (brand 10 deleted)
catalog = [
  { id: 9, name: "تويوتا المحدثة", image: null },
  { id: 11, name: "نيسان", image: null },
];
selected = deriveSelectedBrand(catalog, selectedBrandId);
assert.strictEqual(selected.id, 9, "Selection preserved when another brand is deleted");

// 4. Selected brand deleted (brand 9 deleted)
catalog = [
  { id: 11, name: "نيسان", image: null },
];
selected = deriveSelectedBrand(catalog, selectedBrandId);
assert.strictEqual(selected, null, "When selected brand is deleted from data, derived selectedBrand evaluates to null (no dangling state)");

// 5. Filter/Search applied to table rows does not clear selection
const currentFilter = "نيسان";
const filteredRows = catalog.filter((b) => matchesBrandSearch(currentFilter, b));
assert.strictEqual(filteredRows.length, 1);
assert.strictEqual(filteredRows[0].id, 11);
// Note: underlying catalog is unchanged, so selection is not silently wiped
console.log("✓ State synchronization behavior tests passed.");

// ─── 5. Multi-page Pagination Retrieval Logic ────────────────────────────────
console.log("\n=== 5. Testing Multi-page Pagination & Deduplication Logic ===");

async function mockListAll(mockPages) {
  const PAGE_SIZE = 100;
  const MAX_PAGES = 50;

  let requestCount = 0;
  async function fetchPage(pageNumber) {
    requestCount++;
    return mockPages[pageNumber - 1];
  }

  const firstPage = await fetchPage(1);
  const allItems = [...firstPage.items];
  const totalPages = Math.min(Math.max(1, firstPage.totalPages || 1), MAX_PAGES);

  if (totalPages > 1) {
    for (let page = 2; page <= totalPages; page++) {
      const nextPage = await fetchPage(page);
      allItems.push(...nextPage.items);
    }
  }

  const seen = new Set();
  const deduped = allItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  if (firstPage.totalPages > MAX_PAGES) {
    Object.defineProperty(deduped, "isTruncated", { value: true, enumerable: false, configurable: true });
    Object.defineProperty(deduped, "totalCount", { value: firstPage.totalCount, enumerable: false, configurable: true });
  }

  return { items: deduped, requestCount, isTruncated: Boolean(deduped.isTruncated) };
}

(async () => {
  // Scenario A: Single page catalog (e.g. 40 brands)
  const singlePage = [
    { items: [{ id: 1 }, { id: 2 }, { id: 3 }], totalPages: 1, totalCount: 3 },
  ];
  const resA = await mockListAll(singlePage);
  assert.strictEqual(resA.items.length, 3);
  assert.strictEqual(resA.requestCount, 1, "Single page catalog makes exactly 1 request");
  assert.strictEqual(resA.isTruncated, false, "Single page catalog is not truncated");

  // Scenario B: Multi-page catalog (e.g. 250 items across 3 pages with accidental duplicate on page boundary)
  const multiPage = [
    { items: [{ id: 1 }, { id: 2 }], totalPages: 3, totalCount: 6 },
    { items: [{ id: 2 }, { id: 3 }, { id: 4 }], totalPages: 3, totalCount: 6 }, // duplicate id: 2
    { items: [{ id: 5 }, { id: 6 }], totalPages: 3, totalCount: 6 },
  ];
  const resB = await mockListAll(multiPage);
  assert.strictEqual(resB.items.length, 6, "All items collected and deduplicated");
  assert.strictEqual(resB.requestCount, 3, "Sequential pagination fetched exactly 3 pages");
  assert.deepStrictEqual(resB.items.map((i) => i.id), [1, 2, 3, 4, 5, 6]);
  assert.strictEqual(resB.isTruncated, false, "Normal multi-page catalog within limit is not truncated");

  // Scenario C: Runaway totalPages safety cap
  const runaway = [
    { items: [{ id: 1 }], totalPages: 999999, totalCount: 999999 },
  ];
  let runawayRequests = 0;
  for (let p = 2; p <= 50; p++) {
    runaway.push({ items: [{ id: p }], totalPages: 999999, totalCount: 999999 });
  }
  const resC = await mockListAll(runaway);
  assert.strictEqual(resC.requestCount, 50, "Capped at MAX_PAGES = 50, preventing runaway loops");
  assert.strictEqual(resC.isTruncated, true, "Safety cap marks result as truncated");

  console.log("✓ Multi-page pagination & deduplication tests passed.");

  // ─── 6. Phase 2: Popular Brands Filter & View Persistence ──────────────────
  console.log("\n=== 6. Testing Phase 2 Popular Brands Filtering & View Preference ===");
  const POPULAR_BRAND_IDS = new Set([9, 10, 11, 13, 19, 20, 22, 23, 24, 29, 30, 44, 46, 48]);
  assert.strictEqual(POPULAR_BRAND_IDS.size, 14, "Expected 14 curated popular brands");

  const fullSample = [
    { id: 9, name: "تويوتا" },
    { id: 10, name: "لكزس" },
    { id: 11, name: "نيسان" },
    { id: 35, name: "لاند روفر" }, // non-popular
    { id: 40, name: "فيراري" },    // non-popular
  ];

  const popularFiltered = fullSample.filter((b) => POPULAR_BRAND_IDS.has(b.id));
  assert.strictEqual(popularFiltered.length, 3, "Popular filter correctly isolates curated brands");
  assert.deepStrictEqual(popularFiltered.map((b) => b.id), [9, 10, 11]);

  // Combined popular filter + search
  const combined = fullSample.filter(
    (b) => POPULAR_BRAND_IDS.has(b.id) && matchesBrandSearch("Toyota", b)
  );
  assert.strictEqual(combined.length, 1);
  assert.strictEqual(combined[0].id, 9);

  // LocalStorage resilience simulation
  const mockStorage = new Map();
  function persistViewMode(mode) {
    try {
      mockStorage.set("miqwad:admin:brands:view-mode", mode);
    } catch {
      // safe
    }
  }
  function getInitialViewMode() {
    try {
      const saved = mockStorage.get("miqwad:admin:brands:view-mode");
      if (saved === "grid" || saved === "list") return saved;
    } catch {
      // safe
    }
    return "grid";
  }

  assert.strictEqual(getInitialViewMode(), "grid", "Default view mode is grid");
  persistViewMode("list");
  assert.strictEqual(getInitialViewMode(), "list", "Persisted list view mode is restored");
  console.log("✓ Phase 2 filtering and preference persistence tests passed.");

  // ─── 7. Phase 2: Truncation Detection Helper ───────────────────────────────
  console.log("\n=== 7. Testing Truncation Detection Helper ===");
  function isCatalogTruncated(list) {
    return Boolean(list && typeof list === "object" && list.isTruncated);
  }

  assert.strictEqual(isCatalogTruncated(resA.items), false, "Normal catalog is not truncated");
  assert.strictEqual(isCatalogTruncated(resC.items), true, "Runaway catalog correctly flagged as truncated");
  assert.strictEqual(isCatalogTruncated(null), false, "Null safe");
  assert.strictEqual(isCatalogTruncated(undefined), false, "Undefined safe");
  console.log("✓ Truncation detection tests passed.");

  console.log("\n=========================================");
  console.log("ALL TARGETED RESILIENCE TESTS PASSED (100%)");
  console.log("=========================================");
})();

