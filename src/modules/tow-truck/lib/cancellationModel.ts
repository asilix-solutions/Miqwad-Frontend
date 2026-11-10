/**
 * @file cancellationModel.ts
 * @description Domain logic, eligibility guards, and error reconciliation for
 * Admin Tow Truck Order cancellation.
 * Ensures strict payment protection (numeric PaymentStatus 2 = Paid blocks cancellation),
 * prevents duplicate mutations, maps server 409 conflict & 404 privacy errors, and
 * enforces GET-based reconciliation for uncertain network outcomes.
 */
import { AppError } from "@shared/types/api";
import type { RawOrder } from "@modules/orders/api/ordersApi";
import type { TowTruckOrder } from "./towTruckModel";

export type CancellationEligibility =
  | { eligible: true }
  | { eligible: false; reason: "alreadyCancelled" | "paid" | "unknownPayment" };

/**
 * Checks whether an order is eligible for cancellation according to confirmed backend rules:
 * - Already cancelled (status 5 / "Canceled"): cannot be cancelled again.
 * - Paid (numeric paymentStatus 2 / "Paid"): strictly rejected / withheld with 409 guard.
 * - Corrupted / invalid payment status: reported as unverified uncertainty.
 */
export function orderCancellationEligibility(
  order: TowTruckOrder | null | undefined,
): CancellationEligibility {
  if (!order) {
    return { eligible: false, reason: "unknownPayment" };
  }
  if (order.statusCode === 5 || order.status === "Canceled") {
    return { eligible: false, reason: "alreadyCancelled" };
  }
  if (order.paymentCode === 2 || order.paymentStatus === "Paid") {
    return { eligible: false, reason: "paid" };
  }
  if (
    !order.paymentStatusValid ||
    (order.paymentCode !== null &&
      order.paymentCode !== undefined &&
      ![0, 1, 2, 3, 4].includes(order.paymentCode))
  ) {
    return { eligible: false, reason: "unknownPayment" };
  }
  return { eligible: true };
}

export type CancellationPhase =
  | "idle"
  | "preflight"
  | "busy"
  | "checking"
  | "conflict"
  | "rejected"
  | "accepted"
  | "uncertain"
  | "readFailed"
  | "success";

export interface CancellationState {
  phase: CancellationPhase;
  message?: string;
  acknowledged?: boolean;
  isConflict?: boolean;
  isUncertain?: boolean;
  isPrivacy404?: boolean;
}

export interface CancellationRejectionInfo {
  key: string;
  status?: number;
  isConflict?: boolean;
  isPrivacy404?: boolean;
  isUncertain?: boolean;
}

export function cancellationRejection(error: unknown): CancellationRejectionInfo {
  if (error instanceof AppError) {
    if (error.code === "OP_REJECTED" && error.status === undefined)
      return { key: "cancelValidation" };
    if (error.status === 409) return { key: "cancelBlockedPaid", status: 409, isConflict: true };
    if (error.status === 404) return { key: "cancelNotFound", status: 404, isPrivacy404: true };
    if (error.status === 401 || error.status === 403)
      return { key: "cancelForbidden", status: error.status };
    if (error.status === 400 || error.status === 422)
      return { key: "cancelValidation", status: error.status };
  }
  return { key: "cancelUncertain", isUncertain: true };
}

export interface CancellationDependencies {
  actor: string;
  orderId: string;
  authorized: () => boolean;
  conflict: () => boolean;
  get: () => CancellationState;
  set: (state: CancellationState) => void;
  readOrder: (id: string) => Promise<TowTruckOrder>;
  sendCancel: (id: string) => Promise<RawOrder | null>;
  mark: (outcome: "pending" | "acknowledged" | "observed") => void;
  clear: () => void;
  invalidate: () => Promise<void>;
}

const inFlight = new Set<string>();
const flightKey = (d: CancellationDependencies) => JSON.stringify([d.actor, d.orderId]);

export function cancellationBusy(state: CancellationState): boolean {
  return ["preflight", "busy", "checking"].includes(state.phase);
}

export function operationCancellationLocked(state: CancellationState): boolean {
  return (
    cancellationBusy(state) ||
    ["accepted", "uncertain", "readFailed", "success"].includes(state.phase)
  );
}

// Closing the dialog is presentation only. A completed observation is also retained
// so an old cached order cannot authorize a second cancellation.
export function resetCancellationReview(state: CancellationState): CancellationState {
  return operationCancellationLocked(state) ? state : { phase: "idle" };
}

function eligibilityMessage(order: TowTruckOrder): string | null {
  const eligibility = orderCancellationEligibility(order);
  if (!eligibility.eligible)
    return eligibility.reason === "alreadyCancelled"
      ? "cancelBlockedAlreadyCancelled"
      : eligibility.reason === "paid"
        ? "cancelBlockedPaid"
        : "cancelBlockedUnknownPayment";
  if (!order.status || order.statusCode === null || ![1, 2, 3, 4, 5].includes(order.statusCode))
    return "cancelReviewFailed";
  return null;
}

async function observe(d: CancellationDependencies, acknowledged = false): Promise<void> {
  try {
    if (!d.authorized()) throw new Error("Permission changed");
    const order = await d.readOrder(d.orderId);
    if (!d.authorized() || order.id !== d.orderId) throw new Error("Unverified order");
    if (order.statusCode === 5 && order.status === "Canceled") {
      // Persist a safe tombstone rather than releasing the lock against stale caches.
      d.mark("observed");
      d.set({ phase: "success", message: "cancelSuccess", acknowledged });
    } else {
      d.set({
        phase: acknowledged ? "accepted" : "uncertain",
        message: acknowledged ? "cancelAcknowledged" : "cancelUncertain",
        acknowledged,
        isUncertain: true,
      });
    }
  } catch {
    d.set({ phase: "readFailed", message: "cancelReadFailed", acknowledged, isUncertain: true });
  }
}

export async function submitOrderCancellation(
  d: CancellationDependencies,
  order: TowTruckOrder,
): Promise<void> {
  const key = flightKey(d);
  // Only a new review can authorize a write; rejection requires closing/reviewing again.
  if (inFlight.has(key) || d.get().phase !== "idle") return;
  if (!d.actor || !d.authorized()) {
    d.set({ phase: "rejected", message: "cancelForbidden" });
    return;
  }
  if (d.conflict()) {
    d.set({ phase: "rejected", message: "cancelOperationConflict" });
    return;
  }
  if (
    order.id !== d.orderId ||
    !/^[1-9]\d*$/.test(d.orderId) ||
    !Number.isSafeInteger(Number(d.orderId))
  ) {
    d.set({ phase: "rejected", message: "cancelReviewFailed" });
    return;
  }
  const blocked = eligibilityMessage(order);
  if (blocked) {
    d.set({ phase: "rejected", message: blocked });
    return;
  }
  inFlight.add(key);
  d.set({ phase: "preflight", message: "cancelChecking" });
  try {
    try {
      const fresh = await d.readOrder(d.orderId);
      if (fresh.id !== d.orderId) throw new Error("Mismatched order");
      const reason = eligibilityMessage(fresh);
      if (reason || fresh.operationSnapshot !== order.operationSnapshot) {
        d.set({ phase: "rejected", message: reason ?? "cancelReviewChanged" });
        return;
      }
      if (!d.authorized() || d.conflict()) {
        d.set({ phase: "rejected", message: "cancelOperationConflict" });
        return;
      }
    } catch {
      d.set({ phase: "rejected", message: "cancelReviewFailed" });
      return;
    }
    try {
      // Synchronous, read-back-verified durable marker BEFORE the only destructive call.
      d.mark("pending");
    } catch {
      d.set({ phase: "uncertain", message: "cancelStorage", isUncertain: true });
      return;
    }
    d.set({ phase: "busy", message: "cancellingOrder" });
    try {
      await d.sendCancel(d.orderId);
    } catch (error) {
      const rejection = cancellationRejection(error);
      if (rejection.isUncertain) {
        d.set({ phase: "uncertain", message: "cancelUncertain", isUncertain: true });
        return;
      }
      try {
        d.clear();
      } catch {
        d.set({ phase: "uncertain", message: "cancelStorage", isUncertain: true });
        return;
      }
      d.set({
        phase: rejection.isConflict ? "conflict" : "rejected",
        message: rejection.key,
        isConflict: rejection.isConflict,
        isPrivacy404: rejection.isPrivacy404,
      });
      await d.invalidate().catch(() => undefined);
      return;
    }
    try {
      d.mark("acknowledged");
    } catch {
      // Pending marker remains conservative on reload; never resend an acknowledged PUT.
    }
    d.set({ phase: "checking", acknowledged: true, isUncertain: true });
    await d.invalidate().catch(() => undefined);
    await observe(d, true);
  } finally {
    inFlight.delete(key);
  }
}

export async function reconcileOrderCancellation(
  d: CancellationDependencies,
  orderId: string,
): Promise<void> {
  const current = d.get();
  const key = flightKey(d);
  if (
    orderId !== d.orderId ||
    inFlight.has(key) ||
    cancellationBusy(current) ||
    !operationCancellationLocked(current) ||
    current.phase === "success"
  )
    return;
  if (!d.authorized()) {
    d.set({ ...current, message: "cancelForbidden", isUncertain: true });
    return;
  }
  inFlight.add(key);
  d.set({ ...current, phase: "checking", message: "cancelChecking", isUncertain: true });
  try {
    await observe(d, current.acknowledged);
  } finally {
    inFlight.delete(key);
  }
}
