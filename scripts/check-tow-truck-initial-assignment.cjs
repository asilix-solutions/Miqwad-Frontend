/** Offline contract/regression checks. Transport is stubbed; no network calls. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const req = createRequire(path.join(root, "package.json"));
const ts = req("typescript");
const cache = new Map();
let transport;
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
          put: (...args) => transport(...args),
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
const { adaptTowTruck } = load("src/modules/tow-truck/lib/towTruckModel.ts");
const {
  dispatchSnapshot,
  initialAssignmentBlock,
  quoteCostError,
  dispatchDraftSchema,
  reviewMatchesDraft,
  nextActionMessage,
} = load("src/modules/tow-truck/lib/dispatchModel.ts");
const { submitInitialAssignment: submit, checkAssignmentOutcome: checkOutcome } = load(
  "src/modules/tow-truck/lib/initialAssignment.ts",
);
const { AppError } = load("src/shared/types/api.ts");
const { ordersApi } = load("src/modules/orders/api/ordersApi.ts");
const original = {
  id: 19,
  orderType: 3,
  status: 1,
  paymentStatus: null,
  paymentMethod: 3,
  towTruckDriverId: null,
  userId: 2,
  userFullName: "Customer",
  createdAt: "2026-10-11T09:00:00Z",
  subtotal: 0,
  totalPrice: 0,
  discountAmount: 0,
};
const driver = { id: "15", role: 5, isActive: true, fullName: "Driver" };
let request = {
  values: { driverId: "15", cost: "150.00", duration: " 30 دقيقة " },
  snapshot: dispatchSnapshot(adaptTowTruck(original)),
};
const payload = { towTruckDriverId: 15, cost: 150, duration: "30 دقيقة" };
function setup(options = {}) {
  let state = options.state ?? { phase: "idle" },
    raw = { ...original, ...options.raw };
  let sent = 0,
    marked = false,
    reads = 0;
  const events = [];
  const deps = {
    orderId: "19",
    authorized: () => true,
    get: () => state,
    set: (next) => {
      state = next;
    },
    readDriver: async () => {
      events.push("driver");
      return driver;
    },
    readOrder: async () => {
      events.push("order");
      reads++;
      return adaptTowTruck(raw);
    },
    mark: () => {
      marked = true;
      events.push("mark");
    },
    clear: () => {
      marked = false;
    },
    invalidate: async () => {
      events.push("invalidate");
    },
    send: async (value) => {
      events.push("put");
      sent++;
      assert.deepEqual(value, payload);
      raw = {
        ...raw,
        towTruckDriverId: 15,
        duration: "30 دقيقة",
        subtotal: 150,
        totalPrice: 150,
        paymentStatus: 1,
      };
    },
    ...options.deps,
  };
  return {
    deps,
    events,
    state: () => state,
    sent: () => sent,
    marked: () => marked,
    reads: () => reads,
    setRaw: (next) => {
      raw = { ...raw, ...next };
    },
  };
}
let checks = 0;
async function test(name, run) {
  request = { ...request, values: { ...request.values } };
  await run();
  checks++;
  console.log(`PASS ${name}`);
}
async function main() {
  await test("eligible initial assignment: fresh driver/order, one PUT, fresh GET, Pending not paid", async () => {
    const x = setup();
    await submit(x.deps, request);
    assert.deepEqual(x.events, ["driver", "order", "mark", "put", "invalidate", "order"]);
    assert.equal(x.sent(), 1);
    assert.equal(x.state().phase, "success");
    assert.equal(x.marked(), false);
    assert.equal(adaptTowTruck({ ...original, paymentStatus: 1 }).paymentPending, true);
    assert.equal(adaptTowTruck({ ...original, paymentStatus: 2 }).paymentPending, false);
  });
  await test("assigned, absent assignment, unknown stages and noninitial payments cannot write", async () => {
    for (const raw of [
      { towTruckDriverId: 15 },
      { towTruckDriverId: undefined },
      { towTruckDriverId: 0 },
      { status: 2 },
      { status: 5 },
      { status: 99 },
      { paymentStatus: 2 },
      { paymentStatus: 4 },
      { paymentStatus: 99 },
      { paymentStatus: "Paid" },
      { paymentStatus: NaN },
      { paymentStatus: {} },
    ]) {
      const x = setup({ raw });
      await submit(x.deps, request);
      assert.equal(x.sent(), 0);
      assert.equal(x.state().phase, "rejected");
    }
    for (const paymentStatus of [null, 0, 1])
      assert.equal(initialAssignmentBlock(adaptTowTruck({ ...original, paymentStatus })), null);
  });
  await test("wrong order identity/type cannot write", async () => {
    for (const raw of [{ id: 20 }, { orderType: 2 }]) {
      const x = setup({ raw });
      await submit(x.deps, request);
      assert.equal(x.sent(), 0);
    }
  });
  await test("driver identity/role/active account checked immediately before PUT", async () => {
    for (const row of [
      { ...driver, id: "16" },
      { ...driver, role: 4 },
      { ...driver, isActive: false },
    ]) {
      const x = setup({ deps: { readDriver: async () => row } });
      await submit(x.deps, request);
      assert.equal(x.sent(), 0);
      assert.equal(
        x.state().message,
        row.id !== "15" ? "driverChanged" : row.role !== 5 ? "driverWrongRole" : "driverInactive",
      );
    }
  });
  await test("cost/duration/unsafe identifiers validated before any GET or PUT", async () => {
    for (const change of [
      { cost: "0" },
      { cost: "-1" },
      { cost: "Infinity" },
      { cost: "1e9" },
      { cost: "1,000" },
      { cost: "9007199254740992" },
      { cost: "150.12345678901234567890" },
      { duration: " " },
      { duration: "x".repeat(101) },
      { driverId: "9007199254740992" },
    ]) {
      const x = setup();
      await submit(x.deps, { ...request, values: { ...request.values, ...change } });
      assert.equal(x.sent(), 0);
      assert.deepEqual(x.events, []);
    }
  });
  await test("changed financial snapshot requires a new review", async () => {
    const x = setup({ raw: { totalPrice: 50 } });
    await submit(x.deps, request);
    assert.equal(x.sent(), 0);
    assert.equal(x.state().message, "requestChanged");
  });
  await test("permission denied and permission revoked during preflight cannot write", async () => {
    let authorized = false;
    const x = setup({ deps: { authorized: () => authorized } });
    await submit(x.deps, request);
    assert.equal(x.sent(), 0);
    authorized = true;
    x.deps.readDriver = async () => {
      authorized = false;
      return driver;
    };
    await submit(x.deps, request);
    assert.equal(x.sent(), 0);
  });
  await test("same-frame double click and repeated success submission produce only one PUT", async () => {
    const x = setup();
    await Promise.all([submit(x.deps, request), submit(x.deps, request)]);
    await submit(x.deps, request);
    assert.equal(x.sent(), 1);
  });
  await test("failed preflight GET never writes", async () => {
    const x = setup({
      deps: {
        readOrder: async () => {
          throw new Error("offline");
        },
      },
    });
    await submit(x.deps, request);
    assert.equal(x.sent(), 0);
    assert.equal(x.state().message, "reviewFailed");
  });
  await test("pending-result marker must be saved before a PUT", async () => {
    const x = setup({
      deps: {
        mark: () => {
          throw new Error("Storage denied");
        },
      },
    });
    await submit(x.deps, request);
    assert.equal(x.sent(), 0);
    assert.equal(x.state().message, "assignmentStorage");
  });
  await test("400/401/403/404/409/422 are explicit rejections, not success", async () => {
    for (const status of [400, 401, 403, 404, 409, 422]) {
      const x = setup({
        deps: {
          send: async () => {
            throw new AppError("Rejected", "REJECTED", status, undefined, ["Validation detail"]);
          },
        },
      });
      await submit(x.deps, { ...request });
      assert.equal(x.state().phase, "rejected");
      assert.equal(x.state().details, undefined);
      assert.equal(
        x.state().message,
        {
          400: "assignmentInvalidRequest",
          401: "assignmentAuthentication",
          403: "assignmentForbidden",
          404: "assignmentMissing",
          409: "assignmentConflict",
          422: "assignmentValidation",
        }[status],
      );
      assert.equal(x.marked(), false);
    }
  });
  await test("timeout with committed assignment is observed by GET, not claimed as acknowledged success", async () => {
    const x = setup();
    x.deps.send = async () => {
      x.setRaw({ towTruckDriverId: 15, paymentStatus: 1 });
      throw new AppError("Timeout", "ECONNABORTED");
    };
    await submit(x.deps, request);
    assert.equal(x.reads(), 2);
    assert.equal(x.state().phase, "observed");
    assert.equal(x.state().receipt, undefined);
  });
  await test("timeout without assignment allows only a new explicit review after fresh GET", async () => {
    let calls = 0;
    const x = setup({
      deps: {
        send: async () => {
          calls++;
          throw new AppError("Timeout");
        },
      },
    });
    await submit(x.deps, request);
    assert.equal(x.state().phase, "retryable");
    assert.equal(x.reads(), 2);
    assert.equal(calls, 1);
  });
  await test("unreachable reconciliation keeps uncertain outcome locked across further submit attempts", async () => {
    const x = setup();
    let calls = 0;
    x.deps.send = async () => {
      calls++;
      x.deps.readOrder = async () => {
        throw new Error("Offline");
      };
      throw new AppError("Timeout");
    };
    await submit(x.deps, request);
    await submit(x.deps, request);
    assert.equal(calls, 1);
    assert.equal(x.state().phase, "uncertain");
    assert.equal(x.marked(), true);
  });
  await test("acknowledged write with failed refresh permits GET recovery only", async () => {
    const x = setup();
    const send = x.deps.send;
    x.deps.send = async (value) => {
      await send(value);
      x.deps.readOrder = async () => {
        throw new Error("Offline");
      };
    };
    await submit(x.deps, request);
    await submit(x.deps, request);
    assert.equal(x.sent(), 1);
    assert.equal(x.state().phase, "accepted");
    assert.equal(x.state().message, "assignmentRefreshFailed");
    x.deps.readOrder = async () =>
      adaptTowTruck({ ...original, towTruckDriverId: 15, paymentStatus: 1 });
    await checkOutcome(x.deps);
    assert.equal(x.state().phase, "success");
    assert.equal(x.sent(), 1);
  });
  await test("acknowledged response with a mismatching driver never unlocks retry", async () => {
    const x = setup({ deps: { send: async () => {} } });
    await submit(x.deps, request);
    assert.equal(x.state().phase, "accepted");
    assert.equal(x.marked(), true);
  });
  await test("restored uncertain journal blocks submission until explicit GET recovery", async () => {
    const x = setup({ state: { phase: "uncertain" } });
    await submit(x.deps, request);
    assert.equal(x.sent(), 0);
    await checkOutcome(x.deps);
    assert.equal(x.state().phase, "retryable");
    assert.equal(x.reads(), 1);
  });
  await test("failed list invalidation does not skip authoritative post-write read", async () => {
    const x = setup({
      deps: {
        invalidate: async () => {
          throw new Error("List failed");
        },
      },
    });
    await submit(x.deps, request);
    assert.equal(x.state().phase, "success");
  });
  await test("API uses shared PUT, numeric payload and disables interceptor replay", async () => {
    transport = async (url, body, config) => {
      assert.equal(url, "/Orders/19/tow-truck-driver");
      assert.deepEqual(body, payload);
      assert.equal(config._retry, true);
      return { data: { success: true } };
    };
    await ordersApi.assignTowTruckDriver("19", payload);
  });
  await test("API does not accept malformed 2xx or explicit failure as success", async () => {
    for (const data of [null, {}, { success: "true" }, { success: false, errors: ["Rejected"] }]) {
      transport = async () => ({ data });
      await assert.rejects(() => ordersApi.assignTowTruckDriver("19", payload));
    }
  });
  const { assignmentRejection, uncertainAssignmentReason, readFailureMessage } = load(
    "src/modules/tow-truck/lib/assignmentFeedback.ts",
  );
  const { towTruckAr: ar, towTruckEn: en } = load("src/modules/tow-truck/i18n.ts");
  const busyMessage = "سائق السطحة مشغول بطلب آخر حاليًا";
  await test("only the exact verified 409 is busy; unknown/order conflicts and malformed messages remain generic", async () => {
    assert.equal(
      assignmentRejection(new AppError(busyMessage, "ERR_BAD_REQUEST", 409)),
      "assignmentDriverBusy",
    );
    assert.equal(
      assignmentRejection(new AppError(`  ${busyMessage}  `, "UNKNOWN", 409)),
      "assignmentDriverBusy",
    );
    for (const message of [
      "Order status changed",
      "Different driver conflict",
      "",
      null,
      {},
      [],
      busyMessage + " internal details",
    ]) {
      const error = new AppError("", "UNKNOWN", 409);
      error.message = message;
      assert.equal(assignmentRejection(error), "assignmentConflict");
    }
    assert.equal(
      assignmentRejection(new AppError(busyMessage, "UNKNOWN", 400)),
      "assignmentInvalidRequest",
    );
    assert.equal(assignmentRejection(new Error(busyMessage)), null);
    assert.equal(assignmentRejection(new AppError("untrusted", "ASSIGNMENT_REJECTED", 503)), null);
  });
  await test("busy rejection preserves quotation and never reuses the consumed confirmation", async () => {
    let calls = 0;
    const x = setup({
      deps: {
        send: async () => {
          calls++;
          throw new AppError(busyMessage, "ERR_BAD_REQUEST", 409);
        },
      },
    });
    const before = structuredClone(request);
    await Promise.all([submit(x.deps, request), submit(x.deps, request)]);
    assert.equal(x.state().message, "assignmentDriverBusy");
    assert.equal(x.state().driverId, "15");
    assert.deepEqual(request, before);
    await submit(x.deps, request);
    assert.equal(calls, 1);
    assert.equal(x.marked(), false);
  });
  await test("changed driver/cost/duration invalidate review; new review requires fresh reads and explicit submit", async () => {
    for (const change of [{ driverId: "16" }, { cost: "151" }, { duration: "40 minutes" }])
      assert.equal(reviewMatchesDraft(request.values, { ...request.values, ...change }), false);
    assert.equal(reviewMatchesDraft(request.values, { ...request.values }), true);
    assert.equal(reviewMatchesDraft(request.values, {}), false);
    let calls = 0;
    const x = setup({
      deps: {
        send: async () => {
          calls++;
          throw new AppError("Conflict", "UNKNOWN", 409);
        },
      },
    });
    await submit(x.deps, request);
    const revised = { ...request, values: { ...request.values, driverId: "16" } };
    assert.equal(calls, 1); // Creating a new review does not send anything.
    x.deps.readDriver = async (id) => {
      x.events.push("driver");
      assert.equal(id, "16");
      return { ...driver, id };
    };
    const eventCount = x.events.length;
    await submit(x.deps, revised);
    assert.equal(calls, 2);
    assert.deepEqual(x.events.slice(eventCount, eventCount + 3), ["driver", "order", "mark"]);
  });
  await test("field feedback separates missing, invalid, minimum, precision and duration length", async () => {
    for (const [input, expected] of [
      ["", "costRequired"],
      ["abc", "costInvalid"],
      ["0.001", "costMinimum"],
      ["150.12345678901234567890", "costPrecision"],
      ["150.00", null],
    ])
      assert.equal(quoteCostError(input), expected);
    for (const [duration, expected] of [
      [" ", "durationRequired"],
      ["x".repeat(101), "durationTooLong"],
    ]) {
      const parsed = dispatchDraftSchema(true).safeParse({ ...request.values, duration });
      assert.equal(parsed.success, false);
      assert.equal(parsed.error.issues[0].message, expected);
    }
  });
  await test("unexpected sensitive/backend fields are never part of display feedback", async () => {
    const sentinel = "private diagnostic content must not render";
    const x = setup({
      deps: {
        send: async () => {
          throw new AppError(sentinel, "UNKNOWN", 422, { cost: [sentinel] }, [sentinel]);
        },
      },
    });
    await submit(x.deps, request);
    assert.equal(JSON.stringify(x.state()).includes(sentinel), false);
    assert.equal(x.state().message, "assignmentValidation");
    assert.equal(ar[x.state().message].includes(sentinel), false);
    assert.equal(en[x.state().message].includes(sentinel), false);
  });
  await test("network, timeout, server and malformed outcomes have controlled explanations and retain locks", async () => {
    for (const [code, status, expected] of [
      ["ERR_NETWORK", undefined, "submissionNetwork"],
      ["ETIMEDOUT", undefined, "submissionTimeout"],
      ["UNKNOWN", 503, "submissionServerError"],
      ["ASSIGNMENT_UNCERTAIN", undefined, "submissionMalformed"],
      ["UNKNOWN", undefined, "submissionUnknown"],
    ]) {
      const error = new AppError("untrusted", code, status);
      assert.equal(uncertainAssignmentReason(error), expected);
      const x = setup();
      let calls = 0;
      x.deps.send = async () => {
        calls++;
        x.deps.readOrder = async () => {
          throw new Error("offline");
        };
        throw error;
      };
      const attempt = { ...request };
      await submit(x.deps, attempt);
      await submit(x.deps, { ...attempt });
      assert.equal(x.state().phase, "uncertain");
      assert.equal(x.state().reason, expected);
      assert.equal(calls, 1);
      assert.equal(x.marked(), true);
    }
  });
  await test("assignment transport sanitizes non-string messages before shared error coercion", async () => {
    for (const message of [[busyMessage], { toString: () => busyMessage }, null, 42, busyMessage]) {
      transport = async (url, body, config) => {
        const data = config.transformResponse.reduce((value, transform) => transform(value), {
          success: false,
          message,
        });
        const error = new AppError(data.message || "Generic transport error", "UNKNOWN", 409);
        assert.equal(
          assignmentRejection(error),
          typeof message === "string" ? "assignmentDriverBusy" : "assignmentConflict",
        );
        throw error;
      };
      await assert.rejects(() => ordersApi.assignTowTruckDriver("19", payload));
    }
  });
  await test("explicit success:false is a controlled rejection without invented HTTP status", async () => {
    transport = async () => ({
      data: { success: false, message: { unexpected: "data" }, errors: ["private"] },
    });
    await assert.rejects(
      () => ordersApi.assignTowTruckDriver("19", payload),
      (error) => {
        assert.equal(error.status, undefined);
        assert.equal(assignmentRejection(error), "assignmentRejected");
        assert.equal(error.errors, undefined);
        assert.equal(error.message.includes("private"), false);
        return true;
      },
    );
  });
  await test("read feedback and next-step guidance never promise dispatch for ineligible orders", async () => {
    assert.equal(readFailureMessage(new AppError("private", "UNKNOWN", 401)), "readAuthentication");
    assert.equal(readFailureMessage(new AppError("private", "UNKNOWN", 403)), "readForbidden");
    assert.equal(readFailureMessage(new AppError("private", "UNKNOWN", 404)), "readMissing");
    assert.equal(readFailureMessage(new Error("private")), "errorHint");
    assert.throws(
      () => adaptTowTruck({ ...original, orderType: 2 }),
      (error) => readFailureMessage(error) === "orderWrongType",
    );
    assert.throws(
      () => adaptTowTruck({ ...original, id: undefined }),
      (error) => readFailureMessage(error) === "orderIdentityInvalid",
    );
    assert.equal(
      initialAssignmentBlock(adaptTowTruck({ ...original, towTruckDriverId: undefined })),
      "driverStateUnknown",
    );
    const complete = {
      ...original,
      addressTitle: "Origin",
      destinationAddressTitle: "Destination",
      plateNumber: "Example",
    };
    assert.equal(
      nextActionMessage(adaptTowTruck({ ...complete, status: 5 })),
      "initialNeedsWaiting",
    );
    assert.equal(
      nextActionMessage(adaptTowTruck({ ...complete, towTruckDriverId: 15 })),
      "initialNeedsUnassigned",
    );
    assert.equal(
      nextActionMessage(adaptTowTruck({ ...complete, paymentStatus: 1, towTruckDriverId: 15 })),
      "pendingCustomerHint",
    );
  });
  await test("Arabic and English feedback is complete, localized and preserves interpolation parity", async () => {
    assert.deepEqual(Object.keys(ar).sort(), Object.keys(en).sort());
    for (const key of Object.keys(ar)) {
      assert.ok(ar[key].trim() && en[key].trim(), key);
      assert.deepEqual(
        ar[key].match(/{{[^}]+}}/g)?.sort(),
        en[key].match(/{{[^}]+}}/g)?.sort(),
        key,
      );
    }
    for (const status of [400, 401, 403, 404, 409, 422]) {
      const key = assignmentRejection(new AppError(busyMessage, "UNKNOWN", status));
      assert.ok(ar[key] && en[key], key);
    }
    assert.equal(ar.assignmentRejectedTitle, "تعذر تعيين سائق السطحة");
    assert.equal(en.assignmentRejectedTitle, "Unable to assign tow truck driver");
    assert.equal(
      ar.assignmentDriverBusy,
      "السائق المحدد مشغول بطلب آخر حاليًا. اختر سائقًا آخر، ثم راجع العرض وأكد إرساله.",
    );
    assert.equal(
      en.assignmentDriverBusy,
      "The selected driver is busy with another order. Choose another driver, review the quote, and confirm submission again.",
    );
  });
  console.log(`${checks} checks passed. No live backend requests executed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
