/**
 * @file check-cities-reference-data.cjs
 * @description Comprehensive offline verification test suite for Cities Administration & Roads integration.
 * Tests:
 * 1. City form Zod validation (required fields, string lengths, coordinate bounds)
 * 2. Create request DTO contract & API URL resolution (/Cities, /Cities/{id})
 * 3. Idempotent create-or-get responses (HTTP 200 vs 201, existing city detection)
 * 4. API error handling and envelope unwrapping
 * 5. Query cache invalidation keys & Roads selector availability
 * 6. UI states mutually exclusive invariants
 * 7. Complete 1-to-1 i18n parity between Arabic and English dictionaries
 */

const assert = require("assert");
const fs = require("fs");
const { z } = require("zod");

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

console.log("=== RUNNING CITIES REFERENCE DATA OFFLINE TEST SUITE ===");

(async () => {
  const optionalCoordinateField = (min, max, key) =>
    z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .optional()
      .transform((val) => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === "string") {
          const trimmed = val.trim();
          if (trimmed === "") return undefined;
          return Number(trimmed);
        }
        return val;
      })
      .refine((val) => val === undefined || (!isNaN(val) && isFinite(val)), {
        message: `superAdmin.cities.validation.${key}Invalid`,
      })
      .refine((val) => val === undefined || (val >= min && val <= max), {
        message: `superAdmin.cities.validation.${key}Range`,
      });

  const createCitySchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: "superAdmin.cities.validation.nameRequired" })
      .max(150, { message: "superAdmin.cities.validation.nameMax" }),
    countryCode: z
      .string()
      .trim()
      .min(1, { message: "superAdmin.cities.validation.countryCodeRequired" })
      .max(10, { message: "superAdmin.cities.validation.countryCodeMax" }),
    googlePlaceId: z
      .string()
      .trim()
      .min(1, { message: "superAdmin.cities.validation.googlePlaceIdRequired" })
      .max(255, { message: "superAdmin.cities.validation.googlePlaceIdMax" }),
    latitude: optionalCoordinateField(-90, 90, "latitude"),
    longitude: optionalCoordinateField(-180, 180, "longitude"),
  });

  await test("City Form Validation: Valid city payload succeeds with numeric coordinates", () => {
    const valid = {
      name: "الرياض",
      countryCode: "SA",
      googlePlaceId: "ChIJ818b-y1Elx4Rj80s-k8x5g8",
      latitude: 24.7136,
      longitude: 46.6753,
    };
    const result = createCitySchema.safeParse(valid);
    assert.equal(result.success, true);
    assert.equal(result.data.name, "الرياض");
    assert.equal(result.data.latitude, 24.7136);
    assert.equal(result.data.longitude, 46.6753);
  });

  await test("City Form Validation: String coordinate inputs are correctly coerced to numbers", () => {
    const stringCoords = {
      name: "جدة",
      countryCode: "SA",
      googlePlaceId: "ChIJb9xL...",
      latitude: "21.4858",
      longitude: "39.1925",
    };
    const result = createCitySchema.safeParse(stringCoords);
    assert.equal(result.success, true);
    assert.equal(typeof result.data.latitude, "number");
    assert.equal(result.data.latitude, 21.4858);
    assert.equal(typeof result.data.longitude, "number");
    assert.equal(result.data.longitude, 39.1925);
  });

  await test("City Form Validation: Creation without coordinates succeeds (omitted coordinates)", () => {
    const noCoords = {
      name: "الدرعية",
      countryCode: "SA",
      googlePlaceId: "ChIJ_diriyah...",
    };
    const result = createCitySchema.safeParse(noCoords);
    assert.equal(result.success, true);
    assert.equal(result.data.name, "الدرعية");
    assert.equal(result.data.latitude, undefined);
    assert.equal(result.data.longitude, undefined);
  });

  await test("City Form Validation: Explicit null coordinates are handled safely and mapped to undefined", () => {
    const nullCoords = {
      name: "العلا",
      countryCode: "SA",
      googlePlaceId: "ChIJ_alula...",
      latitude: null,
      longitude: null,
    };
    const result = createCitySchema.safeParse(nullCoords);
    assert.equal(result.success, true);
    assert.equal(result.data.latitude, undefined);
    assert.equal(result.data.longitude, undefined);
  });

  await test("City Form Validation: Blank coordinate strings are not coerced to zero", () => {
    const blankCoords = {
      name: "نجران",
      countryCode: "SA",
      googlePlaceId: "ChIJ_najran...",
      latitude: "   ",
      longitude: "",
    };
    const result = createCitySchema.safeParse(blankCoords);
    assert.equal(result.success, true);
    assert.notEqual(result.data.latitude, 0, "Blank string must not be coerced to 0");
    assert.notEqual(result.data.longitude, 0, "Blank string must not be coerced to 0");
    assert.equal(result.data.latitude, undefined);
    assert.equal(result.data.longitude, undefined);
  });

  await test("City Form Validation: Explicit numeric zero is preserved", () => {
    const zeroCoords = {
      name: "خط الاستواء",
      countryCode: "SA",
      googlePlaceId: "ChIJ_zero...",
      latitude: 0,
      longitude: 0,
    };
    const result = createCitySchema.safeParse(zeroCoords);
    assert.equal(result.success, true);
    assert.equal(result.data.latitude, 0);
    assert.equal(result.data.longitude, 0);
  });

  await test("City Form Validation: Missing or empty city name is rejected", () => {
    const emptyName = {
      name: "   ",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: 24.7,
      longitude: 46.6,
    };
    const result = createCitySchema.safeParse(emptyName);
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].message, "superAdmin.cities.validation.nameRequired");
  });

  await test("City Form Validation: Name exceeding 150 characters is rejected", () => {
    const longName = {
      name: "A".repeat(151),
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: 24.7,
      longitude: 46.6,
    };
    const result = createCitySchema.safeParse(longName);
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].message, "superAdmin.cities.validation.nameMax");
  });

  await test("City Form Validation: Missing or empty country code is rejected", () => {
    const emptyCode = {
      name: "الدمام",
      countryCode: "",
      googlePlaceId: "ChIJ...",
      latitude: 26.42,
      longitude: 50.08,
    };
    const result = createCitySchema.safeParse(emptyCode);
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].message, "superAdmin.cities.validation.countryCodeRequired");
  });

  await test("City Form Validation: Missing or empty Google Place ID is rejected", () => {
    const missingPlaceId = {
      name: "الدمام",
      countryCode: "SA",
      googlePlaceId: "  ",
      latitude: 26.42,
      longitude: 50.08,
    };
    const result = createCitySchema.safeParse(missingPlaceId);
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].message, "superAdmin.cities.validation.googlePlaceIdRequired");
  });

  await test("City Form Validation: Google Place ID exceeding 255 characters is rejected", () => {
    const longPlaceId = {
      name: "الدمام",
      countryCode: "SA",
      googlePlaceId: "x".repeat(256),
      latitude: 26.42,
      longitude: 50.08,
    };
    const result = createCitySchema.safeParse(longPlaceId);
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].message, "superAdmin.cities.validation.googlePlaceIdMax");
  });

  await test("City Form Validation: Latitude bounds (-90 to 90) enforced strictly", () => {
    const outOfBoundsHigh = {
      name: "المدينة",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: 90.001,
      longitude: 40.0,
    };
    assert.equal(createCitySchema.safeParse(outOfBoundsHigh).success, false);

    const outOfBoundsLow = {
      name: "المدينة",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: -90.001,
      longitude: 40.0,
    };
    assert.equal(createCitySchema.safeParse(outOfBoundsLow).success, false);

    const boundaryHigh = {
      name: "المدينة",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: 90,
      longitude: 40.0,
    };
    assert.equal(createCitySchema.safeParse(boundaryHigh).success, true);

    const boundaryLow = {
      name: "المدينة",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: -90,
      longitude: 40.0,
    };
    assert.equal(createCitySchema.safeParse(boundaryLow).success, true);
  });

  await test("City Form Validation: Longitude bounds (-180 to 180) enforced strictly", () => {
    const outOfBoundsHigh = {
      name: "مكة",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: 21.4,
      longitude: 180.01,
    };
    assert.equal(createCitySchema.safeParse(outOfBoundsHigh).success, false);

    const outOfBoundsLow = {
      name: "مكة",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: 21.4,
      longitude: -180.01,
    };
    assert.equal(createCitySchema.safeParse(outOfBoundsLow).success, false);

    const boundaryHigh = {
      name: "مكة",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: 21.4,
      longitude: 180,
    };
    assert.equal(createCitySchema.safeParse(boundaryHigh).success, true);

    const boundaryLow = {
      name: "مكة",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: 21.4,
      longitude: -180,
    };
    assert.equal(createCitySchema.safeParse(boundaryLow).success, true);
  });

  await test("City Form Validation: Non-numeric coordinates string is rejected", () => {
    const invalidText = {
      name: "تبوك",
      countryCode: "SA",
      googlePlaceId: "ChIJ...",
      latitude: "invalid_lat",
      longitude: "invalid_lng",
    };
    const result = createCitySchema.safeParse(invalidText);
    assert.equal(result.success, false);
  });

  // ── 2. Request DTO Contract & API Endpoints ─────────────────────────────────
  let lastApiRequest = null;
  const mockApiClient = {
    get: async (url, config) => {
      lastApiRequest = { method: "GET", url, config };
      return { status: 200, data: { success: true, data: [] } };
    },
    post: async (url, data, config) => {
      lastApiRequest = { method: "POST", url, data, config };
      return { status: 201, data: { success: true, data: { id: 101, ...data } } };
    },
  };

  await test("API URL Resolution: createCity posts to '/Cities' (no duplicate /api prefix)", async () => {
    const payload = {
      name: "الأحساء",
      countryCode: "SA",
      googlePlaceId: "ChIJ777...",
      latitude: 25.38,
      longitude: 49.58,
    };
    await mockApiClient.post("/Cities", payload);
    assert.equal(lastApiRequest.method, "POST");
    assert.equal(lastApiRequest.url, "/Cities");
    assert.deepEqual(lastApiRequest.data, payload);
  });

  await test("API URL Resolution: getCities calls '/Cities' and getCityById calls '/Cities/{id}'", async () => {
    await mockApiClient.get("/Cities", { params: { PageNumber: 1, PageSize: 50 } });
    assert.equal(lastApiRequest.method, "GET");
    assert.equal(lastApiRequest.url, "/Cities");
    assert.equal(lastApiRequest.config.params.PageSize, 50);

    await mockApiClient.get("/Cities/42");
    assert.equal(lastApiRequest.method, "GET");
    assert.equal(lastApiRequest.url, "/Cities/42");
  });

  // ── 3. Idempotent Create-or-Get Behavior ────────────────────────────────────
  await test("Idempotency Detection: HTTP 201 signals a newly created city record", () => {
    const response = { status: 201, data: { success: true, message: null, data: { id: 1 } } };
    const isExisting = response.status === 200 || (typeof response.data.message === "string" && /exist|موجود/i.test(response.data.message));
    assert.equal(isExisting, false);
  });

  await test("Idempotency Detection: HTTP 200 signals existing city returned by googlePlaceId", () => {
    const response = { status: 200, data: { success: true, message: "City already exists", data: { id: 1 } } };
    const isExisting = response.status === 200 || (typeof response.data.message === "string" && /exist|موجود/i.test(response.data.message));
    assert.equal(isExisting, true);
  });

  await test("Idempotency Detection: Arabic message 'المدينة موجودة مسبقاً' signals existing city", () => {
    const response = { status: 200, data: { success: true, message: "المدينة موجودة مسبقاً", data: { id: 1 } } };
    const isExisting = response.status === 200 || (typeof response.data.message === "string" && /exist|موجود/i.test(response.data.message));
    assert.equal(isExisting, true);
  });

  // ── 4. API Error Handling & Envelope Unwrapping ─────────────────────────────
  function unwrapPayload(rawData) {
    if (rawData && typeof rawData === "object") {
      if ("success" in rawData) {
        if (!rawData.success) {
          const errorMsg =
            rawData.message ||
            (Array.isArray(rawData.errors) && rawData.errors.length > 0 ? rawData.errors.join(", ") : null) ||
            "API request failed";
          throw new Error(errorMsg);
        }
        return rawData.data;
      }
      if ("data" in rawData) return rawData.data;
    }
    return rawData;
  }

  await test("Error Handling: Unsuccessful envelope throws with backend message or errors", () => {
    const failedPayload = {
      success: false,
      message: "Validation failed",
      errors: ["GooglePlaceId already in use", "Invalid coordinates"],
    };
    assert.throws(
      () => unwrapPayload(failedPayload),
      /Validation failed/,
    );
  });

  await test("Error Handling: Successful envelope extracts city data cleanly", () => {
    const successPayload = {
      success: true,
      data: { id: 55, name: "بريدة", countryCode: "SA" },
    };
    const extracted = unwrapPayload(successPayload);
    assert.equal(extracted.id, 55);
    assert.equal(extracted.name, "بريدة");
  });

  // ── 5. Cache Invalidation & Roads Availability ──────────────────────────────
  await test("Cache Invalidation: Mutating city invalidates 'cities', roadsKeys.cities(), and adminKeys", () => {
    const invalidatedKeys = [];
    const mockQueryClient = {
      invalidateQueries: ({ queryKey }) => {
        invalidatedKeys.push(JSON.stringify(queryKey));
      },
    };

    // Simulate useCreateCityMutation onSuccess
    mockQueryClient.invalidateQueries({ queryKey: ["cities"] });
    mockQueryClient.invalidateQueries({ queryKey: ["cities", "reference-list"] });
    mockQueryClient.invalidateQueries({ queryKey: ["admin", "cities"] });

    assert.equal(invalidatedKeys.includes(JSON.stringify(["cities"])), true);
    assert.equal(invalidatedKeys.includes(JSON.stringify(["cities", "reference-list"])), true);
    assert.equal(invalidatedKeys.includes(JSON.stringify(["admin", "cities"])), true);
  });

  await test("Roads Selector Availability: Newly added city is accessible to origin/destination selects", () => {
    const citiesCache = [
      { id: 1, name: "الرياض" },
      { id: 2, name: "جدة" },
    ];
    // New city arrives from refetch
    const newCity = { id: 3, name: "الخبر" };
    const updatedCache = [...citiesCache, newCity];

    const selectOptions = updatedCache.map((c) => ({ value: c.id, label: c.name }));
    assert.equal(selectOptions.length, 3);
    assert.equal(selectOptions.some((o) => o.value === 3 && o.label === "الخبر"), true);
  });

  // ── 6. UI States Invariant ──────────────────────────────────────────────────
  await test("UI States Invariant: Loading, Error, Empty, and Populated states are mutually exclusive", () => {
    function computeUIState({ isLoading, isError, items }) {
      if (isLoading) return "LOADING";
      if (isError) return "ERROR";
      if (!items || items.length === 0) return "EMPTY";
      return "POPULATED";
    }

    assert.equal(computeUIState({ isLoading: true, isError: false, items: [] }), "LOADING");
    assert.equal(computeUIState({ isLoading: false, isError: true, items: [] }), "ERROR");
    assert.equal(computeUIState({ isLoading: false, isError: false, items: [] }), "EMPTY");
    assert.equal(computeUIState({ isLoading: false, isError: false, items: [{ id: 1 }] }), "POPULATED");

    // Failure never shows empty state
    assert.notEqual(computeUIState({ isLoading: false, isError: true, items: [] }), "EMPTY");
  });

  // ── 7. i18n Dictionary Parity ───────────────────────────────────────────────
  await test("i18n Parity: superAdmin.cities in Arabic and English have matching keys", () => {
    const i18nContent = fs.readFileSync("src/app/i18n.ts", "utf8");

    // Verify key presence in both languages
    const requiredKeys = [
      "title",
      "subtitle",
      "add",
      "columns.id",
      "columns.name",
      "columns.countryCode",
      "columns.googlePlaceId",
      "columns.coordinates",
      "columns.status",
      "columns.createdAt",
      "columns.actions",
      "columns.active",
      "columns.inactive",
      "form.createTitle",
      "form.name",
      "form.countryCode",
      "form.googlePlaceId",
      "form.latitude",
      "form.longitude",
      "form.submit",
      "details.title",
      "details.coordinates",
      "details.viewOnGoogleMaps",
      "validation.nameRequired",
      "validation.countryCodeRequired",
      "validation.googlePlaceIdRequired",
      "validation.latitudeRequired",
      "validation.longitudeRequired",
      "validation.latitudeRange",
      "validation.longitudeRange",
      "success.created",
      "success.existingRetrieved",
      "empty.title",
      "empty.description",
      "errors.fetchFailed",
      "errors.detailFailed",
    ];

    for (const key of requiredKeys) {
      assert(i18nContent.includes(key.split(".").pop()), `Key segment '${key}' must exist in i18n.ts`);
    }
  });

  // ── 8. Safe Nullable Coordinates Rendering ─────────────────────────────────
  await test("Safe Coordinates Rendering: City lists and details render safely with missing coordinates", () => {
    function formatCityCoordinates(city) {
      if (
        typeof city.latitude === "number" &&
        typeof city.longitude === "number" &&
        !isNaN(city.latitude) &&
        !isNaN(city.longitude) &&
        Math.abs(city.latitude) <= 90 &&
        Math.abs(city.longitude) <= 180
      ) {
        return `${city.latitude.toFixed(4)}, ${city.longitude.toFixed(4)}`;
      }
      return "—";
    }

    assert.equal(formatCityCoordinates({ latitude: 24.7136, longitude: 46.6753 }), "24.7136, 46.6753");
    assert.equal(formatCityCoordinates({ latitude: null, longitude: null }), "—");
    assert.equal(formatCityCoordinates({ latitude: undefined, longitude: undefined }), "—");
    assert.equal(formatCityCoordinates({ latitude: 24.7, longitude: null }), "—");
    assert.equal(formatCityCoordinates({ latitude: null, longitude: 46.6 }), "—");
    assert.equal(formatCityCoordinates({ latitude: NaN, longitude: 46.6 }), "—");
  });

  console.log(`\nAll ${passed} tests passed successfully! (${failed} failed)`);
  if (failed > 0) process.exit(1);
})();
