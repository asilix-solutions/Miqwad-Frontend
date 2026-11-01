import { useQuery, useQueryClient } from "@tanstack/react-query";
import { store, useAppSelector } from "@app/store";
import { getRolePermissions, hasPermission } from "@shared/auth/permissions";
import { ordersApi } from "@modules/orders/api/ordersApi";
import { orderKeys } from "@modules/orders/hooks/useOrdersQueries";
import { adaptTowTruck, type TowTruckOrder } from "../lib/towTruckModel";
import {
  cancellationBusy,
  orderCancellationEligibility,
  reconcileOrderCancellation,
  resetCancellationReview,
  submitOrderCancellation,
  type CancellationDependencies,
  type CancellationState,
} from "../lib/cancellationModel";
import {
  cancellationKey,
  cancellationState,
  clearCancellationJournal,
  readCancellationJournal,
  writeCancellationJournal,
} from "../lib/cancellationJournal";
import { driverOperationBlocks } from "../lib/driverOperationGuards";

export function useTowTruckCancellation(
  order: TowTruckOrder | null | undefined,
  routeOrderId?: string,
) {
  const qc = useQueryClient();
  const actor = useAppSelector((s) => s.auth.user?.id) ?? "";
  const orderId = routeOrderId ?? order?.id ?? "";
  const key = cancellationKey(actor, orderId);
  const { data: state } = useQuery<CancellationState>({
    queryKey: key,
    enabled: false,
    queryFn: () => cancellationState(qc, actor, orderId),
    initialData: () => readCancellationJournal(actor, orderId),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const authorized = () => {
    const user = store.getState().auth.user;
    const permissions = user?.permissions?.length
      ? user.permissions
      : getRolePermissions(user?.role);
    return (
      !!actor &&
      user?.id === actor &&
      (user.role === "admin" ||
        user.role === "super_admin" ||
        hasPermission(permissions, "orders.manage"))
    );
  };
  const conflict = () => {
    if (driverOperationBlocks(qc, actor)) return true;
    const assignment = qc.getQueryData<{ phase: string }>([
      "tow-truck-assignment-outcome",
      actor,
      orderId,
    ]);
    if (assignment && ["busy", "uncertain", "accepted"].includes(assignment.phase)) return true;
    try {
      return sessionStorage.getItem(`miqwad:initial-assignment:${actor}:${orderId}`) !== null;
    } catch {
      return true;
    }
  };
  const deps: CancellationDependencies = {
    actor,
    orderId,
    authorized,
    conflict,
    get: () => cancellationState(qc, actor, orderId),
    set: (next) => qc.setQueryData(key, next),
    readOrder: async (id) => {
      if (!authorized() || id !== orderId) throw new Error("Unverified identity");
      await qc.cancelQueries({ queryKey: orderKeys.detail(id), exact: true });
      const raw = await ordersApi.get(id);
      const adapted = adaptTowTruck(raw);
      if (!authorized() || adapted.id !== id) throw new Error("Unverified order");
      qc.setQueryData(orderKeys.detail(id), raw);
      return adapted;
    },
    sendCancel: (id) => ordersApi.cancel(id),
    mark: (outcome) => writeCancellationJournal(actor, orderId, outcome),
    clear: () => clearCancellationJournal(actor, orderId),
    invalidate: async () => {
      if (!authorized()) return;
      await qc.invalidateQueries({ queryKey: orderKeys.all, refetchType: "none" });
      void qc
        .refetchQueries({ queryKey: [...orderKeys.all, "list"], type: "active" })
        .catch(() => undefined);
    },
  };
  const eligibility = orderCancellationEligibility(order);
  return {
    state,
    busy: cancellationBusy(state),
    isConflict: !!state.isConflict,
    isUncertain: !!state.isUncertain,
    isPrivacy404: !!state.isPrivacy404,
    eligibility,
    canCancel: state.phase === "idle" && eligibility.eligible && authorized(),
    cancel: async () => {
      if (order) await submitOrderCancellation(deps, order);
    },
    reconcile: () => reconcileOrderCancellation(deps, orderId),
    reset: () => deps.set(resetCancellationReview(deps.get())),
  };
}

export type TowTruckCancellation = ReturnType<typeof useTowTruckCancellation>;
