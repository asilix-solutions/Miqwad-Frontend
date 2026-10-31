/**
 * @file useTowTruckCancellation.ts
 * @description TanStack Query mutation & state management hook for Tow Truck order cancellation.
 * Ensures strict eligibility checks, double-submit protection, correct error mapping,
 * and GET-based reconciliation on network uncertainty.
 */
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@app/store";
import { usePermissions } from "@shared/auth/usePermissions";
import { ordersApi } from "@modules/orders/api/ordersApi";
import { orderKeys } from "@modules/orders/hooks/useOrdersQueries";
import { adaptTowTruck, type TowTruckOrder } from "../lib/towTruckModel";
import {
  orderCancellationEligibility,
  reconcileOrderCancellation,
  submitOrderCancellation,
  type CancellationDependencies,
  type CancellationState,
} from "../lib/cancellationModel";

export function useTowTruckCancellation(order: TowTruckOrder | null | undefined) {
  const qc = useQueryClient();
  const { can, isSuperAdmin } = usePermissions();
  const user = useAppSelector((s) => s.auth.user);

  const [state, setState] = useState<CancellationState>({ phase: "idle" });

  const authorized = useCallback(
    () =>
      isSuperAdmin ||
      user?.role === "admin" ||
      user?.role === "super_admin" ||
      can("orders.manage"),
    [can, isSuperAdmin, user?.role],
  );

  const eligibility = orderCancellationEligibility(order);

  const getDeps = useCallback(
    (orderId: string): CancellationDependencies => ({
      orderId,
      authorized,
      get: () => state,
      set: (next) => setState(next),
      readOrder: async (id) => {
        await qc.cancelQueries({ queryKey: orderKeys.detail(id), exact: true });
        const raw = await ordersApi.get(id);
        const adapted = adaptTowTruck(raw);
        qc.setQueryData(orderKeys.detail(id), raw);
        return adapted;
      },
      sendCancel: async (id) => ordersApi.cancel(id),
      invalidate: async () => {
        await qc.invalidateQueries({ queryKey: orderKeys.all, refetchType: "none" });
        void qc
          .refetchQueries({ queryKey: orderKeys.detail(orderId), type: "active" })
          .catch(() => undefined);
        void qc
          .refetchQueries({ queryKey: [...orderKeys.all, "list"], type: "active" })
          .catch(() => undefined);
      },
    }),
    [authorized, qc, state],
  );

  const cancel = useCallback(async () => {
    if (!order) return;
    const deps = getDeps(order.id);
    await submitOrderCancellation(deps, order);
  }, [getDeps, order]);

  const reconcile = useCallback(async () => {
    if (!order) return;
    const deps = getDeps(order.id);
    await reconcileOrderCancellation(deps, order.id);
  }, [getDeps, order]);

  const reset = useCallback(() => {
    setState({ phase: "idle" });
  }, []);

  return {
    state,
    busy: state.phase === "busy",
    isConflict: !!state.isConflict,
    isUncertain: !!state.isUncertain,
    isPrivacy404: !!state.isPrivacy404,
    eligibility,
    canCancel: eligibility.eligible && authorized(),
    cancel,
    reconcile,
    reset,
  };
}

export type TowTruckCancellation = ReturnType<typeof useTowTruckCancellation>;
