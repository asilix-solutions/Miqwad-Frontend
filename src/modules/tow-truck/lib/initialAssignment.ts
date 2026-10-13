import {
  assignmentRejection,
  driverEligibilityMessage,
  uncertainAssignmentReason,
} from "./assignmentFeedback";
import type { AdminUserRow } from "@modules/admin/types";
import type { TowTruckAssignmentPayload } from "@modules/orders/api/ordersApi";
import type { TowTruckOrder } from "./towTruckModel";
import {
  canSelectDriver,
  dispatchDraftSchema,
  dispatchSnapshot,
  initialAssignmentBlock,
  type DispatchDraft,
} from "./dispatchModel";

export type AssignmentPhase =
  | "idle"
  | "busy"
  | "uncertain"
  | "accepted"
  | "retryable"
  | "rejected"
  | "success"
  | "observed";
export interface AssignmentState {
  phase: AssignmentPhase;
  message?: string;
  reason?: string;
  driverId?: string;
  receipt?: TowTruckAssignmentPayload;
}
export interface AssignmentRequest {
  values: DispatchDraft;
  snapshot: string;
}
export interface AssignmentDependencies {
  orderId: string;
  authorized: () => boolean;
  get: () => AssignmentState;
  set: (state: AssignmentState) => void;
  readOrder: () => Promise<TowTruckOrder>;
  readDriver: (id: string) => Promise<AdminUserRow>;
  send: (payload: TowTruckAssignmentPayload) => Promise<void>;
  mark: () => void;
  clear: () => void;
  invalidate: () => Promise<void>;
}
// A reviewed proposal can be submitted only once. A fresh review creates a new
// request object; this is a UI safeguard, not server-side idempotency.
const submittedReviews = new WeakSet<AssignmentRequest>();

// A GET after an unknown result never proves that this client sent the quote.
// It may only observe a driver or allow an explicit new review of an eligible
// unassigned order. There is no automatic PUT retry or guessed financial match.
async function reconcile(
  d: AssignmentDependencies,
  receipt?: TowTruckAssignmentPayload,
  reason?: string,
) {
  try {
    const order = await d.readOrder();
    if (order.id !== d.orderId) throw new Error("Mismatched order");
    if (receipt) {
      if (order.driverId !== String(receipt.towTruckDriverId)) {
        d.set({ phase: "accepted", message: "assignmentAwaitingRead", receipt });
        return;
      }
      d.clear();
      d.set({ phase: "success", message: "assignmentSuccess", receipt });
    } else if (!initialAssignmentBlock(order)) {
      d.clear();
      d.set({ phase: "retryable", message: "assignmentRetryReview", reason });
    } else if (order.assignment === "assigned") {
      d.clear();
      d.set({ phase: "observed", message: "assignmentObserved", reason });
    } else {
      d.set({ phase: "uncertain", message: "assignmentUncertain", reason });
    }
  } catch {
    d.set({
      phase: receipt ? "accepted" : "uncertain",
      message: receipt ? "assignmentRefreshFailed" : "assignmentUncertain",
      receipt,
      reason,
    });
  }
}

export async function checkAssignmentOutcome(d: AssignmentDependencies): Promise<void> {
  const previous = d.get();
  if (previous.phase === "busy" || !d.authorized()) return;
  d.set({ phase: "busy", message: "assignmentChecking", receipt: previous.receipt });
  await d.invalidate().catch(() => undefined);
  await reconcile(d, previous.receipt, previous.reason);
}

export async function submitInitialAssignment(
  d: AssignmentDependencies,
  request: AssignmentRequest,
): Promise<void> {
  // QueryClient state is shared across remounts. Set the lock synchronously
  // before the first await, including for two clicks in the same render frame.
  if (submittedReviews.has(request) || !["idle", "rejected", "retryable"].includes(d.get().phase))
    return;
  if (!d.authorized()) {
    d.set({ phase: "rejected", message: "assignmentForbidden" });
    return;
  }
  d.set({ phase: "busy", message: "assignmentChecking" });
  const parsed = dispatchDraftSchema(true).safeParse(request.values);
  if (!parsed.success) {
    d.set({ phase: "rejected", message: "assignmentValidation" });
    return;
  }
  const values = parsed.data;
  const payload: TowTruckAssignmentPayload = {
    towTruckDriverId: Number(values.driverId),
    cost: Number(values.cost),
    duration: values.duration,
  };
  let readingDriver = true;
  try {
    const driver = await d.readDriver(values.driverId);
    if (driver.id !== values.driverId || !canSelectDriver(driver)) {
      d.set({
        phase: "rejected",
        message: driverEligibilityMessage(driver, values.driverId) ?? "driverChanged",
      });
      return;
    }
    readingDriver = false;
    // Last server read immediately before writing; no cached review authorizes a PUT.
    const order = await d.readOrder();
    if (
      order.id !== d.orderId ||
      initialAssignmentBlock(order) ||
      dispatchSnapshot(order) !== request.snapshot
    ) {
      d.set({ phase: "rejected", message: initialAssignmentBlock(order) ?? "requestChanged" });
      return;
    }
    if (!d.authorized()) {
      d.set({ phase: "rejected", message: "assignmentForbidden" });
      return;
    }
  } catch (error) {
    d.set({
      phase: "rejected",
      message: assignmentRejection(error) ?? (readingDriver ? "driverReadFailed" : "reviewFailed"),
    });
    return;
  }
  submittedReviews.add(request);
  try {
    d.mark();
  } catch {
    d.set({ phase: "rejected", message: "assignmentStorage" });
    return;
  }
  d.set({ phase: "busy", message: "assignmentSending" });
  let acknowledged = false;
  let reason: string | undefined;
  try {
    await d.send(payload);
    acknowledged = true;
  } catch (error) {
    const rejection = assignmentRejection(error);
    if (rejection) {
      try {
        d.clear();
      } catch {
        /* A retained marker will force a GET on reload. */
      }
      d.set({
        phase: "rejected",
        message: rejection,
        driverId: values.driverId,
      });
      await d.invalidate().catch(() => undefined);
      return;
    }
    reason = uncertainAssignmentReason(error);
    // Network, timeout, 5xx and malformed 2xx all require authoritative recovery.
  }
  d.set({
    phase: "busy",
    message: "assignmentChecking",
    receipt: acknowledged ? payload : undefined,
  });
  await d.invalidate().catch(() => undefined);
  await reconcile(d, acknowledged ? payload : undefined, reason);
}
