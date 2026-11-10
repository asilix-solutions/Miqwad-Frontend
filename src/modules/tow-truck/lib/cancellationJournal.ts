import type { OperationIdentity } from "./driverOperations";
import type { QueryClient } from "@tanstack/react-query";
import { operationCancellationLocked, type CancellationState } from "./cancellationModel";

export const cancellationKey = (actor: string, orderId: string) =>
  ["tow-truck-cancellation", actor, orderId] as const;
export const cancellationMarker = (actor: string, orderId: string) =>
  `miqwad:cancellation:v1:${encodeURIComponent(actor)}:${encodeURIComponent(orderId)}`;

export function readCancellationJournal(actor: string, orderId: string): CancellationState {
  if (!actor || !orderId) return { phase: "idle" };
  try {
    const raw = sessionStorage.getItem(cancellationMarker(actor, orderId));
    if (raw === null) return { phase: "idle" };
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      !("version" in value) ||
      value.version !== 1 ||
      !("actor" in value) ||
      value.actor !== actor ||
      !("orderId" in value) ||
      value.orderId !== orderId ||
      !("outcome" in value) ||
      !["pending", "acknowledged", "observed"].includes(String(value.outcome))
    )
      throw new Error("Invalid cancellation journal");
    if (value.outcome === "observed") return { phase: "success", message: "cancelSuccess" };
    const acknowledged = value.outcome === "acknowledged";
    return {
      phase: acknowledged ? "accepted" : "uncertain",
      message: acknowledged ? "cancelAcknowledged" : "cancelUncertain",
      acknowledged,
      isUncertain: true,
    };
  } catch {
    return { phase: "uncertain", message: "cancelStorage", isUncertain: true };
  }
}

export function writeCancellationJournal(
  actor: string,
  orderId: string,
  outcome: "pending" | "acknowledged" | "observed",
): void {
  if (!actor || !orderId) throw new Error("Missing cancellation identity");
  // Tab-session scope, actor/order only. No financial snapshots or customer/credential data.
  const key = cancellationMarker(actor, orderId);
  const value = JSON.stringify({ version: 1, actor, orderId, outcome });
  sessionStorage.setItem(key, value);
  if (sessionStorage.getItem(key) !== value) throw new Error("Cancellation journal not saved");
}

export function clearCancellationJournal(actor: string, orderId: string): void {
  const key = cancellationMarker(actor, orderId);
  sessionStorage.removeItem(key);
  if (sessionStorage.getItem(key) !== null) throw new Error("Cancellation journal not cleared");
}

export function cancellationState(
  qc: QueryClient,
  actor: string,
  orderId: string,
): CancellationState {
  const cached = qc.getQueryData<CancellationState>(cancellationKey(actor, orderId));
  const journal = readCancellationJournal(actor, orderId);
  return cached && operationCancellationLocked(cached)
    ? cached
    : operationCancellationLocked(journal)
      ? journal
      : (cached ?? journal);
}

export function cancellationBlocks(qc: QueryClient, actor: string, orderId: string): boolean {
  return operationCancellationLocked(cancellationState(qc, actor, orderId));
}

/** A completed cancellation protects order writes, not independent account changes. */
export function cancellationConflictsWithDriverMutation(
  qc: QueryClient,
  actor: string,
  operation: Pick<OperationIdentity, "kind" | "orderId">,
): boolean {
  const state = cancellationState(qc, actor, operation.orderId);
  return (
    operationCancellationLocked(state) && (operation.kind === "remove" || state.phase !== "success")
  );
}
