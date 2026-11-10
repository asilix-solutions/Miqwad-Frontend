/** Offline regression checks: real workflow/API modules, stubbed transport, no network. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const req = createRequire(path.join(root, "package.json"));
const ts = req("typescript");
const cache = new Map();
let hookMocks;
let transport = () => {
  throw new Error("Unexpected transport call");
};
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const local = (name) => {
    if (hookMocks?.[name]) return hookMocks[name];
    if (name === "@app/i18n") return { default: { language: "ar" }, language: "ar" };
    if (name === "@shared/lib/axios")
      return {
        apiClient: {
          defaults: {
            transformResponse: [(data) => (typeof data === "string" ? JSON.parse(data) : data)],
          },
          get: (...args) => transport("GET", ...args),
          put: (...args) => transport("PUT", ...args),
          patch: (...args) => transport("PATCH", ...args),
          delete: (...args) => transport("DELETE", ...args),
        },
      };
    for (const alias of ["modules", "shared"])
      if (name.startsWith(`@${alias}/`))
        return load(`src/${alias}/${name.slice(alias.length + 2)}.ts`);
    if (name.startsWith(".")) return load(path.resolve(path.dirname(file), name) + ".ts");
    return req(name);
  };
  new Function("require", "module", "exports", code)(local, module, module.exports);
  return module.exports;
}
const { AppError } = load("src/shared/types/api.ts");
const { adaptTowTruck } = load("src/modules/tow-truck/lib/towTruckModel.ts");
const {
  submitDriverOperation: submit,
  recoverDriverOperation: recover,
  driverSnapshot,
  noteSchema,
  driverOperationAuthorized: allowed,
} = load("src/modules/tow-truck/lib/driverOperations.ts");
const guards = load("src/modules/tow-truck/lib/driverOperationGuards.ts");
const { confirmMutation } = load("src/shared/lib/confirmedMutation.ts");
const { ordersApi } = load("src/modules/orders/api/ordersApi.ts");
const { adminApi, activateUser, deactivateUser } = load("src/modules/admin/api/adminApi.ts");
const { QueryClient } = req("@tanstack/react-query");
const { submitInitialAssignment: assign, checkAssignmentOutcome: check } = load(
  "src/modules/tow-truck/lib/initialAssignment.ts",
);
const { initialAssignmentBlock, dispatchSnapshot, dispatchDraftSchema } = load(
  "src/modules/tow-truck/lib/dispatchModel.ts",
);
const { readRemovalEvidence, removalHistoryKey, serviceSnapshot } = load(
  "src/modules/tow-truck/lib/reassignment.ts",
);
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
// These are synthetic business fixtures, not evidence of server finality or concurrency control.
const base = {
  id: 105,
  orderType: 3,
  towTruckServiceType: 2,
  status: 2,
  paymentStatus: 2,
  paymentMethod: 1,
  towTruckDriverId: 15,
  subtotal: 150,
  discountAmount: 10,
  totalPrice: 140,
  roadId: 7,
};
function scenario(overrides = {}) {
  let raw = { ...base, ...overrides },
    ds = { phase: "idle" },
    as = { phase: "idle" },
    evidence = null;
  let deleteJournal = null,
    putJournal = null,
    deletes = 0,
    puts = 0,
    payload;
  const order = () => adaptTowTruck(raw);
  const d = {
    get: () => ds,
    set: (s) => (ds = s),
    authorized: () => true,
    conflict: () => false,
    readOrder: async (id) => {
      assert.equal(id, "105");
      return order();
    },
    readDriver: async (id) => ({ id, role: 5, isActive: true }),
    mark: (op) => {
      deleteJournal = structuredClone(op);
      evidence = "unverified";
    },
    clear: () => (deleteJournal = null),
    verifiedRemoval: (r) => (evidence = structuredClone(r)),
    invalidate: async () => {},
    send: async () => {
      deletes++;
      raw = { ...raw, status: 1, towTruckDriverId: null };
    },
  };
  const a = {
    orderId: "105",
    get: () => as,
    set: (s) => (as = s),
    authorized: () => true,
    evidence: () => evidence,
    readDriver: async (id) => ({ id, role: 5, isActive: true }),
    readOrder: async () => order(),
    mark: (op) => (putJournal = structuredClone(op)),
    clear: () => (putJournal = null),
    invalidate: async () => {},
    completedReplacement: () => (evidence = "unverified"),
    send: async (p) => {
      puts++;
      payload = p;
      raw = { ...raw, status: 2, towTruckDriverId: p.towTruckDriverId };
    },
  };
  const proposal = () => ({
    kind: "remove",
    orderId: "105",
    driverId: "15",
    snapshot: order().operationSnapshot,
    driverName: "Synthetic driver",
    orderNumber: "TEST105",
    riskConfirmed: true,
  });
  const request = (values = {}) => ({
    snapshot: dispatchSnapshot(order()),
    values: { driverId: "25", cost: "", duration: "", ...values },
  });
  return {
    d,
    a,
    order,
    proposal,
    request,
    get ds() {
      return ds;
    },
    get as() {
      return as;
    },
    get evidence() {
      return evidence;
    },
    get deletes() {
      return deletes;
    },
    get puts() {
      return puts;
    },
    get payload() {
      return payload;
    },
    get deleteJournal() {
      return deleteJournal;
    },
    get putJournal() {
      return putJournal;
    },
    change: (c) => (raw = { ...raw, ...c }),
    restore: (s) => (as = s),
  };
}
async function removed(f) {
  await submit(f.d, f.proposal());
  assert.equal(f.ds.phase, "success");
  assert.equal(f.deletes, 1);
}
test("Ready → Waiting → Ready: separate confirmations, Paid preserved, InterCity driver-only JSON", async () => {
  const f = scenario(),
    finance = f.order().financeSnapshot;
  await removed(f);
  assert.equal(f.order().statusCode, 1);
  assert.equal(f.puts, 0);
  assert.equal(initialAssignmentBlock(f.order(), f.evidence), null);
  await assign(f.a, f.request());
  assert.equal(f.as.phase, "success");
  assert.equal(f.as.message, "r2ReplacementSuccess");
  assert.equal(f.order().statusCode, 2);
  assert.equal(f.order().financeSnapshot, finance);
  assert.equal(JSON.stringify(f.payload), '{"towTruckDriverId":25}');
  assert.equal(f.evidence, "unverified");
});
test("ordinary Paid first assignment is still blocked", async () => {
  const f = scenario({ status: 1, towTruckDriverId: null });
  await assign(f.a, f.request());
  assert.equal(f.puts, 0);
});
test("local quotation schema stays valid but initial assignment is contract-blocked", async () => {
  const f = scenario({
    towTruckServiceType: 1,
    roadId: null,
    status: 1,
    paymentStatus: 1,
    towTruckDriverId: null,
  });
  await assign(f.a, f.request({ cost: "١٥٠", duration: " 35 mins " }));
  assert.equal(
    dispatchDraftSchema(true).safeParse({ driverId: "25", cost: "١٥٠", duration: "35 mins" })
      .success,
    true,
  );
  assert.equal(f.puts, 0);
  assert.equal(f.as.message, "r2LocalEligibilityUnverified");
});
for (const values of [
  { cost: "", duration: "35 mins" },
  { cost: "150", duration: "" },
  { cost: "0", duration: "35 mins" },
])
  test(`invalid local quote ${JSON.stringify(values)} never PUTs`, async () => {
    const f = scenario({
      towTruckServiceType: 1,
      roadId: null,
      status: 1,
      paymentStatus: 1,
      towTruckDriverId: null,
    });
    await assign(f.a, f.request(values));
    assert.equal(f.puts, 0);
    assert.equal(dispatchDraftSchema(true).safeParse({ driverId: "25", ...values }).success, false);
    assert.equal(f.as.message, "r2LocalEligibilityUnverified");
  });
test("InterCity ignores stale quote draft fields and has no required duration", async () => {
  const f = scenario({ status: 1, paymentStatus: 1, towTruckDriverId: null, totalPrice: null });
  assert.equal(
    dispatchDraftSchema(false).safeParse({ driverId: "25", cost: "", duration: "" }).success,
    true,
  );
  await assign(f.a, f.request({ cost: "999", duration: "stale draft" }));
  assert.deepEqual(f.payload, { towTruckDriverId: 25 });
});
for (const raw of [
  { towTruckServiceType: undefined },
  { towTruckServiceType: 99 },
  { towTruckServiceType: 1, serviceType: 2 },
  { towTruckServiceType: 1, roadId: 7 },
])
  test(`unknown/legacy/conflicting service blocks: ${JSON.stringify(raw)}`, async () => {
    const f = scenario({ status: 1, paymentStatus: 1, towTruckDriverId: null, ...raw });
    await assign(f.a, f.request({ cost: "150", duration: "35 mins" }));
    assert.equal(f.puts, 0);
    assert.equal(f.as.message, "r2ServiceUnverified");
  });
test("local replacement cannot reconstruct original cost from total/subtotal", async () => {
  const f = scenario({ towTruckServiceType: 1, roadId: null });
  await removed(f);
  await assign(f.a, f.request({ cost: "150", duration: "35 mins" }));
  assert.equal(f.puts, 0);
  assert.equal(f.as.message, "r2LocalCostUnverified");
});
for (const change of [{ totalPrice: 141 }, { paymentStatus: 1 }, { roadId: 8 }])
  test(`replacement material change blocks ${JSON.stringify(change)}`, async () => {
    const f = scenario();
    await removed(f);
    f.change(change);
    await assign(f.a, f.request());
    assert.equal(f.puts, 0);
    assert.equal(f.as.message, "r2FinancialChanged");
  });
test("same removed driver cannot be selected", async () => {
  const f = scenario();
  await removed(f);
  await assign(f.a, f.request({ driverId: "15" }));
  assert.equal(f.puts, 0);
  assert.equal(f.as.message, "r2SameDriver");
});
test("driver changed since removal review invalidates DELETE", async () => {
  const f = scenario(),
    p = f.proposal();
  f.change({ towTruckDriverId: 16 });
  await submit(f.d, p);
  assert.equal(f.deletes, 0);
});
test("non-Ready removal blocked", async () => {
  const f = scenario({ status: 3 });
  await submit(f.d, f.proposal());
  assert.equal(f.deletes, 0);
});
test("permission loss during assignment preflight blocks PUT", async () => {
  const f = scenario();
  await removed(f);
  f.a.readOrder = async () => {
    f.a.authorized = () => false;
    return f.order();
  };
  await assign(f.a, f.request());
  assert.equal(f.puts, 0);
});
test("inactive selected account blocks PUT", async () => {
  const f = scenario();
  await removed(f);
  f.a.readDriver = async (id) => ({ id, role: 5, isActive: false });
  await assign(f.a, f.request());
  assert.equal(f.puts, 0);
});
test("same-frame duplicate confirmations send at most one DELETE and one PUT", async () => {
  const f = scenario(),
    p = f.proposal();
  await Promise.all([submit(f.d, p), submit(f.d, { ...p })]);
  assert.equal(f.deletes, 1);
  const q = f.request();
  await Promise.all([assign(f.a, q), assign(f.a, { ...q })]);
  assert.equal(f.puts, 1);
});
for (const observed of [false, true])
  test(`uncertain DELETE stays locked after ${observed ? "unassigned" : "unchanged"} GET`, async () => {
    const f = scenario();
    let sends = 0;
    f.d.send = async () => {
      sends++;
      if (observed) f.change({ towTruckDriverId: null, status: 1 });
      throw Error("timeout");
    };
    await submit(f.d, f.proposal());
    assert.equal(f.ds.phase, "uncertain");
    assert.ok(f.deleteJournal);
    assert.equal(f.evidence, "unverified");
    await recover(f.d);
    await submit(f.d, f.proposal());
    assert.equal(sends, 1);
    assert.equal(f.ds.phase, "uncertain");
    await assign(f.a, f.request());
    assert.equal(f.puts, 0);
  });
for (const observed of [false, true])
  test(`uncertain replacement PUT stays locked after ${observed ? "desired" : "unchanged"} GET`, async () => {
    const f = scenario();
    await removed(f);
    let sends = 0;
    f.a.send = async () => {
      sends++;
      if (observed) f.change({ status: 2, towTruckDriverId: 25 });
      throw Error("timeout");
    };
    await assign(f.a, f.request());
    assert.equal(f.as.phase, "uncertain");
    assert.ok(f.putJournal);
    await check(f.a);
    await assign(f.a, f.request());
    assert.equal(sends, 1);
    assert.equal(f.as.phase, "uncertain");
  });
test("explicit assignment rejection preserves Waiting and requires new review", async () => {
  const f = scenario();
  await removed(f);
  const send = f.a.send;
  const request = f.request();
  f.a.send = async () => {
    throw new AppError("generic", "HTTP", 409);
  };
  await assign(f.a, request);
  assert.equal(f.as.phase, "rejected");
  assert.equal(f.as.message, "assignmentConflict");
  assert.equal(f.order().statusCode, 1);
  assert.ok(f.evidence);
  f.a.send = send;
  await assign(f.a, request);
  assert.equal(f.puts, 0);
  await assign(f.a, f.request());
  assert.equal(f.puts, 1);
});
test("acknowledged replacement with changed finance never reports completion", async () => {
  const f = scenario();
  await removed(f);
  const send = f.a.send;
  f.a.send = async (p) => {
    await send(p);
    f.change({ totalPrice: 999 });
  };
  await assign(f.a, f.request());
  assert.equal(f.as.phase, "accepted");
  assert.equal(f.as.message, "r2FinancialChanged");
  assert.ok(f.putJournal);
});
test("changed finance after acknowledged DELETE cannot authorize replacement", async () => {
  const f = scenario(),
    send = f.d.send;
  f.d.send = async () => {
    await send();
    f.change({ totalPrice: 999 });
  };
  await submit(f.d, f.proposal());
  assert.equal(f.ds.phase, "accepted");
  assert.equal(f.evidence, "unverified");
  assert.ok(f.deleteJournal);
});
test("acknowledged PUT recovery verifies recorded driver/Ready and never writes", async () => {
  const f = scenario();
  await removed(f);
  const read = f.a.readOrder,
    send = f.a.send;
  f.a.send = async (p) => {
    await send(p);
    f.a.readOrder = async () => {
      throw Error("offline");
    };
  };
  await assign(f.a, f.request());
  assert.equal(f.as.phase, "accepted");
  const saved = structuredClone(f.putJournal);
  f.restore({ phase: "accepted", operation: saved });
  f.a.readOrder = read;
  await check(f.a);
  assert.equal(f.as.phase, "success");
  assert.equal(f.puts, 1);
});
test("journal identity, actor/order separation and legacy marker fail closed", () => {
  const entries = new Map();
  global.sessionStorage = {
    getItem: (k) => entries.get(k) ?? null,
    setItem: (k, v) => entries.set(k, v),
  };
  entries.set(removalHistoryKey("a", "105"), "review-required");
  assert.equal(readRemovalEvidence("a", "105"), "unverified");
  assert.equal(readRemovalEvidence("b", "105"), null);
  entries.set(
    removalHistoryKey("a", "105"),
    JSON.stringify({ orderId: "106", driverId: "15", finance: "[]", service: "[]" }),
  );
  assert.equal(readRemovalEvidence("a", "105"), "unverified");
  delete global.sessionStorage;
});
test("Arabic/English message parity and InterCity controls gated in UI source", () => {
  const { towTruckAr: ar, towTruckEn: en } = load("src/modules/tow-truck/i18n.ts");
  assert.deepEqual(Object.keys(ar).sort(), Object.keys(en).sort());
  for (const k of Object.keys(ar).filter((k) => k.startsWith("r2"))) {
    assert.ok(ar[k].trim());
    assert.ok(en[k].trim());
  }
  const ui = fs.readFileSync(
    path.join(root, "src/modules/tow-truck/components/TowTruckDispatch.tsx"),
    "utf8",
  );
  assert.ok(ui.includes('dispatchDraftSchema(order.dispatchService === "intracity")'));
  assert.ok(ui.includes("!order.isInterCity &&"));
  assert.ok(!ui.includes('type="hidden"'));
});
function hookHarness() {
  const entries = new Map();
  global.sessionStorage = {
    get length() {
      return entries.size;
    },
    key: (i) => [...entries.keys()][i] ?? null,
    getItem: (k) => entries.get(k) ?? null,
    setItem: (k, v) => entries.set(k, v),
    removeItem: (k) => entries.delete(k),
  };
  const qc = new QueryClient();
  let user = { id: "1", role: "admin", permissions: ["orders.view", "orders.manage"] },
    reads = 0,
    writes = 0;
  const raw = { ...base, status: 1, towTruckDriverId: null };
  hookMocks = {
    react: { useEffect: (fn) => fn() },
    "@tanstack/react-query": {
      useQueryClient: () => qc,
      useQuery: (options) => {
        let data = qc.getQueryData(options.queryKey);
        if (!data) {
          data =
            typeof options.initialData === "function" ? options.initialData() : options.initialData;
          qc.setQueryData(options.queryKey, data);
        }
        return { data };
      },
      useMutation: (options) => ({ mutateAsync: options.mutationFn }),
    },
    "@app/store": {
      store: { getState: () => ({ auth: { user } }) },
      useAppSelector: (fn) => fn({ auth: { user } }),
    },
    "@modules/orders/api/ordersApi": {
      ordersApi: {
        get: async () => {
          reads++;
          return { ...raw };
        },
        assignTowTruckDriver: async () => {
          writes++;
        },
      },
    },
    "@modules/orders/hooks/useOrdersQueries": {
      orderKeys: { all: ["orders"], detail: (id) => ["orders", id] },
    },
    "@modules/admin/hooks/useAdminQueries": { adminKeys: { user: (id) => ["user", id] } },
    "@modules/admin/api/adminApi": {
      adminApi: { getUser: async (id) => ({ id, role: 5, isActive: true }) },
    },
  };
  const hook = () =>
    load("src/modules/tow-truck/hooks/useInitialAssignment.ts").useInitialAssignment("105");
  return {
    entries,
    qc,
    hook,
    raw,
    get reads() {
      return reads;
    },
    get writes() {
      return writes;
    },
    setUser: (v) => (user = v),
    dispose: () => {
      qc.clear();
      hookMocks = undefined;
      delete global.sessionStorage;
      cache.delete(path.resolve(root, "src/modules/tow-truck/hooks/useInitialAssignment.ts"));
    },
  };
}

test("actual assignment hook restores unresolved identity; desired GET cannot unlock", async () => {
  const h = hookHarness();
  try {
    const marker = "miqwad:initial-assignment:1:105";
    const record = {
      orderId: "105",
      driverId: "25",
      service: serviceSnapshot(adaptTowTruck(h.raw)),
    };
    h.entries.set(marker, JSON.stringify(record));
    h.raw.status = 2;
    h.raw.towTruckDriverId = 25;
    const hook = h.hook();
    assert.equal(hook.state.phase, "uncertain");
    await hook.check();
    assert.equal(h.hook().state.phase, "uncertain");
    assert.equal(h.entries.get(marker), JSON.stringify(record));
    assert.equal(h.reads, 1);
    assert.equal(h.writes, 0);
  } finally {
    h.dispose();
  }
});
test("actual hook restores acknowledged PUT and retires journal only after verified GET", async () => {
  const h = hookHarness();
  try {
    const marker = "miqwad:initial-assignment:1:105";
    const record = {
      orderId: "105",
      driverId: "25",
      service: serviceSnapshot(adaptTowTruck(h.raw)),
      receipt: { towTruckDriverId: 25 },
    };
    h.entries.set(marker, JSON.stringify(record));
    h.raw.status = 2;
    h.raw.towTruckDriverId = 25;
    assert.equal(h.hook().state.phase, "accepted");
    await h.hook().check();
    assert.equal(h.hook().state.phase, "success");
    assert.equal(h.entries.has(marker), false);
    assert.equal(h.writes, 0);
  } finally {
    h.dispose();
  }
});
test("actual hook permission loss prevents recovery reads without losing marker", async () => {
  const h = hookHarness();
  try {
    h.entries.set("miqwad:initial-assignment:1:105", "pending");
    const hook = h.hook();
    h.setUser({ id: "2", permissions: ["orders.view"] });
    await hook.check();
    assert.equal(h.reads, 0);
    assert.equal(h.writes, 0);
    assert.equal(h.entries.size, 1);
  } finally {
    h.dispose();
  }
});
test("later verified removal starts new review cycle; attempt-only marker cannot", () => {
  const h = hookHarness();
  try {
    const key = ["tow-truck-assignment-outcome", "1", "105"];
    h.qc.setQueryData(key, {
      phase: "success",
      operation: { orderId: "105", driverId: "25", service: serviceSnapshot(adaptTowTruck(h.raw)) },
    });
    h.entries.set(removalHistoryKey("1", "105"), "review-required");
    h.hook();
    assert.equal(h.qc.getQueryData(key).phase, "success");
    h.entries.set(
      removalHistoryKey("1", "105"),
      JSON.stringify({
        orderId: "105",
        driverId: "25",
        finance: adaptTowTruck(h.raw).financeSnapshot,
        service: serviceSnapshot(adaptTowTruck(h.raw)),
      }),
    );
    h.hook();
    assert.equal(h.qc.getQueryData(key).phase, "idle");
    assert.equal(h.writes, 0);
  } finally {
    h.dispose();
  }
});
test("missing replacement financial projection blocks even after acknowledged removal", async () => {
  const f = scenario({ subtotal: null, totalPrice: null });
  await removed(f);
  await assign(f.a, f.request());
  assert.equal(f.puts, 0);
  assert.equal(f.as.message, "r2FinancialChanged");
});
test("explicit legacy local alias still requires unavailable first-assignment proof", async () => {
  const f = scenario({
    towTruckServiceType: null,
    serviceType: 1,
    roadId: null,
    status: 1,
    paymentStatus: 1,
    towTruckDriverId: null,
  });
  await assign(f.a, f.request({ cost: "150", duration: "35 mins" }));
  assert.equal(f.puts, 0);
  assert.equal(f.as.message, "r2LocalEligibilityUnverified");
});

for (const context of ["new session", "different administrator", "lost markers"]) {
  test(`H1: ${context} cannot turn a removed local order into a new quote`, async () => {
    const f = scenario({ towTruckServiceType: 1, roadId: null, paymentStatus: 1 });
    await removed(f);
    const h = hookHarness();
    try {
      Object.assign(h.raw, { towTruckServiceType: 1, roadId: null, paymentStatus: 1 });
      const receipt = JSON.stringify(f.evidence);
      if (context === "different administrator") {
        h.entries.set(removalHistoryKey("1", "105"), receipt);
        h.setUser({ id: "2", role: "admin", permissions: ["orders.view", "orders.manage"] });
      } else if (context === "lost markers") {
        h.entries.set(removalHistoryKey("1", "105"), receipt);
        h.entries.clear();
      }
      const hook = h.hook();
      const order = adaptTowTruck(h.raw);
      assert.equal(hook.block(order), "r2LocalEligibilityUnverified");
      await hook.submit({
        snapshot: dispatchSnapshot(order),
        values: { driverId: "25", cost: "999", duration: "90 minutes" },
      });
      assert.equal(h.writes, 0);
      assert.equal(h.hook().state.message, "r2LocalEligibilityUnverified");
    } finally {
      h.dispose();
    }
  });
}
test("H1: zero/missing/nonzero totals and null/zero/Pending payment never prove local first assignment", async () => {
  for (const paymentStatus of [null, 0, 1])
    for (const total of [undefined, 0, 150]) {
      const f = scenario({
        towTruckServiceType: 1,
        roadId: null,
        status: 1,
        towTruckDriverId: null,
        paymentStatus,
        subtotal: total,
        totalPrice: total,
      });
      assert.equal(initialAssignmentBlock(f.order()), "r2LocalEligibilityUnverified");
      await assign(f.a, f.request({ cost: "999", duration: "90 minutes" }));
      assert.equal(f.puts, 0);
      assert.equal(f.as.message, "r2LocalEligibilityUnverified");
    }
});
for (const observation of ["matching", "delayed", "changed driver", "failed GET"]) {
  test(`H2: 202 success:true with ${observation} stays unresolved across recovery/reload`, async () => {
    const f = scenario({ status: 1, paymentStatus: 1, towTruckDriverId: null });
    let puts = 0;
    transport = async (method, url, payload, config) => {
      assert.equal(method, "PUT");
      assert.equal(url, "/Orders/105/tow-truck-driver");
      assert.deepEqual(payload, { towTruckDriverId: 25 });
      assert.equal(config._retry, true);
      puts++;
      if (observation === "matching") f.change({ status: 2, towTruckDriverId: 25 });
      if (observation === "changed driver") f.change({ status: 2, towTruckDriverId: 35 });
      if (observation === "failed GET")
        f.a.readOrder = async () => {
          throw new Error("offline");
        };
      return { status: 202, data: { success: true } };
    };
    f.a.send = (p) => ordersApi.assignTowTruckDriver("105", p);
    await assign(f.a, f.request());
    assert.equal(f.as.phase, "uncertain");
    assert.equal(f.putJournal.orderId, "105");
    assert.equal(f.putJournal.driverId, "25");
    assert.equal(f.putJournal.receipt, undefined);
    const journal = structuredClone(f.putJournal);
    f.a.readOrder = async () => f.order();
    f.change({ status: 2, towTruckDriverId: 25 });
    await check(f.a);
    await assign(f.a, f.request());
    assert.equal(f.as.phase, "uncertain");
    assert.equal(puts, 1);
    assert.deepEqual(f.putJournal, journal);
    const h = hookHarness();
    try {
      const marker = "miqwad:initial-assignment:1:105";
      h.entries.set(marker, JSON.stringify(journal));
      Object.assign(h.raw, { status: 2, towTruckDriverId: 25 });
      await h.hook().check();
      assert.equal(h.hook().state.phase, "uncertain");
      assert.equal(h.entries.get(marker), JSON.stringify(journal));
      assert.equal(h.writes, 0);
    } finally {
      h.dispose();
    }
  });
}
test("H2: only documented 200 success:true acknowledges; other resolved statuses stay uncertain", async () => {
  for (const status of [201, 202, 204, 206, undefined]) {
    transport = async () => ({ status, data: { success: true } });
    await assert.rejects(
      () => ordersApi.assignTowTruckDriver("105", { towTruckDriverId: 25 }),
      (e) => e.code === "ASSIGNMENT_UNCERTAIN",
    );
  }
  const f = scenario({ status: 1, paymentStatus: 1, towTruckDriverId: null });
  let puts = 0;
  transport = async () => {
    puts++;
    f.change({ status: 2, towTruckDriverId: 25 });
    return { status: 200, data: { success: true } };
  };
  f.a.send = (p) => ordersApi.assignTowTruckDriver("105", p);
  await assign(f.a, f.request());
  assert.equal(puts, 1);
  assert.equal(f.as.phase, "success");
  assert.equal(f.putJournal, null);
});
(async () => {
  for (const [name, fn] of tests) {
    await fn();
    console.log(`PASS ${name}`);
  }
  console.log(
    `${tests.length} R2 checks passed. Synthetic transport only; UI source assertions are NOT browser tests.`,
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
