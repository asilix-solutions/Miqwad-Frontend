/** Offline real presentation/guard checks. Does not certify browser accessibility. */
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  ts = require("typescript");
const root = path.resolve(__dirname, "..");
let count = 0;
let mockImports = {};
function load(file) {
  const m = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) =>
      name in mockImports
        ? mockImports[name]
        : name.startsWith(".")
          ? load(path.join(path.dirname(file), name) + ".ts")
          : name.startsWith("@shared/")
            ? load("src/shared/" + name.slice(8) + ".ts")
            : name.startsWith("@modules/")
              ? load("src/modules/" + name.slice(9) + ".ts")
              : require(name),
    m,
    m.exports,
  );
  return m.exports;
}
const { previewRestrictions: restrictions } = load(
  "src/modules/tow-truck/lib/previewPresentation.ts",
);
const { readRemovalEvidence, serviceSnapshot } = load("src/modules/tow-truck/lib/reassignment.ts");
const { driverOperationBlocks, initialOperationBlocks } = load(
  "src/modules/tow-truck/lib/driverOperationGuards.ts",
);
const { cancellationBlocks } = load("src/modules/tow-truck/lib/cancellationJournal.ts");
const storage = new Map();
global.sessionStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, v),
  key: (i) => [...storage.keys()][i],
  get length() {
    return storage.size;
  },
};
const qc = { getQueryData: () => undefined, getQueriesData: () => [] };
const order = {
  id: "84",
  number: "MQ-84",
  status: "InWaiting",
  statusCode: 1,
  assignment: "unassigned",
  dispatchService: "intracity",
  serviceType: "intracity",
  isInterCity: false,
  paymentStatus: "Pending",
  paymentCode: 1,
  paymentStatusValid: true,
  origin: { quality: "unverified" },
  destination: { quality: "unverified" },
  intercityDetails: { roadId: "3" },
  financeSnapshot: "finance",
  subtotal: 100,
  discount: 0,
  total: 100,
};
function test(name, f) {
  f();
  count++;
  console.log("PASS " + name);
}
test("Local eligibility stays blocked", () =>
  assert.ok(restrictions(order, null).includes("r2LocalEligibilityUnverified")));
test("Simultaneous missing, identical, suspect and service restrictions survive", () => {
  const w = restrictions(
    {
      ...order,
      dispatchService: "unknown",
      missingTrip: true,
      sameLocations: true,
      origin: { quality: "suspect" },
      destination: { quality: "invalid" },
    },
    null,
  );
  for (const key of [
    "r2ServiceUnverified",
    "checkHint",
    "sameLocations",
    "locationSuspect",
    "locationInvalid",
  ])
    assert.ok(w.includes(key));
  assert.equal(w.length, new Set(w).size);
});
test("Unknown payment and assignment remain explicit", () => {
  const w = restrictions({ ...order, paymentStatus: "", assignment: "unknown" }, null);
  assert.ok(w.includes("p3rPaymentUnknown"));
  assert.ok(w.includes("driverStateUnknown"));
});
test("Paid InterCity restriction survives other blockers", () =>
  assert.ok(
    restrictions(
      {
        ...order,
        isInterCity: true,
        dispatchService: "unknown",
        paymentStatus: "Paid",
        paymentCode: 2,
      },
      null,
    ).includes("assignmentPaidInterCityBlocked"),
  ));
test("Unknown removal evidence preserved alongside route warnings", () => {
  const w = restrictions({ ...order, missingTrip: true }, "unverified");
  assert.ok(w.includes("r2RemovalUnverified"));
  assert.ok(w.includes("checkHint"));
});
test("Paid replacement with matching evidence is not falsely described as initial assignment", () => {
  const paid = {
    ...order,
    isInterCity: true,
    dispatchService: "intercity",
    paymentStatus: "Paid",
    paymentCode: 2,
  };
  assert.ok(
    !restrictions(paid, {
      orderId: "84",
      driverId: "6",
      finance: paid.financeSnapshot,
      service: serviceSnapshot(paid),
    }).includes("assignmentPaidInterCityBlocked"),
  );
});
test("Changed replacement financial evidence stays blocked", () =>
  assert.ok(
    restrictions(order, {
      orderId: "84",
      driverId: "6",
      finance: "changed",
      service: serviceSnapshot(order),
    }).includes("r2FinancialChanged"),
  ));
test("Terminal order does not gain an initial-assignment instruction", () =>
  assert.ok(
    !restrictions({ ...order, status: "Canceled", statusCode: 5 }, null).includes(
      "initialNeedsWaiting",
    ),
  ));
test("Absent coordinates retained separately from address", () =>
  assert.ok(
    restrictions({ ...order, origin: { quality: "missing" } }, null).includes("locationMissing"),
  ));
test("Empty removal evidence is not authorization", () => {
  assert.equal(readRemovalEvidence("A", "84"), null);
  assert.ok(restrictions(order, null).length);
});
test("Driver journal scoped by actor", () => {
  storage.set("miqwad:driver-operation:A", "bad");
  assert.ok(driverOperationBlocks(qc, "A"));
  assert.equal(driverOperationBlocks(qc, "B"), false);
});
test("Assignment marker scoped by actor", () => {
  storage.set("miqwad:initial-assignment:A:84", "bad");
  assert.ok(initialOperationBlocks(qc, "A"));
  assert.equal(initialOperationBlocks(qc, "B"), false);
});
test("Cancellation journal scoped by actor and request", () => {
  storage.set("miqwad:cancel:A:84", "bad");
  /* exact key tested below */ const { cancellationMarker } = load(
    "src/modules/tow-truck/lib/cancellationJournal.ts",
  );
  storage.set(cancellationMarker("A", "84"), "bad");
  assert.ok(cancellationBlocks(qc, "A", "84"));
  assert.equal(cancellationBlocks(qc, "B", "84"), false);
  assert.equal(cancellationBlocks(qc, "A", "85"), false);
});
const before = JSON.stringify([...storage]);
for (let i = 0; i < 3; i++) {
  driverOperationBlocks(qc, "A");
  initialOperationBlocks(qc, "A");
  cancellationBlocks(qc, "A", "84");
  restrictions(order, readRemovalEvidence("A", "84"));
}
test("Read-only projection never writes journal", () =>
  assert.equal(JSON.stringify([...storage]), before));
const source = fs.readFileSync(
  path.join(root, "src/modules/tow-truck/components/TowTruckQuickPreviewDrawer.tsx"),
  "utf8",
);
test("Radix modal, not Sheet", () => {
  assert.match(source, /<Dialog modal/);
  assert.doesNotMatch(source, /\bSheet\b/);
});
test("No mutation hook or API introduced", () =>
  assert.doesNotMatch(
    source,
    /useMutation|useDriverOperations|useInitialAssignment|useTowTruckCancellation|fetch\(|axios|setItem\(/,
  ));
test("One identity and no customer technical IDs", () => {
  assert.equal((source.match(/order.number/g) || []).length, 1);
  assert.doesNotMatch(source, /customerId|serialNumber|order\.plate/);
});
test("All restrictions and unclassified notes stay visible", () => {
  assert.match(source, /warnings.map/);
  assert.match(source, /<p>\{order.notes\}<\/p>/);
  assert.doesNotMatch(source, /line-clamp|<details/);
});
test("Close focus and safe link context retained", () => {
  for (const x of ["onRestoreFocus()", "handleOrderLinkClick", "safeQueueUrl", "returnScrollY"])
    assert.ok(source.includes(x));
});
const translations = load("src/modules/tow-truck/i18n.ts");
test("Bilingual keys complete and nonempty", () => {
  for (const key of [
    "serviceType",
    "p3rReadOnly",
    "p3rReviewGuidance",
    "p3rRestrictions",
    "p3rPaymentUnknown",
    "p3rDriverLock",
    "p3rAssignmentLock",
    "p3rCancellationLock",
  ]) {
    assert.ok(translations.towTruckAr[key]);
    assert.ok(translations.towTruckEn[key]);
  }
});
const css = fs.readFileSync(path.join(root, "src/modules/tow-truck/towTruck.css"), "utf8");
test("Centered width bounded to 320/390 viewport and reduced motion defined", () => {
  assert.match(css, /width: min\(560px, calc\(100vw - 24px\)\)/);
  assert.match(css, /translate\(-50%, -50%\)/);
  assert.match(css, /\.tow-decision-preview-body\s*\{[^}]*overflow-y: auto/s);
  assert.match(css, /prefers-reduced-motion/);
});

let actor = "A",
  restored = 0,
  focused = 0;
mockImports = {
  react: {
    useCallback: (f) => f,
    useRef: () => ({ current: { focus: () => focused++ } }),
    useSyncExternalStore: (_subscribe, get) => get(),
  },
  "react-i18next": { useTranslation: () => ({ t: (k) => k, i18n: { dir: () => "rtl" } }) },
  "react-router-dom": { Link: "Link", useNavigate: () => () => {} },
  "@app/store": { useAppSelector: (f) => f({ auth: { user: { id: actor } } }) },
  "@tanstack/react-query": { useQueryClient: () => qc },
  "radix-ui": { Dialog: { Content: "Content" } },
  "@/components/ui/dialog": Object.fromEntries(
    [
      "Dialog",
      "DialogPortal",
      "DialogOverlay",
      "DialogTitle",
      "DialogDescription",
      "DialogClose",
    ].map((k) => [k, k]),
  ),
  "@/components/ui/button": { Button: "Button" },
  "./TowTruckStatusBadge": Object.fromEntries(
    [
      "TowTruckOrderStatusBadge",
      "TowTruckAssignmentBadge",
      "TowTruckServiceTypeBadge",
      "TowTruckPaymentStatusBadge",
    ].map((k) => [k, k]),
  ),
};
const Preview = load(
  "src/modules/tow-truck/components/TowTruckQuickPreviewDrawer.tsx",
).TowTruckQuickPreviewDrawer;
const nodes = (t) =>
  Array.isArray(t)
    ? t.flatMap(nodes)
    : t && typeof t === "object"
      ? [t, ...nodes(t.props?.children)]
      : [];
const text = (t) =>
  Array.isArray(t)
    ? t.map(text).join(" ")
    : t && typeof t === "object"
      ? text(t.props?.children)
      : String(t ?? "");
const props = {
  open: true,
  order,
  fromQueue: "/admin/tow-truck?page=3",
  onClose() {},
  onRestoreFocus() {
    restored++;
  },
};
for (const [name, extra, key, hasLink] of [
  ["loading", { isLoading: true }, "towTruck.loading", false],
  ["initial error", { order: null, isError: true }, "towTruck.errorTitle", false],
  ["missing order", { order: null }, "towTruck.orderNotFound", false],
  ["stale", { isError: true }, "towTruck.stale", true],
  ["populated", {}, "towTruck.nextAction", true],
])
  test("Rendered " + name + " state and workspace link", () => {
    const tree = Preview({ ...props, ...extra });
    assert.ok(text(tree).includes(key));
    assert.equal(
      nodes(tree).some((n) => n.type === "Link"),
      hasLink,
    );
  });
test("Rendered simultaneous actor locks", () => {
  const txt = text(Preview(props));
  for (const k of ["p3rDriverLock", "p3rAssignmentLock", "p3rCancellationLock"])
    assert.ok(txt.includes(k));
});
test("Actor change removes other actor restriction text", () => {
  actor = "B";
  const txt = text(Preview(props));
  for (const k of ["p3rDriverLock", "p3rAssignmentLock", "p3rCancellationLock"])
    assert.ok(!txt.includes(k));
  actor = "A";
});
test("Notes are exposed without truncation", () =>
  assert.ok(
    text(Preview({ ...props, order: { ...order, notes: "Safety instruction" } })).includes(
      "Safety instruction",
    ),
  ));
test("Focus callbacks still target heading and restoration once", () => {
  const n = nodes(Preview(props)).find((n) => n.type === "Content");
  let prevented = 0;
  const e = {
    preventDefault() {
      prevented++;
    },
  };
  n.props.onOpenAutoFocus(e);
  n.props.onCloseAutoFocus(e);
  assert.equal(focused, 1);
  assert.equal(restored, 1);
  assert.equal(prevented, 2);
});
const { previewLocations } = load("src/modules/tow-truck/lib/previewPresentation.ts");
for (const service of ["intracity", "intercity", "unknown"])
  for (const missing of [false, true])
    test("F1 locations " + service + " missing=" + missing, () => {
      const o = {
        ...order,
        serviceType: service,
        dispatchService: service,
        origin: { title: missing ? null : "Address A", description: null },
        destination: { title: missing ? null : "Address B", description: null },
        intercityDetails: {
          originCityName: missing ? null : "City A",
          destinationCityName: missing ? null : "City B",
        },
      };
      const fields = previewLocations(o);
      assert.equal(fields.length, 2);
      assert.equal(
        fields[0].value,
        missing ? null : service === "intercity" ? "City A" : "Address A",
      );
      assert.equal(
        fields[0].label,
        service === "intercity"
          ? "f1OriginCity"
          : service === "intracity"
            ? "f1Pickup"
            : "f1RecordedOrigin",
      );
    });
test("Conflicting dispatch classification never asserts corridor", () =>
  assert.equal(
    previewLocations({ ...order, serviceType: "intercity", dispatchService: "unknown" })[0].label,
    "f1RecordedOrigin",
  ));
test("F1 labels bilingual", () => {
  for (const k of [
    "f1Pickup",
    "f1Dropoff",
    "f1OriginCity",
    "f1DestinationCity",
    "f1RecordedOrigin",
    "f1RecordedDestination",
    "f1LocationMissing",
  ]) {
    assert.ok(translations.towTruckAr[k]);
    assert.ok(translations.towTruckEn[k]);
  }
});

// Execute actual order adapter; only unrelated vehicle-name localization is stubbed.
mockImports["@modules/vehicles/lib/modelLocalization"] = { getModelArabicNameByBrand: () => null };
mockImports["@modules/vehicles/lib/brandLocalization"] = { getBrandEnglishName: () => null };
const { adaptTowTruck } = load("src/modules/tow-truck/lib/towTruckModel.ts");
const raw = {
  id: 30,
  orderNumber: "fixture-30",
  orderType: 3,
  towTruckServiceType: 2,
  status: 1,
  paymentStatus: 2,
  towTruckDriverId: null,
  addressTitle: "Street A",
  destinationAddressTitle: "Street B",
};
for (const [name, details, length] of [
  ["complete", { originCityNameSnapshot: "City A", destinationCityNameSnapshot: "City B" }, 2],
  ["partial", { originCityNameSnapshot: "City A" }, 3],
  ["missing", { roadId: 7 }, 4],
])
  test("F2 actual adapter shape " + name, () => {
    const o = adaptTowTruck({ ...raw, intercityTowTruckDetails: details });
    const fields = previewLocations(o);
    assert.equal(fields.length, length);
    assert.ok(restrictions(o, null).includes("assignmentPaidInterCityBlocked"));
    if (length > 2) assert.equal(fields.at(-1).value, "Street B");
  });
test("F2 null snapshot uses legacy name", () =>
  assert.equal(
    adaptTowTruck({
      ...raw,
      originCityName: "Legacy",
      intercityTowTruckDetails: { originCityNameSnapshot: null },
    }).intercityDetails.originCityName,
    "Legacy",
  ));
test("F2 blank snapshot mapping limitation documented, address preserved", () => {
  const o = adaptTowTruck({
    ...raw,
    originCityName: "Legacy",
    intercityTowTruckDetails: { originCityNameSnapshot: " " },
  });
  assert.equal(o.intercityDetails.originCityName, null);
  assert.ok(
    previewLocations(o).some((x) => x.label === "f2OriginAddress" && x.value === "Street A"),
  );
});
test("F2 no addresses never invents location", () =>
  assert.equal(
    previewLocations(adaptTowTruck({ ...raw, addressTitle: null, destinationAddressTitle: null }))
      .length,
    2,
  ));
test("F2 conflicting raw discriminator stays neutral", () =>
  assert.equal(
    previewLocations(adaptTowTruck({ ...raw, serviceType: 1 }))[0].label,
    "f1RecordedOrigin",
  ));
test("F2 bilingual address labels", () => {
  assert.ok(translations.towTruckAr.f2OriginAddress);
  assert.ok(translations.towTruckEn.f2DestinationAddress);
});
console.log(
  `${count} focused offline P3-R checks passed. Browser layout, focus trap and Escape NOT VERIFIED.`,
);
