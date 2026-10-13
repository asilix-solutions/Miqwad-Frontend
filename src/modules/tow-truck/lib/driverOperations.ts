import { z } from "zod";
import { getRolePermissions, hasPermission } from "@shared/auth/permissions";
import { AppError } from "@shared/types/api";
import type { AdminUserRow } from "@modules/admin/types";
import type { TowTruckOrder } from "./towTruckModel";

export type DriverAction = "remove" | "activate" | "deactivate";
export interface OperationIdentity {
  kind: DriverAction;
  orderId: string;
  driverId: string;
  acknowledged?: boolean;
}
export interface DriverProposal extends OperationIdentity {
  snapshot: string;
  driverName: string;
  orderNumber: string;
  note?: string;
  riskConfirmed?: boolean;
}
export interface DriverOperationState {
  phase:
    | "idle"
    | "busy"
    | "rejected"
    | "uncertain"
    | "accepted"
    | "retryable"
    | "success"
    | "observed";
  message?: string;
  operation?: OperationIdentity;
  financeBefore?: string;
  financialWarning?: boolean;
  refreshFailed?: boolean;
}
export function driverOperationAuthorized(
  actor: string,
  user: { id: string; role?: string; permissions?: string[] } | null | undefined,
  kind: DriverAction,
): boolean {
  const permissions = user?.permissions?.length ? user.permissions : getRolePermissions(user?.role);
  return (
    !!actor &&
    user?.id === actor &&
    hasPermission(permissions, "orders.view") &&
    (kind === "remove"
      ? hasPermission(permissions, "orders.manage")
      : hasPermission(permissions, "users.view") &&
        hasPermission(permissions, kind === "activate" ? "users.restore" : "users.suspend"))
  );
}
export const noteSchema = z.object({
  note: z.string().trim().min(1, "opsReasonRequired").max(500, "opsReasonLong"),
});
export const validDriverId = (id: string) =>
  /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
export function verifiedDriver(user: AdminUserRow, id: string): boolean {
  return (
    validDriverId(id) && user.id === id && user.role === 5 && typeof user.isActive === "boolean"
  );
}
export function driverSnapshot(user: AdminUserRow): string {
  return JSON.stringify([user.id, user.role, user.isActive, user.fullName]);
}
export function operationLocked(state: DriverOperationState): boolean {
  return ["busy", "uncertain", "accepted"].includes(state.phase);
}
export function operationRejection(error: unknown): string | null {
  if (!(error instanceof AppError)) return null;
  if (error.code === "OP_REJECTED" && error.status === undefined) return "opsRejected";
  switch (error.status) {
    case 400:
    case 422:
      return "opsValidation";
    case 401:
      return "opsAuthentication";
    case 403:
      return "opsForbidden";
    case 404:
      return "opsMissing";
    case 409:
      return "opsConflict";
    default:
      return null;
  }
}
export interface OperationDependencies {
  get: () => DriverOperationState;
  set: (state: DriverOperationState) => void;
  authorized: (kind: DriverAction) => boolean;
  conflict: () => boolean;
  readOrder: (id: string) => Promise<TowTruckOrder>;
  readDriver: (id: string) => Promise<AdminUserRow>;
  send: (operation: OperationIdentity, note?: string) => Promise<void>;
  mark: (operation: OperationIdentity) => void;
  clear: () => void;
  invalidate: (operation: OperationIdentity) => Promise<void>;
}
const consumed = new WeakSet<DriverProposal>();

async function reconcile(d: OperationDependencies, state: DriverOperationState): Promise<void> {
  const operation = state.operation;
  if (!operation) {
    d.set({ phase: "uncertain", message: "opsRecoveryMissing" });
    return;
  }
  const accepted = !!operation.acknowledged;
  if (!d.authorized(operation.kind)) {
    d.set({ ...state, phase: accepted ? "accepted" : "uncertain", message: "opsForbidden" });
    return;
  }
  try {
    let complete: boolean,
      changed = false,
      financialWarning = false;
    if (operation.kind === "remove") {
      const order = await d.readOrder(operation.orderId);
      if (order.id !== operation.orderId || order.assignment === "unknown")
        throw new Error("Unverified order");
      complete = order.assignment === "unassigned";
      changed = order.assignment === "assigned" && order.driverId !== operation.driverId;
      financialWarning = !state.financeBefore || state.financeBefore !== order.financeSnapshot;
    } else {
      const user = await d.readDriver(operation.driverId);
      if (!verifiedDriver(user, operation.driverId)) throw new Error("Unverified account");
      complete = user.isActive === (operation.kind === "activate");
    }
    if (complete || changed || !accepted) {
      // If durable cleanup fails, leave recovery locked rather than losing the journal.
      d.clear();
      d.set({
        ...state,
        financialWarning,
        phase: complete ? (accepted ? "success" : "observed") : changed ? "observed" : "retryable",
        message: complete
          ? accepted
            ? `opsSuccess_${operation.kind}`
            : "opsObserved"
          : changed
            ? "opsDifferentDriver"
            : "opsRetryReview",
      });
    } else {
      d.set({ ...state, financialWarning, phase: "accepted", message: "opsAwaitingRead" });
    }
  } catch {
    d.set({
      ...state,
      phase: accepted ? "accepted" : "uncertain",
      message: accepted ? "opsRefreshFailed" : "opsUncertain",
    });
  }
}

export async function submitDriverOperation(
  d: OperationDependencies,
  proposal: DriverProposal,
): Promise<void> {
  if (consumed.has(proposal) || operationLocked(d.get()) || d.conflict()) return;
  if (!d.authorized(proposal.kind)) {
    d.set({ phase: "rejected", message: "opsForbidden" });
    return;
  }
  if (!validDriverId(proposal.orderId) || !validDriverId(proposal.driverId)) {
    d.set({ phase: "rejected", message: "opsIdentity" });
    return;
  }
  const note =
    proposal.kind === "deactivate" ? noteSchema.safeParse({ note: proposal.note }) : null;
  if (note && !note.success) {
    d.set({ phase: "rejected", message: "opsReasonInvalid" });
    return;
  }
  d.set({ phase: "busy", message: "opsChecking" });
  let financeBefore: string | undefined;
  try {
    if (proposal.kind === "remove") {
      const order = await d.readOrder(proposal.orderId);
      if (
        order.id !== proposal.orderId ||
        order.assignment !== "assigned" ||
        order.driverId !== proposal.driverId ||
        order.operationSnapshot !== proposal.snapshot
      ) {
        d.set({ phase: "rejected", message: "opsChanged" });
        return;
      }
      if (order.removalPayment !== "pending" && !proposal.riskConfirmed) {
        d.set({ phase: "rejected", message: "opsRiskRequired" });
        return;
      }
      financeBefore = order.financeSnapshot;
    } else {
      const user = await d.readDriver(proposal.driverId);
      if (
        !verifiedDriver(user, proposal.driverId) ||
        driverSnapshot(user) !== proposal.snapshot ||
        user.isActive === (proposal.kind === "activate")
      ) {
        d.set({ phase: "rejected", message: "opsAccountChanged" });
        return;
      }
    }
    if (!d.authorized(proposal.kind) || d.conflict()) {
      d.set({ phase: "rejected", message: "opsForbidden" });
      return;
    }
  } catch (error) {
    d.set({ phase: "rejected", message: operationRejection(error) ?? "opsPreflightFailed" });
    return;
  }
  const operation: OperationIdentity = {
    kind: proposal.kind,
    orderId: proposal.orderId,
    driverId: proposal.driverId,
  };
  consumed.add(proposal);
  try {
    d.mark(operation);
  } catch {
    d.set({ phase: "rejected", message: "opsStorage" });
    return;
  }
  d.set({ phase: "busy", message: "opsSending", operation, financeBefore });
  try {
    await d.send(operation, note?.success ? note.data.note : undefined);
    operation.acknowledged = true;
    try {
      d.mark(operation);
    } catch {
      /* The pending marker remains; reload uses conservative GET recovery. */
    }
  } catch (error) {
    const rejection = operationRejection(error);
    if (rejection) {
      try {
        d.clear();
      } catch {
        d.set({ phase: "uncertain", message: "opsStorage", operation, financeBefore });
        return;
      }
      // A rejected action may reflect another administrator's change. Refresh
      // the affected record while retaining the explicit rejection outcome.
      let refreshFailed = false;
      if (
        d.authorized(operation.kind) &&
        !["opsAuthentication", "opsForbidden"].includes(rejection)
      ) {
        await d.invalidate(operation).catch(() => undefined);
        try {
          if (operation.kind === "remove") await d.readOrder(operation.orderId);
          else await d.readDriver(operation.driverId);
        } catch {
          refreshFailed = true;
        }
      }
      d.set({ phase: "rejected", message: rejection, operation, refreshFailed });
      return;
    }
  }
  const state: DriverOperationState = {
    phase: "busy",
    message: "opsChecking",
    operation,
    financeBefore,
  };
  d.set(state);
  await d.invalidate(operation).catch(() => undefined);
  await reconcile(d, state);
}

export async function recoverDriverOperation(d: OperationDependencies): Promise<void> {
  const state = d.get();
  if (
    state.phase === "busy" ||
    !state.operation ||
    !d.authorized(state.operation.kind) ||
    d.conflict()
  )
    return;
  d.set({ ...state, phase: "busy", message: "opsChecking" });
  await d.invalidate(state.operation).catch(() => undefined);
  await reconcile(d, state);
}
