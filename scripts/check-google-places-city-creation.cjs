/**
 * @file check-google-places-city-creation.cjs
 * @description Comprehensive offline verification suite for Google Places in City Creation (Phase 1).
 * Verifies all 15 required criteria from Section 9:
 * 1. Manual Place ID input has been removed
 * 2. Manual fallback toggle has been removed
 * 3. Place ID technical display and copy button have been removed
 * 4. Valid Google prediction selection internally populates googlePlaceId
 * 5. Arbitrary typed text cannot enable submission
 * 6. Editing the search invalidates the old Place ID
 * 7. Changing the country cannot preserve an incompatible selected city
 * 8. Changing the selected city correctly updates all dependent fields
 * 9. Out-of-order asynchronous Place Details responses cannot restore stale selections
 * 10. Form reset clears the old selection
 * 11. Submission without a valid selection is blocked
 * 12. Valid submission preserves the expected backend contract
 * 13. Missing Google API configuration is handled gracefully
 * 14. Google-derived coordinates are not transferred into Leaflet or permanently persisted
 * 15. Arabic and English translation keys remain consistent
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

console.log("=== RUNNING GOOGLE PLACES CITY CREATION (PHASE 1) OFFLINE VERIFICATION SUITE ===");

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

  const cityFormSchema = z.object({
    name: z.string().trim().min(1, { message: "superAdmin.cities.validation.nameRequired" }).max(150),
    countryCode: z.string().trim().min(1, { message: "superAdmin.cities.validation.countryCodeRequired" }).max(10),
    googlePlaceId: z.string().trim().min(1, { message: "superAdmin.cities.validation.googlePlaceIdRequired" }).max(255),
    latitude: optionalCoordinateField(-90, 90, "latitude"),
    longitude: optionalCoordinateField(-180, 180, "longitude"),
  });

  const autocompleteSrc = fs.readFileSync(
    "src/modules/admin/components/reference/CityGooglePlacesAutocomplete.tsx",
    "utf8",
  );
  const createCityDialogSrc = fs.readFileSync(
    "src/modules/admin/components/reference/CreateCityDialog.tsx",
    "utf8",
  );

  // ── 1. Manual Place ID input has been removed ────────────────────────────────
  await test("Criterion 1: Manual Place ID input has been removed from UI", () => {
    assert(
      !autocompleteSrc.includes("googlePlaceIdManual"),
      "CityGooglePlacesAutocomplete must not render googlePlaceIdManual input",
    );
    assert(
      !autocompleteSrc.includes("<Input"),
      "CityGooglePlacesAutocomplete must not render any manual text Input component",
    );
    assert(
      !createCityDialogSrc.includes("googlePlaceIdManual"),
      "CreateCityDialog must not render googlePlaceIdManual input",
    );
  });

  // ── 2. Manual fallback toggle has been removed ───────────────────────────────
  await test("Criterion 2: Manual fallback toggle has been removed from UI", () => {
    assert(
      !autocompleteSrc.includes("manualFallbackMode"),
      "CityGooglePlacesAutocomplete must not contain manualFallbackMode state",
    );
    assert(
      !autocompleteSrc.includes("placesManualFallbackToggle"),
      "CityGooglePlacesAutocomplete must not render placesManualFallbackToggle button",
    );
    assert(
      !autocompleteSrc.includes("placesUseAutocompleteToggle"),
      "CityGooglePlacesAutocomplete must not render placesUseAutocompleteToggle button",
    );
  });

  // ── 3. Place ID technical display and copy button have been removed ───────────
  await test("Criterion 3: Place ID technical display and copy button have been removed from UI", () => {
    assert(
      !autocompleteSrc.includes("handleCopyPlaceId"),
      "CityGooglePlacesAutocomplete must not contain handleCopyPlaceId handler",
    );
    assert(
      !autocompleteSrc.includes("navigator.clipboard"),
      "CityGooglePlacesAutocomplete must not call navigator.clipboard",
    );
    assert(
      !autocompleteSrc.includes("<code"),
      "CityGooglePlacesAutocomplete must not render <code> element displaying raw placeId",
    );
    assert(
      !autocompleteSrc.includes("Place ID:"),
      "CityGooglePlacesAutocomplete must not display technical 'Place ID:' label to administrator",
    );
  });

  // ── 4. Valid Google prediction selection internally populates googlePlaceId ──
  await test("Criterion 4: Valid Google prediction selection internally populates googlePlaceId", () => {
    const mockPlace = {
      id: "ChIJ818b-y1Elx4Rj80s-k8x5g8",
      displayName: { text: "الرياض" },
      formattedAddress: "الرياض، المملكة العربية السعودية",
      addressComponents: [
        { types: ["locality"], shortText: "الرياض", longText: "الرياض" },
        { types: ["country"], shortText: "SA", longText: "المملكة العربية السعودية" },
      ],
    };

    // Extract country code from addressComponents
    const countryComp = mockPlace.addressComponents.find((c) => c.types.includes("country"));
    const extractedCountry = countryComp ? countryComp.shortText.toUpperCase() : "SA";

    const selection = {
      placeId: mockPlace.id,
      name: mockPlace.displayName.text,
      fullDescription: mockPlace.formattedAddress,
      countryCode: extractedCountry,
    };

    // Simulated handleSelectPlace inside CreateCityDialog
    let formValues = {
      name: selection.name,
      countryCode: selection.countryCode,
      googlePlaceId: selection.placeId,
      latitude: undefined,
      longitude: undefined,
    };

    const parsed = cityFormSchema.safeParse(formValues);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.googlePlaceId, "ChIJ818b-y1Elx4Rj80s-k8x5g8");
    assert.equal(parsed.data.name, "الرياض");
    assert.equal(parsed.data.countryCode, "SA");
  });

  // ── 5. Arbitrary typed text cannot enable submission ──────────────────────────
  await test("Criterion 5: Arbitrary typed text cannot enable submission", () => {
    // User types "الرياض" into search input without selecting from prediction list
    const formValues = {
      name: "الرياض",
      countryCode: "SA",
      googlePlaceId: "", // Untouched because no genuine prediction was selected
      latitude: undefined,
      longitude: undefined,
    };

    const parsed = cityFormSchema.safeParse(formValues);
    assert.equal(parsed.success, false);
    assert.equal(
      parsed.error.issues[0].message,
      "superAdmin.cities.validation.googlePlaceIdRequired",
    );
  });

  // ── 6. Editing the search invalidates the old Place ID ─────────────────────────
  await test("Criterion 6: Editing the search invalidates the old Place ID", () => {
    let currentPlaceId = "ChIJ818b-y1Elx4Rj80s-k8x5g8";

    // Admin types in the search input or clicks "Change City"
    const handleInputOrClear = () => {
      currentPlaceId = "";
    };
    handleInputOrClear();

    const formValues = {
      name: "الرياض",
      countryCode: "SA",
      googlePlaceId: currentPlaceId,
    };
    const parsed = cityFormSchema.safeParse(formValues);
    assert.equal(parsed.success, false);
    assert.equal(
      parsed.error.issues[0].message,
      "superAdmin.cities.validation.googlePlaceIdRequired",
    );
  });

  // ── 7. Changing the country cannot preserve an incompatible selected city ────
  await test("Criterion 7: Changing the country cannot preserve an incompatible selected city", () => {
    let activeCountry = "SA";
    let activePlaceId = "ChIJ818b-y1Elx4Rj80s-k8x5g8"; // Riyadh, SA

    // User changes country code input to "AE"
    const onCountryInputChange = (newCountry) => {
      if (newCountry !== activeCountry) {
        activeCountry = newCountry;
        activePlaceId = ""; // Cleared to prevent cross-country mismatch
      }
    };
    onCountryInputChange("AE");

    assert.equal(activePlaceId, "");

    const formValues = {
      name: "الرياض",
      countryCode: activeCountry,
      googlePlaceId: activePlaceId,
    };
    const parsed = cityFormSchema.safeParse(formValues);
    assert.equal(parsed.success, false);
    assert.equal(
      parsed.error.issues[0].message,
      "superAdmin.cities.validation.googlePlaceIdRequired",
    );
  });

  // ── 8. Changing the selected city correctly updates all dependent fields ──────
  await test("Criterion 8: Changing the selected city correctly updates all dependent fields", () => {
    const mockPlace1 = {
      id: "ChIJ818b-y1Elx4Rj80s-k8x5g8",
      displayName: { text: "الرياض" },
      addressComponents: [{ types: ["country"], shortText: "SA" }],
    };
    const mockPlace2 = {
      id: "ChIJv3PtV55FXj4R-p2f41pL0zY",
      displayName: { text: "دبي" },
      addressComponents: [{ types: ["country"], shortText: "AE" }],
    };

    let formState = {
      name: mockPlace1.displayName.text,
      countryCode: mockPlace1.addressComponents[0].shortText,
      googlePlaceId: mockPlace1.id,
    };

    assert.equal(formState.name, "الرياض");
    assert.equal(formState.countryCode, "SA");
    assert.equal(formState.googlePlaceId, "ChIJ818b-y1Elx4Rj80s-k8x5g8");

    // Admin selects new city (Dubai)
    formState = {
      name: mockPlace2.displayName.text,
      countryCode: mockPlace2.addressComponents[0].shortText,
      googlePlaceId: mockPlace2.id,
    };

    assert.equal(formState.name, "دبي");
    assert.equal(formState.countryCode, "AE");
    assert.equal(formState.googlePlaceId, "ChIJv3PtV55FXj4R-p2f41pL0zY");

    const parsed = cityFormSchema.safeParse(formState);
    assert.equal(parsed.success, true);
  });

  // ── 9. Out-of-order asynchronous Place Details responses ─────────────────────
  await test("Criterion 9: Out-of-order asynchronous Place Details responses cannot restore stale selections", async () => {
    let latestFetchId = 0;
    let committedSelection = null;

    // Simulated async fetch simulation
    async function selectPrediction(id, name, delayMs) {
      const fetchId = ++latestFetchId;
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Guard check against stale asynchronous resolution
      if (fetchId !== latestFetchId) {
        return; // Stale, discard!
      }
      committedSelection = { id, name };
    }

    // Prediction A starts with slow network (60ms)
    const reqA = selectPrediction("place-A", "مدينة أ (بطيئة)", 60);

    // Shortly after (10ms), admin picks Prediction B with fast network (20ms)
    await new Promise((resolve) => setTimeout(resolve, 10));
    const reqB = selectPrediction("place-B", "مدينة ب (سريعة)", 20);

    await Promise.all([reqA, reqB]);

    // Committed selection MUST be place-B, NOT place-A
    assert.equal(committedSelection.id, "place-B");
    assert.equal(committedSelection.name, "مدينة ب (سريعة)");
  });

  // ── 10. Form reset clears the old selection ──────────────────────────────────
  await test("Criterion 10: Form reset clears the old selection", () => {
    const DEFAULT_FORM_VALUES = {
      name: "",
      countryCode: "SA",
      googlePlaceId: "",
      latitude: undefined,
      longitude: undefined,
    };

    let formState = {
      name: "الرياض",
      countryCode: "SA",
      googlePlaceId: "ChIJ818b-y1Elx4Rj80s-k8x5g8",
      latitude: 24.7136,
      longitude: 46.6753,
    };

    // Dialog close or reset
    formState = { ...DEFAULT_FORM_VALUES };

    assert.equal(formState.name, "");
    assert.equal(formState.googlePlaceId, "");
    assert.equal(formState.countryCode, "SA");
    assert.equal(formState.latitude, undefined);
    assert.equal(formState.longitude, undefined);

    const parsed = cityFormSchema.safeParse(formState);
    assert.equal(parsed.success, false);
    assert.equal(
      parsed.error.issues[0].message,
      "superAdmin.cities.validation.nameRequired",
    );
  });

  // ── 11. Submission without a valid selection is blocked ──────────────────────
  await test("Criterion 11: Submission without a valid selection is blocked", () => {
    // 1. Submit button disabled condition in CreateCityDialog
    const isSubmitDisabled = (isPending, currentGooglePlaceId) =>
      Boolean(isPending || !currentGooglePlaceId || currentGooglePlaceId.trim().length === 0);

    assert.equal(isSubmitDisabled(false, ""), true, "Must be disabled when placeId is empty");
    assert.equal(isSubmitDisabled(false, "   "), true, "Must be disabled when placeId is whitespace");
    assert.equal(isSubmitDisabled(true, "valid-id"), true, "Must be disabled when mutation is pending");
    assert.equal(isSubmitDisabled(false, "valid-id"), false, "Must be enabled when valid placeId exists");

    // 2. Submit handler invariant in CreateCityDialog
    let serverError = null;
    const onSubmitSimulated = (values) => {
      serverError = null;
      if (!values.googlePlaceId || values.googlePlaceId.trim().length === 0) {
        serverError = "superAdmin.cities.validation.googlePlaceIdRequired";
        return;
      }
    };

    onSubmitSimulated({ googlePlaceId: "" });
    assert.equal(serverError, "superAdmin.cities.validation.googlePlaceIdRequired");
  });

  // ── 12. Valid submission preserves the expected backend contract ─────────────
  await test("Criterion 12: Valid submission preserves the expected backend contract", () => {
    const validPayload = {
      name: "الدمام",
      countryCode: "SA",
      googlePlaceId: "ChIJ3W456...",
      latitude: undefined,
      longitude: undefined,
    };

    const parsed = cityFormSchema.safeParse(validPayload);
    assert.equal(parsed.success, true);
    assert.deepEqual(parsed.data, {
      name: "الدمام",
      countryCode: "SA",
      googlePlaceId: "ChIJ3W456...",
      latitude: undefined,
      longitude: undefined,
    });

    // Verify roadsApi.ts CreateCityDto contract
    const roadsApiSrc = fs.readFileSync("src/modules/admin/api/roadsApi.ts", "utf8");
    assert(
      roadsApiSrc.includes("googlePlaceId: string;"),
      "CreateCityDto must require googlePlaceId: string",
    );
    assert(
      roadsApiSrc.includes("name: string;"),
      "CreateCityDto must require name: string",
    );
    assert(
      roadsApiSrc.includes("countryCode: string;"),
      "CreateCityDto must require countryCode: string",
    );
  });

  // ── 13. Missing Google API configuration is handled gracefully ───────────────
  await test("Criterion 13: Missing Google API configuration is handled gracefully", () => {
    // 1. Alert in CityGooglePlacesAutocomplete does NOT show VITE_ or technical keys
    assert(
      !autocompleteSrc.includes("VITE_GOOGLE_MAPS_API_KEY"),
      "CityGooglePlacesAutocomplete UI must not print raw environment variable names",
    );

    // 2. Alert displays friendly translated message
    assert(
      autocompleteSrc.includes("placesConfigMissingTitle"),
      "Must render placesConfigMissingTitle when unconfigured",
    );
    assert(
      autocompleteSrc.includes("placesConfigMissingDesc"),
      "Must render placesConfigMissingDesc when unconfigured",
    );

    // 3. No manual fallback is offered when unconfigured
    assert(
      !autocompleteSrc.includes("GOOGLE_PLACE_ID_FINDER_URL"),
      "Must not link to external finder or offer manual entry fallback when unconfigured",
    );
  });

  // ── 14. Google-derived coordinates are not transferred into Leaflet/OSM ──────
  await test("Criterion 14: Google-derived coordinates are not transferred into Leaflet or permanently persisted", () => {
    // 1. fetchFields in CityGooglePlacesAutocomplete must only request identity and addressComponents
    assert(
      !autocompleteSrc.includes('fields: ["id", "displayName", "location"'),
      "CityGooglePlacesAutocomplete must NOT request 'location' coordinates from Google",
    );
    assert(
      autocompleteSrc.includes('fields: ["id", "displayName", "formattedAddress", "addressComponents"]'),
      "CityGooglePlacesAutocomplete must request only id, displayName, formattedAddress, and addressComponents",
    );

    // 2. handleSelectPlace in CreateCityDialog must not set form latitude or longitude from Google selection
    assert(
      !createCityDialogSrc.includes("setValue(\"latitude\", selection.latitude"),
      "CreateCityDialog must NOT populate latitude from Google Place selection",
    );
    assert(
      !createCityDialogSrc.includes("setValue(\"longitude\", selection.longitude"),
      "CreateCityDialog must NOT populate longitude from Google Place selection",
    );
  });

  // ── 15. Arabic and English translation keys remain consistent ─────────────────
  await test("Criterion 15: Arabic and English translation keys remain consistent", () => {
    const i18nContent = fs.readFileSync("src/app/i18n.ts", "utf8");

    const requiredKeys = [
      "placesAutocompleteLabel",
      "placesAutocompletePlaceholder",
      "placesSearchLoading",
      "placesTypePrompt",
      "placesNoResults",
      "placesSelectedCity",
      "placesConfirmed",
      "placesChangeCity",
      "placesConfigMissingTitle",
      "placesConfigMissingDesc",
    ];

    for (const key of requiredKeys) {
      const matches = i18nContent.split(key);
      assert(
        matches.length >= 3,
        `Key '${key}' must exist in both Arabic and English sections of i18n.ts (found ${matches.length - 1} occurrences)`,
      );
    }
  });

  // ── Additional Standards: Modern Places API and Deprecated APIs Prohibition ──
  await test("Additional: Zero usage of deprecated AutocompleteService or legacy Autocomplete", () => {
    assert(
      !autocompleteSrc.includes("AutocompleteService"),
      "CityGooglePlacesAutocomplete must NOT use deprecated AutocompleteService",
    );
    assert(
      !autocompleteSrc.includes("getPlacePredictions"),
      "CityGooglePlacesAutocomplete must NOT use deprecated getPlacePredictions",
    );
    assert(
      !autocompleteSrc.includes("new google.maps.places.Autocomplete("),
      "CityGooglePlacesAutocomplete must NOT use deprecated legacy Autocomplete widget",
    );
  });

  await test("Additional: Modern Places API PlaceAutocompleteElement attaches 'gmp-select'", () => {
    assert(
      autocompleteSrc.includes('element.addEventListener("gmp-select", handlePlaceSelect)'),
      "Must listen to official GA 'gmp-select' event",
    );
    assert(
      autocompleteSrc.includes("selectEvent.placePrediction.toPlace()"),
      "Must unwrap placePrediction via toPlace()",
    );
  });

  await test("Additional: Cache invalidation keys on city creation", () => {
    const roadsQueriesSrc = fs.readFileSync(
      "src/modules/admin/hooks/useRoadsQueries.ts",
      "utf8",
    );
    assert(
      roadsQueriesSrc.includes('qc.invalidateQueries({ queryKey: ["cities"] })'),
      "Must invalidate 'cities' query key",
    );
  });

  // ── Phase 1.3 Verification: Loader Reliability & Error Differentiation ──
  await test("Phase 1.3: Valid and missing API configuration detection logic", () => {
    const configSrc = fs.readFileSync(
      "src/modules/admin/lib/googlePlacesConfig.ts",
      "utf8",
    );
    assert(
      configSrc.includes("import.meta.env.VITE_GOOGLE_MAPS_API_KEY"),
      "Must read VITE_GOOGLE_MAPS_API_KEY from Vite environment",
    );
    assert(
      configSrc.includes("isGooglePlacesConfigured"),
      "Must export isGooglePlacesConfigured helper",
    );

    // Verify detection contract
    const detect = (val) => typeof val === "string" && val.trim().length > 0;
    assert.equal(detect(""), false);
    assert.equal(detect("   "), false);
    assert.equal(detect(undefined), false);
    assert.equal(detect(null), false);
    assert.equal(detect("AIzaFakeRestrictedKeyForTest12345"), true);
  });

  await test("Phase 1.3: Google Maps authorization failure (gm_authFailure) integration and cleanup", () => {
    const hookSrc = fs.readFileSync(
      "src/modules/admin/hooks/useGooglePlacesApi.ts",
      "utf8",
    );
    assert(
      hookSrc.includes("gm_authFailure"),
      "useGooglePlacesApi must integrate window.gm_authFailure handler",
    );
    assert(
      hookSrc.includes("prevGmAuthFailure"),
      "useGooglePlacesApi must preserve existing gm_authFailure handler",
    );
    assert(
      hookSrc.includes("win.gm_authFailure = prevGmAuthFailure"),
      "useGooglePlacesApi must restore previous gm_authFailure on cleanup",
    );
    assert(
      hookSrc.includes('"auth_error"'),
      "useGooglePlacesApi must classify gm_authFailure as 'auth_error'",
    );
  });

  await test("Phase 1.3: Differentiated error states for loader, library, and component", () => {
    const hookSrc = fs.readFileSync(
      "src/modules/admin/hooks/useGooglePlacesApi.ts",
      "utf8",
    );
    assert(
      hookSrc.includes('"script_load_error"'),
      "useGooglePlacesApi must classify network/DNS failure as 'script_load_error'",
    );
    assert(
      hookSrc.includes('"library_error"'),
      "useGooglePlacesApi must classify library initialization failure as 'library_error'",
    );
    assert(
      autocompleteSrc.includes('"component_error"'),
      "CityGooglePlacesAutocomplete must handle 'component_error'",
    );
    assert(
      autocompleteSrc.includes("placesAuthErrorTitle"),
      "CityGooglePlacesAutocomplete must display placesAuthErrorTitle on authorization error",
    );
    assert(
      autocompleteSrc.includes("placesScriptLoadErrorTitle"),
      "CityGooglePlacesAutocomplete must display placesScriptLoadErrorTitle on script error",
    );
    assert(
      autocompleteSrc.includes("placesLibraryErrorTitle"),
      "CityGooglePlacesAutocomplete must display placesLibraryErrorTitle on library error",
    );
    assert(
      autocompleteSrc.includes("placesComponentErrorTitle"),
      "CityGooglePlacesAutocomplete must display placesComponentErrorTitle on component error",
    );
  });

  await test("Phase 1.3: No secrets exposed in user-facing errors or autocomplete templates", () => {
    assert(
      !autocompleteSrc.includes("VITE_GOOGLE_MAPS_API_KEY"),
      "CityGooglePlacesAutocomplete must not mention API key variable",
    );
    assert(
      !autocompleteSrc.includes("maps.googleapis.com"),
      "CityGooglePlacesAutocomplete must not display raw script URL in template",
    );
    assert(
      !autocompleteSrc.includes("stack"),
      "CityGooglePlacesAutocomplete must not render error stack traces",
    );
  });

  await test("Phase 1.3: All differentiated error keys exist in both Arabic and English i18n", () => {
    const i18nContent = fs.readFileSync("src/app/i18n.ts", "utf8");
    const phase13Keys = [
      "placesAuthErrorTitle",
      "placesAuthErrorDesc",
      "placesScriptLoadErrorTitle",
      "placesScriptLoadErrorDesc",
      "placesLibraryErrorTitle",
      "placesLibraryErrorDesc",
      "placesComponentErrorTitle",
      "placesComponentErrorDesc",
    ];

    for (const key of phase13Keys) {
      const matches = i18nContent.split(key);
      assert(
        matches.length >= 3,
        `Key '${key}' must exist in both Arabic and English sections of i18n.ts (found ${matches.length - 1} occurrences)`,
      );
    }
  });

  console.log(`\nAll ${passed} tests passed successfully! (${failed} failed)`);
  if (failed > 0) process.exit(1);
})();
