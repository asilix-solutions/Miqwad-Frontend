import { removalHistoryKey } from "./reassignment";
import type { QueryClient } from "@tanstack/react-query";
import {
  operationLocked,
  type DriverOperationState,
  type OperationIdentity,
} from "./driverOperations";

export const driverOperationKey = (actor: string) => ["tow-driver-operation", actor] as const;
export const driverOperationMarker = (actor: string) => `miqwad:driver-operation:${actor}`;
const historyKey = removalHistoryKey;
export function readDriverJournal(actor: string): DriverOperationState {
  try {
    const raw = sessionStorage.getItem(driverOperationMarker(actor));
    if (!raw) return { phase: "idle" };
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      return { phase: "uncertain", message: "opsRecoveryMissing" };
    }
    if (
      !value ||
      typeof value !== "object" ||
      !("kind" in value) ||
      !("orderId" in value) ||
      !("driverId" in value) ||
      !["remove", "activate", "deactivate"].includes(String(value.kind)) ||
      typeof value.orderId !== "string" ||
      !/^[1-9]\d*$/.test(value.orderId) ||
      !Number.isSafeInteger(Number(value.orderId)) ||
      typeof value.driverId !== "string" ||
      !/^[1-9]\d*$/.test(value.driverId) ||
      !Number.isSafeInteger(Number(value.driverId))
    )
      return { phase: "uncertain", message: "opsRecoveryMissing" };
    const operation: OperationIdentity = {
      kind: value.kind as OperationIdentity["kind"],
      orderId: value.orderId,
      driverId: value.driverId,
      acknowledged: "acknowledged" in value && value.acknowledged === true,
      ...("removal" in value &&
      value.removal &&
      typeof value.removal === "object" &&
      "orderId" in value.removal &&
      value.removal.orderId === value.orderId &&
      "driverId" in value.removal &&
      value.removal.driverId === value.driverId &&
      "finance" in value.removal &&
      typeof value.removal.finance === "string" &&
      "service" in value.removal &&
      typeof value.removal.service === "string"
        ? {
            removal: {
              orderId: value.orderId,
              driverId: value.driverId,
              finance: value.removal.finance,
              service: value.removal.service,
            },
          }
        : {}),
    };
    return {
      phase: operation.acknowledged ? "accepted" : "uncertain",
      message: operation.acknowledged ? "opsRefreshFailed" : "opsUncertain",
      operation,
    };
  } catch {
    return { phase: "uncertain", message: "opsStorage" };
  }
}
export function writeDriverJournal(actor: string, operation: OperationIdentity): void {
  // Minimal identity and material comparison fields; no notes, names or credentials.
  if (operation.kind === "remove")
    sessionStorage.setItem(historyKey(actor, operation.orderId), "review-required");
  sessionStorage.setItem(driverOperationMarker(actor), JSON.stringify(operation));
}
export function removalHistory(actor: string, orderId: string): boolean {
  try {
    return !!sessionStorage.getItem(historyKey(actor, orderId));
  } catch {
    return true;
  }
}
export function driverOperationBlocks(qc: QueryClient, actor: string): boolean {
  return (
    operationLocked(
      qc.getQueryData<DriverOperationState>(driverOperationKey(actor)) ?? { phase: "idle" },
    ) || operationLocked(readDriverJournal(actor))
  );
}
export function initialOperationBlocks(
  qc: QueryClient,
  actor: string,
  exceptOrderId?: string,
): boolean {
  if (
    qc
      .getQueriesData<{ phase: string }>({ queryKey: ["tow-truck-assignment-outcome", actor] })
      .some(
        ([key, state]) =>
          key[2] !== exceptOrderId &&
          state &&
          ["busy", "uncertain", "accepted"].includes(state.phase),
      )
  )
    return true;
  try {
    for (let i = 0; i < sessionStorage.length; i++)
      if (
        sessionStorage.key(i)?.startsWith(`miqwad:initial-assignment:${actor}:`) &&
        sessionStorage.key(i) !== `miqwad:initial-assignment:${actor}:${exceptOrderId}`
      )
        return true;
    return false;
  } catch {
    return true;
  }
}
