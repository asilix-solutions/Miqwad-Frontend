/**
 * @file check-tow-truck-cancellation.cjs
 * @description Offline regression checks for Tow Truck Phase 3:
 * Order Cancellation, Workflow Safety, Payment Protection & State Consistency.
 * Uses real project TypeScript modules transpiled in-memory, stubbed transport, no live network calls.
 */
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
    if (name === "@app/i18n") return { default: { language: "ar" }, language: "ar" };
    if (name === "@shared/lib/axios") {
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

const { AppError } = load("src/shared/types/api.ts");
const { adaptTowTruck } = load("src/modules/tow-truck/lib/towTruckModel.ts");
const {
  orderCancellationEligibility,
  submitOrderCancellation,
  reconcileOrderCancellation,
  cancellationRejection,
  resetCancellationReview,
  operationCancellationLocked,
} = load("src/modules/tow-truck/lib/cancellationModel.ts");
const { ordersApi } = load("src/modules/orders/api/ordersApi.ts");
const { towTruckAr, towTruckEn } = load("src/modules/tow-truck/i18n.ts");
const { nextActionMessage } = load("src/modules/tow-truck/lib/dispatchModel.ts");
const { paymentStatusFromNumber } = load("src/modules/orders/lib/orderEnums.ts");

const sampleRawOrder = {
  id: 105,
  orderNumber: "REQ-105",
  orderType: 3,
  status: 1, // InWaiting
  paymentStatus: 1, // Pending
  paymentMethod: 3,
  towTruckDriverId: 15,
  towTruckDriverFullName: "Driver Sami",
  userId: 33,
  addressTitle: "Pickup Location",
  destinationAddressTitle: "Dropoff Location",
  plateNumber: "ABC 1234",
  subtotal: 200,
  discountAmount: 0,
  totalPrice: 200,
  duration: "45 minutes",
};

function createCancellationFixture(options = {}) {
  let raw = { ...sampleRawOrder, ...options.raw };
  let state = options.state ?? { phase: "idle" };
  let sendCount = 0;
  let orderReads = 0;
  let invalidations = 0;
  const calls = [];

  const d = {
    actor: "admin-1",
    conflict: () => false,
    mark: () => {},
    clear: () => {},
    orderId: String(raw.id),
    authorized: () => options.authorized ?? true,
    get: () => state,
    set: (next) => {
      state = next;
    },
    readOrder: async (id) => {
      orderReads++;
      calls.push({ type: "readOrder", id });
      if (options.onRead) return options.onRead(orderReads);
      return adaptTowTruck(raw);
    },
    sendCancel: async (id) => {
      sendCount++;
      calls.push({ type: "sendCancel", id });
      if (options.onSendCancel) {
        return options.onSendCancel(id);
      }
      if (options.throwError) {
        throw options.throwError;
      }
      if (options.cancelResponse !== undefined) {
        return options.cancelResponse;
      }
      raw = { ...raw, status: 5 };
      return { ...raw, status: 5 };
    },
    invalidate: async () => {
      invalidations++;
      calls.push({ type: "invalidate" });
    },
    ...options.deps,
  };

  return {
    d,
    get state() {
      return state;
    },
    get sendCount() {
      return sendCount;
    },
    get orderReads() {
      return orderReads;
    },
    get invalidations() {
      return invalidations;
    },
    get calls() {
      return calls;
    },
    get raw() {
      return raw;
    },
    setRaw: (nextRaw) => {
      raw = { ...raw, ...nextRaw };
    },
  };
}

async function runCancellationChecks() {
  console.log("Running Tow Truck Order Cancellation & Workflow Safety checks...");

  // 1. API Method & Path & Payload
  {
    let recordedMethod = null;
    let recordedUrl = null;
    let recordedData = null;
    let recordedConfig = null;

    transport = (method, url, data, config) => {
      recordedMethod = method;
      recordedUrl = url;
      recordedData = data;
      recordedConfig = config;
      return { status: 200, data: { success: true, message: null, data: null, errors: null } };
    };

    const res = await ordersApi.cancel("105");
    assert.equal(recordedMethod, "PUT", "Cancellation must use HTTP PUT");
    assert.equal(
      recordedUrl,
      "/Orders/105/cancel",
      "Cancellation endpoint path must be /Orders/{id}/cancel",
    );
    assert.equal(recordedData, undefined, "Cancellation request must not send a body");
    assert.equal(
      recordedConfig?._retry,
      true,
      "Must use noMutationReplay to avoid auto-replay on 401",
    );
    assert.equal(res, null, "Null data envelope returns null");
  }

  // 2. Canonical PaymentStatus 2 = Paid parsing
  {
    assert.equal(
      paymentStatusFromNumber(2),
      "Paid",
      "Numeric PaymentStatus 2 must resolve to Paid",
    );
    assert.equal(
      paymentStatusFromNumber(1),
      "Pending",
      "Numeric PaymentStatus 1 must resolve to Pending",
    );
    assert.equal(
      paymentStatusFromNumber(3),
      "Failed",
      "Numeric PaymentStatus 3 must resolve to Failed",
    );
    assert.equal(
      paymentStatusFromNumber(4),
      "Refunded",
      "Numeric PaymentStatus 4 must resolve to Refunded",
    );
    assert.equal(paymentStatusFromNumber(null), "", "Null payment status must resolve to empty");
    assert.equal(paymentStatusFromNumber(0), "", "0 payment status must resolve to empty");
  }

  // 3. Cancellation Eligibility & Payment Protection
  {
    // A. Unpaid pending order (numeric 1, string "1", string "Pending") -> Eligible
    for (const ps of [1, "1", "Pending"]) {
      const unpaidOrder = adaptTowTruck({ ...sampleRawOrder, status: 1, paymentStatus: ps });
      const unpaidCheck = orderCancellationEligibility(unpaidOrder);
      assert.equal(
        unpaidCheck.eligible,
        true,
        `Pending unpaid order (${ps}) must be eligible for cancellation`,
      );
    }

    // B. Paid order (numeric 2, string "2", string "Paid") -> Ineligible with reason 'paid'
    for (const ps of [2, "2", "Paid"]) {
      const paidOrder = adaptTowTruck({ ...sampleRawOrder, status: 1, paymentStatus: ps });
      const paidCheck = orderCancellationEligibility(paidOrder);
      assert.equal(
        paidCheck.eligible,
        false,
        `Paid order (${ps}) must be ineligible for cancellation`,
      );
      assert.equal(paidCheck.reason, "paid", `Ineligibility reason for ${ps} must be 'paid'`);
    }

    // C. Already cancelled order (numeric 5, string "Canceled") -> Ineligible with reason 'alreadyCancelled'
    for (const st of [5, "Canceled"]) {
      const cancelledOrder = adaptTowTruck({ ...sampleRawOrder, status: st, paymentStatus: 1 });
      const cancelledCheck = orderCancellationEligibility(cancelledOrder);
      assert.equal(
        cancelledCheck.eligible,
        false,
        `Already cancelled order (${st}) must be ineligible`,
      );
      assert.equal(
        cancelledCheck.reason,
        "alreadyCancelled",
        "Ineligibility reason must be 'alreadyCancelled'",
      );
    }

    // D. Missing or unspecified payment status (null, undefined, 0, "0") -> Eligible
    for (const ps of [null, undefined, 0, "0"]) {
      const missingPayOrder = adaptTowTruck({ ...sampleRawOrder, status: 1, paymentStatus: ps });
      const check = orderCancellationEligibility(missingPayOrder);
      assert.equal(
        check.eligible,
        true,
        `Missing/unspecified payment (${ps}) must be eligible for cancellation`,
      );
    }

    // E. Other non-paid states: Failed (3, "3", "Failed"), Refunded (4, "4", "Refunded") -> Eligible
    for (const ps of [3, "3", "Failed", 4, "4", "Refunded"]) {
      const otherPayOrder = adaptTowTruck({ ...sampleRawOrder, status: 1, paymentStatus: ps });
      const check = orderCancellationEligibility(otherPayOrder);
      assert.equal(
        check.eligible,
        true,
        `Non-paid status (${ps}) must be eligible for cancellation`,
      );
    }

    // F. Order with assigned driver but unpaid -> Still eligible (payment status is separate from driver)
    const assignedUnpaidOrder = adaptTowTruck({
      ...sampleRawOrder,
      status: 1,
      paymentStatus: 1,
      towTruckDriverId: 88,
      towTruckDriverFullName: "Assigned Driver",
    });
    const assignedUnpaidCheck = orderCancellationEligibility(assignedUnpaidOrder);
    assert.equal(
      assignedUnpaidCheck.eligible,
      true,
      "Driver assignment must not imply paid status",
    );

    // G. Invalid / corrupt payment status -> Ineligible with reason 'unknownPayment'
    for (const ps of [99, "corrupt_payment_value"]) {
      const corruptPaymentOrder = adaptTowTruck({ ...sampleRawOrder, paymentStatus: ps });
      const corruptCheck = orderCancellationEligibility(corruptPaymentOrder);
      assert.equal(
        corruptCheck.eligible,
        false,
        `Corrupted payment status (${ps}) must be rejected safely`,
      );
      assert.equal(corruptCheck.reason, "unknownPayment");
    }
  }

  // 4. Successful cancellation & Cache Invalidation with various backend DTO shapes
  {
    // A. Real backend DTO returning status as string "Canceled"
    {
      const f = createCancellationFixture({
        onSendCancel: async () => ({ ...sampleRawOrder, status: "Canceled" }),
      });
      const order = adaptTowTruck(f.raw);
      await submitOrderCancellation(f.d, order);

      assert.equal(f.sendCount, 1, "Must send exactly 1 cancel mutation");
      assert.equal(f.invalidations, 1, "Must invalidate queries on success");
      assert.equal(
        f.state.phase,
        "accepted",
        "Mutation DTO cannot substitute for an authoritative GET",
      );
      assert.equal(f.state.message, "cancelAcknowledged");
    }

    // B. Real backend DTO returning status as string "InWaiting" (un-updated snapshot)
    {
      const f = createCancellationFixture({
        onSendCancel: async () => ({ ...sampleRawOrder, status: "InWaiting" }),
      });
      const order = adaptTowTruck(f.raw);
      await submitOrderCancellation(f.d, order);

      assert.equal(f.sendCount, 1);
      assert.equal(f.invalidations, 1);
      assert.equal(
        f.state.phase,
        "accepted",
        "Stale mutation DTO acknowledges but does not verify cancellation",
      );
    }

    // C. Real backend DTO returning null data envelope
    {
      const f = createCancellationFixture({
        onSendCancel: async () => null,
      });
      const order = adaptTowTruck(f.raw);
      await submitOrderCancellation(f.d, order);

      assert.equal(f.sendCount, 1);
      assert.equal(f.invalidations, 1);
      assert.equal(
        f.state.phase,
        "accepted",
        "Null data acknowledges the write without proving final state",
      );
    }
  }

  // 5. Duplicate Submit Protection (Same-frame double click & in-flight locking)
  {
    const f = createCancellationFixture({
      onSendCancel: async () => {
        // Artificial delay
        await new Promise((r) => setTimeout(r, 10));
        return { ...sampleRawOrder, status: 5 };
      },
    });
    const order = adaptTowTruck(f.raw);

    // Trigger two concurrent cancellations for the same order
    const p1 = submitOrderCancellation(f.d, order);
    const p2 = submitOrderCancellation(f.d, order);
    await Promise.all([p1, p2]);

    assert.equal(
      f.sendCount,
      1,
      "Concurrent duplicate submission must be guarded and only send 1 mutation",
    );
  }

  // 6. Paid order rejected in UI before sending
  {
    const f = createCancellationFixture({ raw: { paymentStatus: 2 } });
    const order = adaptTowTruck(f.raw);
    await submitOrderCancellation(f.d, order);

    assert.equal(f.sendCount, 0, "Paid order must not send any mutation");
    assert.equal(f.state.phase, "rejected");
    assert.equal(f.state.message, "cancelBlockedPaid");
  }

  // 7. Already cancelled order rejected in UI before sending
  {
    const f = createCancellationFixture({ raw: { status: 5 } });
    const order = adaptTowTruck(f.raw);
    await submitOrderCancellation(f.d, order);

    assert.equal(f.sendCount, 0, "Already cancelled order must not send any mutation");
    assert.equal(f.state.phase, "rejected");
    assert.equal(f.state.message, "cancelBlockedAlreadyCancelled");
  }

  // 8. HTTP 409 Conflict handling (Paid order on server)
  {
    const server409Error = new AppError(
      "لا يمكن إلغاء الطلب بعد سداد قيمته.",
      "ORDER_PAID_CONFLICT",
      409,
    );
    const f = createCancellationFixture({ throwError: server409Error });
    const order = adaptTowTruck(f.raw);
    await submitOrderCancellation(f.d, order);

    assert.equal(f.sendCount, 1);
    assert.equal(f.state.phase, "conflict", "409 error must transition to conflict phase");
    assert.equal(f.state.isConflict, true);
    assert.equal(f.state.message, "cancelBlockedPaid", "Do not render arbitrary backend messages");
    assert.equal(
      f.invalidations,
      1,
      "409 must invalidate queries so fresh payment status is displayed",
    );
  }

  // 9. HTTP 404 Privacy-preserving handling
  {
    const server404Error = new AppError("Not Found", "NOT_FOUND", 404);
    const f = createCancellationFixture({ throwError: server404Error });
    const order = adaptTowTruck(f.raw);
    await submitOrderCancellation(f.d, order);

    assert.equal(f.sendCount, 1);
    assert.equal(f.state.phase, "rejected");
    assert.equal(f.state.isPrivacy404, true);
    assert.equal(
      f.state.message,
      "cancelNotFound",
      "404 must map to privacy-preserving message key",
    );
    assert.equal(f.invalidations, 1, "404 must invalidate list/queries");

    // Verify privacy-preserving messages in Arabic & English
    assert.equal(
      towTruckAr.cancelNotFound,
      "الطلب غير متاح أو لا تملك صلاحية إلغائه.",
      "Arabic 404 must preserve privacy and match spec",
    );
    assert.equal(
      towTruckEn.cancelNotFound,
      "The order is unavailable or you do not have permission to cancel it.",
      "English 404 must preserve privacy and match spec",
    );
  }

  // 10. Network Uncertainty & GET-based Reconciliation
  {
    const networkError = new AppError("Network Error", "NETWORK_ERROR");
    const f = createCancellationFixture({ throwError: networkError });
    const order = adaptTowTruck(f.raw);

    // Initial send fails with network uncertainty
    await submitOrderCancellation(f.d, order);
    assert.equal(f.sendCount, 1);
    assert.equal(f.state.phase, "uncertain", "Network error must enter uncertain phase");
    assert.equal(f.state.isUncertain, true);

    // Attempting to submit again while uncertain is blocked (no automatic retry)
    await submitOrderCancellation(f.d, order);
    assert.equal(
      f.sendCount,
      1,
      "Must not automatically repeat mutation while outcome is uncertain",
    );

    // Case A: Reconciliation GET discovers server DID cancel the order
    f.setRaw({ status: 5 });
    await reconcileOrderCancellation(f.d, order.id);
    assert.equal(f.orderReads, 2, "Fresh preflight and reconciliation each execute GET");
    assert.equal(
      f.state.phase,
      "success",
      "If GET observes status Canceled, outcome reconciles to success",
    );

    // Case B: A non-canceled GET cannot prove that the request did not execute
    const f2 = createCancellationFixture({ throwError: networkError });
    await submitOrderCancellation(f2.d, order);
    assert.equal(f2.state.phase, "uncertain");

    f2.setRaw({ status: 1 }); // Still in waiting
    await reconcileOrderCancellation(f2.d, order.id);
    assert.equal(f2.state.phase, "uncertain", "A non-canceled GET MUST NOT release the retry lock");
    await submitOrderCancellation(f2.d, order);
    assert.equal(f2.sendCount, 1);
  }

  // 11. Cancellation Error Normalization (cancellationRejection helper)
  {
    const rej409 = cancellationRejection(new AppError("Msg", "CODE", 409));
    assert.equal(rej409.status, 409);
    assert.equal(rej409.isConflict, true);

    const rej404 = cancellationRejection(new AppError("Msg", "CODE", 404));
    assert.equal(rej404.status, 404);
    assert.equal(rej404.isPrivacy404, true);

    const rej403 = cancellationRejection(new AppError("Msg", "CODE", 403));
    assert.equal(rej403.key, "cancelForbidden");

    const rejNet = cancellationRejection(new Error("Timeout"));
    assert.equal(rejNet.isUncertain, true);
  }

  // 12. Localized content parity and exact wording
  {
    assert.equal(
      towTruckAr.cancelBlockedPaid,
      "لا يمكن إلغاء الطلب بعد سداد قيمته.",
      "Arabic 409 payment conflict must match backend text exactly",
    );
    assert.equal(
      towTruckEn.cancelBlockedPaid,
      "The order cannot be cancelled after payment has been completed.",
      "English 409 payment conflict must match backend text exactly",
    );

    // Check all cancellation keys exist in both Arabic and English dictionaries
    const requiredKeys = [
      "cancelOrder",
      "cancelOrderTitle",
      "cancelOrderDescription",
      "operationalWarning",
      "cancelOrderScopeNotice",
      "cancelOrderTripNotice",
      "cancelOrderIrreversibleNotice",
      "cancelClose",
      "confirmCancelOrder",
      "cancellingOrder",
      "cancelSuccess",
      "cancelBlockedPaid",
      "cancelBlockedAlreadyCancelled",
      "cancelBlockedUnknownPayment",
      "cancelNotFound",
      "cancelForbidden",
      "cancelValidation",
      "cancelUncertain",
      "cancelReconcile",
      "orderCancelledHint",
    ];

    for (const key of requiredKeys) {
      assert.ok(
        typeof towTruckAr[key] === "string" && towTruckAr[key].length > 0,
        `Arabic key ${key} must exist`,
      );
      assert.ok(
        typeof towTruckEn[key] === "string" && towTruckEn[key].length > 0,
        `English key ${key} must exist`,
      );
    }
  }

  // 13. Cancelled Order Operational Inaction & Summary state
  {
    const cancelledOrder = adaptTowTruck({ ...sampleRawOrder, status: 5, towTruckDriverId: null });
    assert.equal(cancelledOrder.status, "Canceled");
    assert.equal(cancelledOrder.statusCode, 5);
    const eligibility = orderCancellationEligibility(cancelledOrder);
    assert.equal(eligibility.eligible, false);
    assert.equal(eligibility.reason, "alreadyCancelled");
    const nextAction = nextActionMessage(cancelledOrder);
    assert.equal(nextAction, "initialNeedsWaiting");
  }

  // 14. Authorization guard: unauthorized caller is blocked before sending mutation
  {
    const f = createCancellationFixture({ authorized: false });
    const order = adaptTowTruck(f.raw);
    await submitOrderCancellation(f.d, order);

    assert.equal(f.sendCount, 0, "Unauthorized caller must not send any mutation");
    assert.equal(f.state.phase, "rejected");
    assert.equal(f.state.message, "cancelForbidden");
  }

  // 15. HTTP 400 and 422 Validation Error handling
  {
    for (const code of [400, 422]) {
      const err = new AppError("Validation failed", "VALIDATION_ERROR", code);
      const f = createCancellationFixture({ throwError: err });
      const order = adaptTowTruck(f.raw);
      await submitOrderCancellation(f.d, order);

      assert.equal(f.sendCount, 1);
      assert.equal(f.state.phase, "rejected");
      assert.equal(f.state.message, "cancelValidation");
    }
  }

  // 16. Application-level failure (confirmMutation rejects HTTP 200 with success: false)
  {
    transport = () => ({
      status: 200,
      data: {
        success: false,
        message: "Order cancellation refused",
        data: null,
        errors: ["Refused"],
      },
    });
    let thrown = null;
    try {
      await ordersApi.cancel("105");
    } catch (err) {
      thrown = err;
    }
    assert.ok(thrown instanceof AppError, "Application-level success: false must throw AppError");
    assert.equal(thrown.code, "OP_REJECTED", "Envelope with success: false must throw OP_REJECTED");
  }

  await runR1RecoveryChecks();

  console.log("PASS: 16/16 Tow Truck Cancellation & Workflow Safety checks passed successfully.");
}

runCancellationChecks().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});

// R1 regressions exercise the same review reset and journal/cache transitions used
// by the hook. QueryObserver detach/attach and a NEW QueryClient model navigation,
// remount and document reload; these are behavioral tests, not source searches.
async function runR1RecoveryChecks() {
  const { QueryClient, QueryObserver } = req("@tanstack/react-query");
  const {
    cancellationKey,
    cancellationMarker,
    cancellationState,
    cancellationBlocks,
    readCancellationJournal,
    writeCancellationJournal,
    clearCancellationJournal,
  } = load("src/modules/tow-truck/lib/cancellationJournal.ts");
  const order = adaptTowTruck(sampleRawOrder);

  // T1: Only authoritative read verifies completion, independent of mutation DTO.
  {
    const f = createCancellationFixture();
    await submitOrderCancellation(f.d, order);
    assert.equal(f.state.phase, "success");
    assert.equal(f.orderReads, 2);
    assert.equal(f.sendCount, 1);
    await submitOrderCancellation(f.d, order); // cached pre-write order
    assert.equal(f.sendCount, 1);
  }
  // T2: Explicit rejections consume this review, including application rejection.
  for (const error of [
    new AppError("hidden", "CONFLICT", 409),
    new AppError("hidden", "OP_REJECTED"),
  ]) {
    let cleared = 0;
    const f = createCancellationFixture({
      throwError: error,
      deps: {
        clear: () => {
          cleared++;
        },
      },
    });
    await submitOrderCancellation(f.d, order);
    await submitOrderCancellation(f.d, order);
    assert.equal(f.sendCount, 1);
    assert.equal(cleared, 1);
    assert.equal(operationCancellationLocked(f.state), false);
  }
  // T3-T5 retain all legacy payment guards in groups 3, 6 and 7 above.
  // T6: failed fresh read must not write; identity/status validation is also fail-closed.
  for (const onRead of [
    async () => {
      throw new Error("offline");
    },
    async () => ({ ...order, id: "999" }),
    async () => ({ ...order, status: "", statusCode: 99 }),
  ]) {
    const f = createCancellationFixture({ onRead });
    await submitOrderCancellation(f.d, order);
    assert.equal(f.sendCount, 0);
    assert.equal(f.state.phase, "rejected");
  }
  // T7: paid/canceled/changed operational snapshot demands renewed review.
  for (const delta of [
    { paymentStatus: 2 },
    { status: 5 },
    { towTruckDriverId: 16 },
    { totalPrice: 201 },
    { status: 2 },
  ]) {
    const f = createCancellationFixture({
      onRead: async () => adaptTowTruck({ ...sampleRawOrder, ...delta }),
    });
    await submitOrderCancellation(f.d, order);
    await submitOrderCancellation(f.d, order);
    assert.equal(f.sendCount, 0);
    assert.equal(f.state.phase, "rejected");
  }
  // Permission must be checked again after the fresh GET and before mutation.
  {
    let authorized = true;
    const f = createCancellationFixture({
      onRead: async () => {
        authorized = false;
        return order;
      },
      deps: { authorized: () => authorized },
    });
    await submitOrderCancellation(f.d, order);
    assert.equal(f.sendCount, 0);
  }
  // T8: duplicates while the PREflight read is unresolved (not just PUT in flight).
  {
    let release;
    const fresh = new Promise((resolve) => {
      release = resolve;
    });
    const f = createCancellationFixture({ onRead: () => fresh });
    const first = submitOrderCancellation(f.d, order);
    await submitOrderCancellation(f.d, order);
    assert.equal(f.orderReads, 1);
    release(order);
    await first;
    assert.equal(f.sendCount, 1);
  }
  // T15: inability to save/read back the marker prevents any destructive call.
  {
    const f = createCancellationFixture({
      deps: {
        mark: () => {
          throw new Error("quota");
        },
      },
    });
    await submitOrderCancellation(f.d, order);
    assert.equal(f.sendCount, 0);
    assert.equal(operationCancellationLocked(f.state), true);
    assert.equal(f.state.message, "cancelStorage");
  }
  // T17: acknowledgment is retained separately when the final read fails.
  {
    const f = createCancellationFixture({
      onRead: async (n) => {
        if (n > 1) throw new Error("read offline");
        return order;
      },
    });
    await submitOrderCancellation(f.d, order);
    assert.equal(f.state.phase, "readFailed");
    assert.equal(f.state.acknowledged, true);
    assert.equal(f.state.message, "cancelReadFailed");
    await submitOrderCancellation(f.d, order);
    assert.equal(f.sendCount, 1);
  }

  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const entries = new Map();
  const storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: storage });
  const clients = [];
  const client = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    clients.push(qc);
    return qc;
  };
  const actor = "admin-1",
    id = "105",
    key = cancellationKey(actor, id);
  let qc = client();
  let reads = 0,
    sends = 0,
    readFails = false,
    canceled = false;
  const dependencies = () => ({
    actor,
    orderId: id,
    authorized: () => true,
    conflict: () => false,
    get: () => cancellationState(qc, actor, id),
    set: (next) => qc.setQueryData(key, next),
    mark: (outcome) => writeCancellationJournal(actor, id, outcome),
    clear: () => clearCancellationJournal(actor, id),
    invalidate: async () => {},
    readOrder: async () => {
      reads++;
      if (readFails) throw new Error("offline");
      return canceled ? { ...order, statusCode: 5, status: "Canceled" } : order;
    },
    sendCancel: async () => {
      sends++;
      assert.equal(JSON.parse(storage.getItem(cancellationMarker(actor, id))).outcome, "pending");
      throw new Error("timeout after sending");
    },
  });
  try {
    // T9: timeout leaves durable unresolved marker, no automatic replay.
    await submitOrderCancellation(dependencies(), order);
    assert.equal(sends, 1);
    assert.equal(reads, 1);
    assert.equal(cancellationBlocks(qc, actor, id), true);
    // Persist ONLY minimal non-sensitive identity/outcome; snapshots stay in memory.
    assert.deepEqual(Object.keys(JSON.parse(storage.getItem(cancellationMarker(actor, id)))), [
      "version",
      "actor",
      "orderId",
      "outcome",
    ]);
    // T10: actual dialog reset helper must preserve unresolved outcome.
    qc.setQueryData(key, resetCancellationReview(cancellationState(qc, actor, id)));
    await submitOrderCancellation(dependencies(), order);
    assert.equal(sends, 1);
    assert.equal(cancellationState(qc, actor, id).isUncertain, true);
    // T11: observer remount on same cache, then full reload with new empty cache.
    let observer = new QueryObserver(qc, { queryKey: key, enabled: false });
    let unsubscribe = observer.subscribe(() => {});
    assert.equal(observer.getCurrentResult().data.phase, "uncertain");
    unsubscribe();
    observer.destroy();
    observer = new QueryObserver(qc, { queryKey: key, enabled: false });
    unsubscribe = observer.subscribe(() => {});
    assert.equal(observer.getCurrentResult().data.phase, "uncertain");
    unsubscribe();
    observer.destroy();
    qc = client();
    assert.equal(cancellationState(qc, actor, id).phase, "uncertain");
    await submitOrderCancellation(dependencies(), order);
    assert.equal(sends, 1);
    // T13: an authoritative NON-canceled read does not prove nonexecution.
    await reconcileOrderCancellation(dependencies(), id);
    assert.equal(cancellationState(qc, actor, id).phase, "uncertain");
    await submitOrderCancellation(dependencies(), order);
    assert.equal(sends, 1);
    // T14: failed recovery GET keeps lock and record.
    readFails = true;
    await reconcileOrderCancellation(dependencies(), id);
    assert.equal(cancellationState(qc, actor, id).phase, "readFailed");
    assert.equal(cancellationBlocks(qc, actor, id), true);
    assert.ok(storage.getItem(cancellationMarker(actor, id)));
    // T16: other actor/order has no inherited lock, including keys with separators.
    assert.equal(cancellationBlocks(qc, "admin-2", id), false);
    assert.equal(cancellationBlocks(qc, actor, "106"), false);
    assert.notEqual(cancellationMarker("a:b", "c"), cancellationMarker("a", "b:c"));
    // T12: observation is not attributed to this failed client request.
    readFails = false;
    canceled = true;
    await reconcileOrderCancellation(dependencies(), id);
    assert.equal(cancellationState(qc, actor, id).phase, "success");
    assert.equal(cancellationState(qc, actor, id).acknowledged, false);
    assert.equal(towTruckEn.cancelSuccess, "The latest read shows that the order is canceled.");
    qc = client();
    await submitOrderCancellation(dependencies(), order); // stale cache after reload
    assert.equal(sends, 1);
    assert.equal(readCancellationJournal(actor, id).phase, "success");
    // T15: malformed/wrong-identity records fail closed, including on an empty cache.
    for (const value of [
      "",
      "{",
      "null",
      JSON.stringify({ version: 1, actor: "other", orderId: id, outcome: "pending" }),
    ]) {
      storage.setItem(cancellationMarker(actor, id), value);
      qc = client();
      assert.equal(cancellationState(qc, actor, id).message, "cancelStorage");
      await submitOrderCancellation(dependencies(), order);
      assert.equal(sends, 1);
    }
    // A fresh browser tab session has neither this tab's storage nor QueryClient.
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: { ...storage, getItem: () => null },
    });
    assert.equal(cancellationBlocks(client(), actor, id), false);
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get: () => {
        throw new Error("denied");
      },
    });
    assert.equal(readCancellationJournal(actor, id).message, "cancelStorage");
    assert.throws(() => writeCancellationJournal(actor, id, "pending"));
  } finally {
    for (const queryClient of clients) queryClient.clear();
    if (originalStorage) Object.defineProperty(globalThis, "sessionStorage", originalStorage);
    else delete globalThis.sessionStorage;
  }
  for (const key of [
    "cancelAcknowledged",
    "cancelReadFailed",
    "cancelStorage",
    "cancelReviewChanged",
    "cancelReviewFailed",
    "cancelOperationConflict",
  ]) {
    assert.ok(towTruckAr[key]);
    assert.ok(towTruckEn[key]);
  }
  console.log(
    "PASS: R1 T1–T17 cancellation safety and lifecycle regressions. Run assignment/driver suites for T18.",
  );
}
