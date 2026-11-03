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
  normalizeArabicNumerals,
  type DispatchDraft,
} from "./dispatchModel";
import { serviceSnapshot, type RemovalEvidence, type RemovalReceipt } from "./reassignment";

export type AssignmentPhase =
  | "idle"
  | "busy"
  | "uncertain"
  | "accepted"
  | "retryable"
  | "rejected"
  | "success"
  | "observed";
export interface AssignmentRecord {
  orderId: string;
  driverId: string;
  service: string;
  replacement?: RemovalReceipt;
  receipt?: TowTruckAssignmentPayload;
}
export interface AssignmentState {
  phase: AssignmentPhase;
  message?: string;
  reason?: string;
  driverId?: string;
  receipt?: TowTruckAssignmentPayload;
  operation?: AssignmentRecord;
}
export interface AssignmentRequest {
  values: DispatchDraft;
  snapshot: string;
}
export interface AssignmentDependencies {
  orderId: string;
  authorized: () => boolean;
  readAuthorized?: () => boolean;
  evidence?: () => RemovalEvidence;
  get: () => AssignmentState;
  set: (state: AssignmentState) => void;
  readOrder: () => Promise<TowTruckOrder>;
  readDriver: (id: string) => Promise<AdminUserRow>;
  send: (payload: TowTruckAssignmentPayload) => Promise<void>;
  mark: (operation: AssignmentRecord) => void;
  clear: () => void;
  completedReplacement?: () => void;
  invalidate: () => Promise<void>;
}
const submittedReviews = new WeakSet<AssignmentRequest>();
const readAllowed = (d: AssignmentDependencies) => (d.readAuthorized ?? d.authorized)();

async function reconcile(d: AssignmentDependencies, operation?: AssignmentRecord, reason?: string) {
  try {
    if (!readAllowed(d)) throw new Error("Permission changed");
    const order = await d.readOrder();
    if (order.id !== d.orderId || !readAllowed(d)) throw new Error("Unverified read");
    // Even an unchanged or desired GET cannot establish finality of a timed-out PUT.
    if (!operation?.receipt) {
      d.set({ phase: "uncertain", message: "r2UncertainFinality", operation, reason });
      return;
    }
    if (
      operation.orderId !== order.id ||
      order.assignment !== "assigned" ||
      order.driverId !== operation.driverId ||
      order.statusCode !== 2 ||
      serviceSnapshot(order) !== operation.service
    ) {
      d.set({
        phase: "accepted",
        message: "assignmentAwaitingRead",
        operation,
        receipt: operation.receipt,
      });
      return;
    }
    if (operation.replacement && order.financeSnapshot !== operation.replacement.finance) {
      d.set({
        phase: "accepted",
        message: "r2FinancialChanged",
        operation,
        receipt: operation.receipt,
      });
      return;
    }
    // Retire replacement authority first. A cleanup failure must keep the PUT locked.
    if (operation.replacement) d.completedReplacement?.();
    d.clear();
    d.set({
      phase: "success",
      message: operation.replacement ? "r2ReplacementSuccess" : "assignmentSuccess",
      receipt: operation.receipt,
      operation,
    });
  } catch {
    d.set({
      phase: operation?.receipt ? "accepted" : "uncertain",
      message: operation?.receipt ? "assignmentRefreshFailed" : "r2UncertainFinality",
      receipt: operation?.receipt,
      operation,
      reason,
    });
  }
}

export async function checkAssignmentOutcome(d: AssignmentDependencies): Promise<void> {
  const previous = d.get();
  if (previous.phase === "busy") return;
  if (!readAllowed(d)) {
    d.set({ ...previous, message: "assignmentForbidden" });
    return;
  }
  d.set({ ...previous, phase: "busy", message: "assignmentChecking" });
  await d.invalidate().catch(() => undefined);
  await reconcile(d, previous.operation, previous.reason);
}

export async function submitInitialAssignment(
  d: AssignmentDependencies,
  request: AssignmentRequest,
): Promise<void> {
  if (submittedReviews.has(request) || !["idle", "rejected", "retryable"].includes(d.get().phase))
    return;
  if (!d.authorized()) {
    d.set({ phase: "rejected", message: "assignmentForbidden" });
    return;
  }
  d.set({ phase: "busy", message: "assignmentChecking" });
  let payload: TowTruckAssignmentPayload;
  let operation: AssignmentRecord;
  let readingDriver = true;
  try {
    // Driver-only validation first; the fresh order decides quotation requirements.
    const selected = dispatchDraftSchema(false).safeParse(request.values);
    if (!selected.success) {
      d.set({ phase: "rejected", message: "assignmentValidation" });
      return;
    }
    const driver = await d.readDriver(selected.data.driverId);
    if (driver.id !== selected.data.driverId || !canSelectDriver(driver)) {
      d.set({
        phase: "rejected",
        message: driverEligibilityMessage(driver, selected.data.driverId) ?? "driverChanged",
      });
      return;
    }
    readingDriver = false;
    const order = await d.readOrder();
    const evidence = d.evidence?.() ?? null;
    const blocked = initialAssignmentBlock(order, evidence);
    if (order.id !== d.orderId || blocked || dispatchSnapshot(order) !== request.snapshot) {
      d.set({ phase: "rejected", message: blocked ?? "requestChanged" });
      return;
    }
    if (evidence && evidence !== "unverified" && evidence.driverId === driver.id) {
      d.set({ phase: "rejected", message: "r2SameDriver" });
      return;
    }
    const parsed = dispatchDraftSchema(order.dispatchService === "intracity").safeParse(
      request.values,
    );
    if (!parsed.success) {
      d.set({ phase: "rejected", message: "assignmentValidation" });
      return;
    }
    payload =
      order.dispatchService === "intercity"
        ? { towTruckDriverId: Number(driver.id) }
        : {
            towTruckDriverId: Number(driver.id),
            cost: Number(normalizeArabicNumerals(parsed.data.cost)),
            duration: parsed.data.duration,
          };
    operation = {
      orderId: d.orderId,
      driverId: driver.id,
      service: serviceSnapshot(order),
      ...(evidence && evidence !== "unverified" ? { replacement: evidence } : {}),
    };
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
    d.mark(operation);
  } catch {
    d.set({ phase: "rejected", message: "assignmentStorage" });
    return;
  }
  d.set({ phase: "busy", message: "assignmentSending", operation });
  let reason: string | undefined;
  try {
    await d.send(payload);
    operation = { ...operation, receipt: payload };
    try {
      d.mark(operation);
    } catch {
      /* Pending journal stays conservative on reload. */
    }
  } catch (error) {
    const rejection = assignmentRejection(error);
    if (rejection) {
      try {
        d.clear();
      } catch {
        d.set({ phase: "uncertain", message: "assignmentStorage", operation });
        return;
      }
      d.set({ phase: "rejected", message: rejection, driverId: operation.driverId });
      await d.invalidate().catch(() => undefined);
      if (readAllowed(d)) await d.readOrder().catch(() => undefined);
      return;
    }
    reason = uncertainAssignmentReason(error);
  }
  d.set({ phase: "busy", message: "assignmentChecking", operation, receipt: operation.receipt });
  await d.invalidate().catch(() => undefined);
  await reconcile(d, operation, reason);
}
