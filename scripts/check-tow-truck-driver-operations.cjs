/** Offline regression checks: real workflow/API modules, stubbed transport, no network. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const req = createRequire(path.join(root, "package.json"));
const ts = req("typescript");
const cache = new Map();
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
const rawOrder = {
  id: 19,
  orderNumber: "REQ-19",
  orderType: 3,
  status: 1,
  paymentStatus: 1,
  paymentMethod: 3,
  towTruckDriverId: 15,
  towTruckDriverFullName: "Driver",
  userId: 22,
  subtotal: 150,
  discountAmount: 0,
  totalPrice: 150,
  duration: "30 minutes",
};
const driver = { id: "15", fullName: "Driver", role: 5, isActive: true };
function fixture(kind = "remove", options = {}) {
  let raw = { ...rawOrder, ...options.raw },
    user = { ...driver, isActive: kind !== "activate", ...options.user };
  let state = options.state ?? { phase: "idle" },
    sent = 0,
    orderReads = 0,
    userReads = 0,
    journal = null;
  const events = [];
  const proposal = {
    kind,
    orderId: "19",
    driverId: "15",
    driverName: "Driver",
    orderNumber: "REQ-19",
    snapshot: kind === "remove" ? adaptTowTruck(raw).operationSnapshot : driverSnapshot(user),
    note: "  operational review  ",
    riskConfirmed: options.risk ?? true,
  };
  const d = {
    get: () => state,
    set: (value) => {
      state = value;
    },
    authorized: () => true,
    conflict: () => false,
    readOrder: async () => {
      orderReads++;
      events.push("order");
      return adaptTowTruck(raw);
    },
    readDriver: async () => {
      userReads++;
      events.push("user");
      return { ...user };
    },
    mark: (op) => {
      journal = { ...op };
      events.push("mark");
    },
    clear: () => {
      journal = null;
      events.push("clear");
    },
    invalidate: async () => {
      events.push("invalidate");
    },
    send: async (op, note) => {
      sent++;
      events.push(op.kind);
      assert.equal(op.driverId, "15");
      assert.notEqual(op.driverId, String(raw.userId));
      if (op.kind === "remove") {
        assert.equal(note, undefined);
        raw = { ...raw, towTruckDriverId: null };
      } else {
        if (op.kind === "deactivate") assert.equal(note, "operational review");
        else assert.equal(note, undefined);
        user = { ...user, isActive: op.kind === "activate" };
      }
    },
    ...options.deps,
  };
  return {
    d,
    proposal,
    get state() {
      return state;
    },
    get sent() {
      return sent;
    },
    get journal() {
      return journal;
    },
    get raw() {
      return raw;
    },
    get user() {
      return user;
    },
    get orderReads() {
      return orderReads;
    },
    get userReads() {
      return userReads;
    },
    events,
    changeOrder: (change) => {
      raw = { ...raw, ...change };
    },
    changeUser: (change) => {
      user = { ...user, ...change };
    },
  };
}
const cases = [];
const test = (name, fn) => cases.push([name, fn]);
for (const kind of ["remove", "activate", "deactivate"]) {
  test(`${kind}: acknowledgment + authoritative GET required; no financial or assignment side effect`, async () => {
    const f = fixture(kind);
    await submit(f.d, f.proposal);
    assert.equal(f.sent, 1);
    assert.equal(f.state.phase, "success");
    assert.equal(f.journal, null);
    assert.ok(f.events.indexOf("mark") < f.events.indexOf(kind));
    assert.ok(
      f.events.lastIndexOf(kind) < f.events.lastIndexOf(kind === "remove" ? "order" : "user"),
    );
    assert.equal(f.raw.totalPrice, 150);
    assert.equal(f.raw.paymentStatus, 1);
    if (kind !== "remove") assert.equal(f.raw.towTruckDriverId, 15);
    if (kind === "remove") assert.equal(f.user.isActive, true);
  });
  test(`${kind}: double click and same confirmation replay send once`, async () => {
    const f = fixture(kind);
    await Promise.all([submit(f.d, f.proposal), submit(f.d, f.proposal)]);
    await submit(f.d, f.proposal);
    assert.equal(f.sent, 1);
  });
  test(`${kind}: fresh permission loss and concurrent initial assignment prevent send`, async () => {
    for (const key of ["authorized", "conflict"]) {
      const f = fixture(kind);
      let checks = 0;
      f.d[key] = () => (++checks === 1 ? key === "authorized" : key !== "authorized");
      await submit(f.d, f.proposal);
      assert.equal(f.sent, 0);
    }
  });
  test(`${kind}: timeout reconciles without replay and requires NEW confirmation`, async () => {
    const f = fixture(kind);
    let sends = 0;
    f.d.send = async () => {
      sends++;
      throw new AppError("hidden", "TIMEOUT");
    };
    await submit(f.d, f.proposal);
    assert.equal(sends, 1);
    assert.equal(f.state.phase, "retryable");
    await submit(f.d, f.proposal);
    assert.equal(sends, 1);
    await submit(f.d, { ...f.proposal });
    assert.equal(sends, 2);
  });
  test(`${kind}: ambiguous failure + failed GET locks retry and GET recovery observes result`, async () => {
    const f = fixture(kind),
      read = kind === "remove" ? "readOrder" : "readDriver",
      original = f.d[read];
    let failed = false,
      sends = 0;
    f.d[read] = async () => {
      if (failed) throw new Error("offline");
      return original();
    };
    f.d.send = async () => {
      sends++;
      failed = true;
      throw new Error("offline");
    };
    await submit(f.d, f.proposal);
    assert.equal(f.state.phase, "uncertain");
    assert.ok(f.journal);
    await submit(f.d, { ...f.proposal });
    assert.equal(sends, 1);
    failed = false;
    if (kind === "remove") f.changeOrder({ towTruckDriverId: null });
    else f.changeUser({ isActive: kind === "activate" });
    await recover(f.d);
    assert.equal(sends, 1);
    assert.equal(f.state.phase, "observed");
    assert.equal(f.journal, null);
  });
  test(`${kind}: acknowledged success + failed/stale GET remains accepted and cannot resend`, async () => {
    const f = fixture(kind);
    let accepted = false,
      sends = 0;
    const read = kind === "remove" ? "readOrder" : "readDriver",
      original = f.d[read];
    f.d.send = async () => {
      accepted = true;
      sends++;
    };
    f.d[read] = async () => {
      if (accepted) throw new Error("offline");
      return original();
    };
    await submit(f.d, f.proposal);
    assert.equal(f.state.phase, "accepted");
    assert.equal(f.state.message, "opsRefreshFailed");
    await submit(f.d, { ...f.proposal });
    assert.equal(sends, 1);
    f.d[read] = original;
    await recover(f.d);
    assert.equal(f.state.phase, "accepted");
    assert.equal(f.state.message, "opsAwaitingRead");
    assert.equal(sends, 1);
  });
  test(`${kind}: known 400/401/403/404/409/422 and success:false stay rejected`, async () => {
    for (const status of [400, 401, 403, 404, 409, 422, undefined]) {
      const f = fixture(kind);
      f.d.send = async () => {
        throw new AppError("untrusted", status ? "REJECTED" : "OP_REJECTED", status);
      };
      await submit(f.d, f.proposal);
      assert.equal(f.state.phase, "rejected");
      assert.equal(f.journal, null);
      if (![401, 403].includes(status)) assert.ok(f.events.includes("invalidate"));
      assert.equal(f.raw.towTruckDriverId, 15);
      assert.equal(f.user.isActive, kind !== "activate");
    }
  });
  test(`${kind}: no preflight GET means no mutation; durable marker must succeed`, async () => {
    const f = fixture(kind);
    f.d[kind === "remove" ? "readOrder" : "readDriver"] = async () => {
      throw new Error("offline");
    };
    await submit(f.d, f.proposal);
    assert.equal(f.sent, 0);
    assert.equal(f.state.message, "opsPreflightFailed");
    const g = fixture(kind);
    g.d.mark = () => {
      throw new Error("storage denied");
    };
    await submit(g.d, g.proposal);
    assert.equal(g.sent, 0);
    assert.equal(g.state.message, "opsStorage");
  });
  test(`${kind}: permission revoked after send prevents recovery GET`, async () => {
    const f = fixture(kind);
    const send = f.d.send;
    f.d.send = async (...args) => {
      await send(...args);
      f.d.authorized = () => false;
    };
    await submit(f.d, f.proposal);
    assert.equal(f.state.phase, "accepted");
    assert.equal(f.state.message, "opsForbidden");
    assert.equal(f.orderReads + f.userReads, 1);
  });
}
test("paid/unknown removal remains possible with stronger acknowledgment; numeric 2 is not invented Paid", async () => {
  for (const paymentStatus of ["Paid", 2, 3, 4, null, undefined, "invalid"]) {
    const f = fixture("remove", { raw: { paymentStatus } });
    assert.equal(
      adaptTowTruck(f.raw).removalPayment,
      paymentStatus === "Paid" ? "paid" : "unknown",
    );
    await submit(f.d, f.proposal);
    assert.equal(f.sent, 1);
    const g = fixture("remove", { raw: { paymentStatus }, risk: false });
    await submit(g.d, g.proposal);
    assert.equal(g.sent, 0);
    assert.equal(g.state.message, "opsRiskRequired");
  }
});
test("unassigned, zero, missing driver identity and non-tow order cannot be removed", async () => {
  for (const towTruckDriverId of [null, 0, undefined, -1, "15"]) {
    const f = fixture("remove", { raw: { towTruckDriverId } });
    await submit(f.d, f.proposal);
    assert.equal(f.sent, 0);
  }
  const f = fixture();
  f.changeOrder({ orderType: 1 });
  await submit(f.d, f.proposal);
  assert.equal(f.sent, 0);
});
test("invalid order/account IDs are rejected without reads", async () => {
  for (const key of ["driverId", "orderId"])
    for (const value of ["0", "-1", "01", "NaN", "9007199254740992"]) {
      const f = fixture();
      f.proposal[key] = value;
      await submit(f.d, f.proposal);
      assert.equal(f.sent, 0);
      assert.equal(f.orderReads, 0);
    }
});
test("driver/payment/order status/quote changes invalidate removal confirmation", async () => {
  for (const change of [
    { towTruckDriverId: 16 },
    { paymentStatus: 2 },
    { status: 4 },
    { totalPrice: 200 },
    { duration: "changed" },
    { id: 20 },
  ]) {
    const f = fixture();
    f.changeOrder(change);
    await submit(f.d, f.proposal);
    assert.equal(f.sent, 0);
    assert.equal(f.state.message, "opsChanged");
  }
});
test("timeout + different driver never removes the replacement", async () => {
  const f = fixture();
  let sends = 0;
  f.d.send = async () => {
    sends++;
    f.changeOrder({ towTruckDriverId: 16 });
    throw new Error("timeout");
  };
  await submit(f.d, f.proposal);
  assert.equal(sends, 1);
  assert.equal(f.state.message, "opsDifferentDriver");
  assert.equal(f.state.phase, "observed");
});
test("financial changes are presented from GET with a warning; never overwritten", async () => {
  const f = fixture();
  const send = f.d.send;
  f.d.send = async (...args) => {
    await send(...args);
    f.changeOrder({ totalPrice: 120, paymentStatus: 2 });
  };
  await submit(f.d, f.proposal);
  assert.equal(f.state.financialWarning, true);
  assert.equal(f.raw.totalPrice, 120);
  assert.equal(f.raw.paymentStatus, 2);
});
test("role, identity, unknown account state or concurrently changed status block account operations", async () => {
  for (const kind of ["activate", "deactivate"])
    for (const change of [
      { role: 1 },
      { id: "22" },
      { isActive: undefined },
      { isActive: "true" },
      { isActive: kind === "activate" },
      { fullName: "changed" },
    ]) {
      const f = fixture(kind);
      f.changeUser(change);
      await submit(f.d, f.proposal);
      assert.equal(f.sent, 0);
      assert.equal(f.state.message, "opsAccountChanged");
    }
});
test("reason is required, trimmed, 1–500 characters; invalid reason never sends PATCH", async () => {
  for (const note of [undefined, "", "   ", "x".repeat(501)]) {
    const f = fixture("deactivate");
    f.proposal.note = note;
    await submit(f.d, f.proposal);
    assert.equal(f.sent, 0);
    assert.equal(f.state.message, "opsReasonInvalid");
  }
  assert.equal(noteSchema.safeParse({ note: "x".repeat(500) }).success, true);
  assert.deepEqual(noteSchema.parse({ note: " reason " }), { note: "reason" });
});
test("permissions separate orders, Users suspend and Users restore, and reject changed actors", () => {
  const user = { id: "2", role: "customer", permissions: ["orders.view", "orders.manage"] };
  assert.equal(allowed("2", user, "remove"), true);
  assert.equal(allowed("2", user, "activate"), false);
  assert.equal(allowed("2", user, "deactivate"), false);
  for (const [kind, permission] of [
    ["activate", "users.restore"],
    ["deactivate", "users.suspend"],
  ]) {
    const account = { ...user, permissions: ["orders.view", "users.view", permission] };
    assert.equal(allowed("2", account, kind), true);
    assert.equal(allowed("2", account, "remove"), false);
    assert.equal(allowed("3", account, kind), false);
    assert.equal(allowed("2", { ...account, permissions: [permission] }, kind), false);
  }
  assert.equal(allowed("2", null, "remove"), false);
  assert.equal(allowed("2", { id: "2", role: "admin" }, "remove"), true);
});
test("transport: DELETE has no body; controlled PATCH uses correct ID/body and opts out of auth replay", async () => {
  const calls = [];
  transport = async (...args) => {
    calls.push(args);
    return { status: 200, data: { success: true, data: null } };
  };
  await ordersApi.removeTowTruckDriver("19");
  await deactivateUser(15, "reason", true);
  await activateUser(15, true);
  assert.deepEqual(calls, [
    ["DELETE", "/Orders/19/tow-truck-driver", { _retry: true }],
    ["PATCH", "/Users/15/deactivate", { note: "reason" }, { _retry: true }],
    ["PATCH", "/Users/15/activate", undefined, { _retry: true }],
  ]);
  calls.length = 0;
  await deactivateUser(15, "reason");
  await activateUser(15);
  assert.equal(calls[0][3], undefined);
  assert.equal(calls[1][3], undefined);
});
test("shared Users read preserves raw role/status; no false active default", async () => {
  for (const isActive of [true, false, undefined, "false"]) {
    transport = async (method, url) => {
      assert.equal(method, "GET");
      assert.equal(url, "/Users/15");
      return {
        status: 200,
        data: { success: true, data: { id: 15, fullName: "Driver", roleId: 5, isActive } },
      };
    };
    const user = await adminApi.getUser("15");
    assert.equal(user.id, "15");
    assert.equal(user.role, 5);
    assert.equal(user.isActive, isActive);
  }
});
test("controlled Users preflight rejects explicit failure even with valid-looking account data", async () => {
  transport = async () => ({
    status: 200,
    data: { success: false, data: { id: 15, roleId: 5, isActive: true } },
  });
  await assert.rejects(() => adminApi.getUser("15", true), AppError);
});
test("success acknowledgment is strict; false/malformed never succeeds, empty 204 works", () => {
  for (const response of [
    { status: 200, data: { success: true, data: null } },
    { status: 204, data: "" },
    { status: 204, data: undefined },
  ])
    assert.doesNotThrow(() => confirmMutation(response));
  for (const response of [
    { status: 200, data: null },
    { status: 200, data: { success: "true" } },
    { status: 200, data: { success: false } },
    { status: 204, data: { success: false } },
    { status: 202, data: { success: true } },
  ])
    assert.throws(() => confirmMutation(response), AppError);
});
test("malformed API acknowledgment enters GET reconciliation, not success or automatic replay", async () => {
  let calls = 0;
  transport = async () => {
    calls++;
    return { status: 200, data: null };
  };
  const f = fixture();
  f.d.send = () => ordersApi.removeTowTruckDriver("19");
  await submit(f.d, f.proposal);
  assert.equal(calls, 1);
  assert.equal(f.state.phase, "retryable");
});
test("5xx and network failures never bypass GET reconciliation", async () => {
  for (const status of [500, 502, 503, undefined]) {
    const f = fixture();
    f.d.send = async () => {
      throw new AppError("hidden", "SERVER", status);
    };
    await submit(f.d, f.proposal);
    assert.equal(f.orderReads, 2);
    assert.equal(f.state.phase, "retryable");
  }
});
test("conflict refreshes a changed order while retaining rejection; failed refresh is distinguished", async () => {
  const f = fixture();
  f.d.send = async () => {
    f.changeOrder({ towTruckDriverId: 16 });
    throw new AppError("hidden", "CONFLICT", 409);
  };
  await submit(f.d, f.proposal);
  assert.equal(f.orderReads, 2);
  assert.equal(f.state.phase, "rejected");
  assert.equal(f.state.message, "opsConflict");
  const g = fixture();
  g.d.send = async () => {
    g.d.readOrder = async () => {
      throw new Error("offline");
    };
    throw new AppError("hidden", "CONFLICT", 409);
  };
  await submit(g.d, g.proposal);
  assert.equal(g.state.phase, "rejected");
  assert.equal(g.state.refreshFailed, true);
});
function memoryStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key: (i) => [...values.keys()][i] ?? null,
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
}
test("journal survives reload with only operation IDs; corrupted entries lock safely", () => {
  global.sessionStorage = memoryStorage();
  const op = { kind: "remove", orderId: "19", driverId: "15" };
  guards.writeDriverJournal("2", op);
  assert.equal(guards.readDriverJournal("2").phase, "uncertain");
  assert.equal(guards.removalHistory("2", "19"), true);
  guards.writeDriverJournal("2", { ...op, acknowledged: true });
  assert.equal(guards.readDriverJournal("2").phase, "accepted");
  const data = JSON.parse(sessionStorage.getItem(guards.driverOperationMarker("2")));
  assert.deepEqual(Object.keys(data).sort(), ["acknowledged", "driverId", "kind", "orderId"]);
  sessionStorage.setItem(guards.driverOperationMarker("2"), "broken");
  assert.equal(guards.readDriverJournal("2").message, "opsRecoveryMissing");
  sessionStorage = memoryStorage();
  sessionStorage.getItem = () => {
    throw new Error("blocked");
  };
  assert.equal(guards.readDriverJournal("2").phase, "uncertain");
});
test("shared actor lock spans requests and account/removal actions; initial assignment cannot race", async () => {
  global.sessionStorage = memoryStorage();
  const qc = new QueryClient();
  assert.equal(guards.driverOperationBlocks(qc, "2"), false);
  qc.setQueryData(guards.driverOperationKey("2"), { phase: "busy" });
  assert.equal(guards.driverOperationBlocks(qc, "2"), true);
  assert.equal(guards.driverOperationBlocks(qc, "3"), false);
  qc.setQueryData(guards.driverOperationKey("2"), { phase: "idle" });
  guards.writeDriverJournal("2", { kind: "deactivate", orderId: "19", driverId: "15" });
  assert.equal(guards.driverOperationBlocks(qc, "2"), true);
  assert.equal(guards.initialOperationBlocks(qc, "2"), false);
  qc.setQueryData(["tow-truck-assignment-outcome", "2", "20"], { phase: "busy" });
  assert.equal(guards.initialOperationBlocks(qc, "2"), true);
  qc.clear();
  sessionStorage.setItem("miqwad:initial-assignment:2:20", "pending");
  assert.equal(guards.initialOperationBlocks(qc, "2"), true);
  const f = fixture();
  f.d.conflict = () => guards.initialOperationBlocks(qc, "2");
  await submit(f.d, f.proposal);
  assert.equal(f.sent, 0);
});
test("new operation cannot run concurrently with another operation using the same query state", async () => {
  const f = fixture();
  const second = { ...f.proposal, kind: "deactivate", snapshot: driverSnapshot(driver) };
  await Promise.all([submit(f.d, f.proposal), submit(f.d, second)]);
  assert.equal(f.sent, 1);
  assert.equal(f.user.isActive, true);
});
test("reloaded pending operation reconciles read-only and conservatively flags financial comparison", async () => {
  global.sessionStorage = memoryStorage();
  guards.writeDriverJournal("2", { kind: "remove", orderId: "19", driverId: "15" });
  const f = fixture("remove", {
    state: guards.readDriverJournal("2"),
    raw: { towTruckDriverId: null },
  });
  await recover(f.d);
  assert.equal(f.sent, 0);
  assert.equal(f.state.phase, "observed");
  assert.equal(f.state.financialWarning, true);
});
test("AR/EN operation messages are complete and do not advertise availability", () => {
  const { towTruckAr: ar, towTruckEn: en } = load("src/modules/tow-truck/i18n.ts");
  assert.deepEqual(Object.keys(ar).sort(), Object.keys(en).sort());
  for (const [key, value] of Object.entries(ar))
    if (key.startsWith("ops")) {
      assert.ok(value.trim());
      assert.ok(en[key].trim());
    }
  assert.match(en.opsAvailability, /unknown/);
  assert.match(ar.opsAvailability, /غير معروف/);
  const source = fs.readFileSync(
    path.join(root, "src/modules/tow-truck/components/TowTruckDriverOperations.tsx"),
    "utf8",
  );
  assert.ok(source.includes("dir={i18n.dir()}"));
  assert.ok(source.includes("onCloseAutoFocus"));
  assert.ok(source.includes("onEscapeKeyDown"));
});
(async () => {
  for (const [name, fn] of cases) {
    await fn();
    console.log(`PASS ${name}`);
  }
  console.log(`PASS ${cases.length} driver operations checks (offline; no live mutations)`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
