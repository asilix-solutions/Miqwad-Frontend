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
  | "busy"
  | "conflict"
  | "rejected"
  | "uncertain"
  | "success";

export interface CancellationState {
  phase: CancellationPhase;
  message?: string;
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
  customMessage?: string;
}

/**
 * Normalizes error outcomes:
 * - 409 Conflict: payment conflict. Returns backend message or localized key.
 * - 404 Not Found: privacy-preserving generic key ("الطلب غير متاح أو لا تملك صلاحية إلغائه.").
 * - 401/403: permission denied.
 * - 400/422: validation failure.
 * - Network / timeout / 5xx / OP_UNCERTAIN: uncertain outcome.
 */
export function cancellationRejection(error: unknown): CancellationRejectionInfo {
  if (error instanceof AppError) {
    if (error.status === 409) {
      return {
        key: "cancelBlockedPaid",
        status: 409,
        isConflict: true,
        customMessage: error.message || undefined,
      };
    }
    if (error.status === 404) {
      return {
        key: "cancelNotFound",
        status: 404,
        isPrivacy404: true,
      };
    }
    if (error.status === 401 || error.status === 403) {
      return {
        key: "cancelForbidden",
        status: error.status,
      };
    }
    if (error.status === 400 || error.status === 422) {
      return {
        key: "cancelValidation",
        status: error.status,
      };
    }
  }
  return {
    key: "cancelUncertain",
    isUncertain: true,
  };
}

export interface CancellationDependencies {
  orderId: string;
  authorized: () => boolean;
  get: () => CancellationState;
  set: (state: CancellationState) => void;
  readOrder: (id: string) => Promise<TowTruckOrder>;
  sendCancel: (id: string) => Promise<RawOrder | null>;
  invalidate: () => Promise<void>;
}

const inFlightOrders = new Set<string>();

export function isOrderCancellationInFlight(orderId: string): boolean {
  return inFlightOrders.has(orderId);
}

export function operationCancellationLocked(state: CancellationState): boolean {
  return state.phase === "busy" || state.phase === "uncertain";
}

/**
 * Submits the cancellation request using established preflight checks,
 * in-flight double-click guards, and comprehensive error handling.
 */
export async function submitOrderCancellation(
  d: CancellationDependencies,
  order: TowTruckOrder,
): Promise<void> {
  if (inFlightOrders.has(order.id) || operationCancellationLocked(d.get())) {
    return;
  }
  if (!d.authorized()) {
    d.set({ phase: "rejected", message: "cancelForbidden" });
    return;
  }
  const eligibility = orderCancellationEligibility(order);
  if (!eligibility.eligible) {
    const messageKey =
      eligibility.reason === "alreadyCancelled"
        ? "cancelBlockedAlreadyCancelled"
        : eligibility.reason === "paid"
          ? "cancelBlockedPaid"
          : "cancelBlockedUnknownPayment";
    d.set({ phase: "rejected", message: messageKey });
    return;
  }

  inFlightOrders.add(order.id);
  d.set({ phase: "busy", message: "cancellingOrder" });

  try {
    await d.sendCancel(order.id);
    await d.invalidate().catch(() => undefined);
    d.set({ phase: "success", message: "cancelSuccess" });
  } catch (error) {
    const rejection = cancellationRejection(error);
    if (rejection.isConflict) {
      // 409: Refresh order queries to reflect authoritative payment status from backend
      await d.invalidate().catch(() => undefined);
      d.set({
        phase: "conflict",
        message: rejection.customMessage || rejection.key,
        isConflict: true,
      });
      return;
    }
    if (rejection.isPrivacy404) {
      await d.invalidate().catch(() => undefined);
      d.set({
        phase: "rejected",
        message: rejection.key,
        isPrivacy404: true,
      });
      return;
    }
    if (rejection.isUncertain) {
      // Network failure, timeout, or 5xx: lock and do not automatically retry
      d.set({
        phase: "uncertain",
        message: rejection.key,
        isUncertain: true,
      });
      return;
    }
    d.set({
      phase: "rejected",
      message: rejection.key,
    });
  } finally {
    inFlightOrders.delete(order.id);
  }
}

/**
 * Reconciles an uncertain cancellation outcome by executing an authoritative GET request.
 * If the refreshed order has status Canceled (5), transitions to success.
 * Otherwise resets to idle so the user can review before any subsequent attempt.
 */
export async function reconcileOrderCancellation(
  d: CancellationDependencies,
  orderId: string,
): Promise<void> {
  const current = d.get();
  if (current.phase === "busy") return;
  d.set({ phase: "busy", message: "cancelChecking" });
  try {
    const order = await d.readOrder(orderId);
    await d.invalidate().catch(() => undefined);
    if (order.statusCode === 5 || order.status === "Canceled") {
      d.set({ phase: "success", message: "cancelSuccess" });
    } else {
      d.set({ phase: "idle" });
    }
  } catch {
    d.set({ phase: "uncertain", message: "cancelUncertain", isUncertain: true });
  }
}
