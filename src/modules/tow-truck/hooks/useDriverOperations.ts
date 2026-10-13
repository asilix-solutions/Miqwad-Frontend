import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { store, useAppSelector } from "@app/store";
import { adminApi, activateUser, deactivateUser } from "@modules/admin/api/adminApi";
import { adminKeys } from "@modules/admin/hooks/useAdminQueries";
import { ordersApi } from "@modules/orders/api/ordersApi";
import { orderKeys } from "@modules/orders/hooks/useOrdersQueries";
import { adaptTowTruck } from "../lib/towTruckModel";
import {
  driverOperationAuthorized,
  recoverDriverOperation,
  submitDriverOperation,
  operationLocked,
  type DriverAction,
  type DriverOperationState,
  type DriverProposal,
  type OperationDependencies,
} from "../lib/driverOperations";
import {
  driverOperationKey,
  driverOperationMarker,
  readDriverJournal,
  writeDriverJournal,
  removalHistory,
  initialOperationBlocks,
  driverOperationBlocks,
} from "../lib/driverOperationGuards";

export function useDriverOperations(orderId: string) {
  const qc = useQueryClient();
  const actor = useAppSelector((s) => s.auth.user?.id) ?? "";
  const key = driverOperationKey(actor);
  const { data: state } = useQuery<DriverOperationState>({
    queryKey: key,
    enabled: false,
    queryFn: () => qc.getQueryData<DriverOperationState>(key) ?? readDriverJournal(actor),
    initialData: () => readDriverJournal(actor),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const authorized = (kind: DriverAction) =>
    driverOperationAuthorized(actor, store.getState().auth.user, kind);
  const deps: OperationDependencies = {
    get: () => {
      const value = qc.getQueryData<DriverOperationState>(key);
      const journal = readDriverJournal(actor);
      return value && operationLocked(value)
        ? value
        : operationLocked(journal)
          ? journal
          : (value ?? journal);
    },
    set: (value) => qc.setQueryData(key, value),
    authorized,
    conflict: () => initialOperationBlocks(qc, actor),
    readOrder: async (id) => {
      await qc.cancelQueries({ queryKey: orderKeys.detail(id), exact: true });
      const raw = await ordersApi.get(id);
      const order = adaptTowTruck(raw);
      if (!authorized("remove")) throw new Error("Permission changed");
      if (order.id !== id) throw new Error("Mismatched order");
      qc.setQueryData(orderKeys.detail(id), raw);
      return order;
    },
    readDriver: async (id) => {
      await qc.cancelQueries({ queryKey: adminKeys.user(id), exact: true });
      const user = await adminApi.getUser(id, true);
      if (!authorized("activate") && !authorized("deactivate"))
        throw new Error("Permission changed");
      if (user.id !== id) throw new Error("Mismatched account");
      qc.setQueryData(adminKeys.user(id), user);
      return user;
    },
    send: async (operation, note) => {
      if (operation.kind === "remove") await ordersApi.removeTowTruckDriver(operation.orderId);
      else if (operation.kind === "activate") await activateUser(Number(operation.driverId), true);
      else await deactivateUser(Number(operation.driverId), note ?? "", true);
    },
    mark: (operation) => writeDriverJournal(actor, operation),
    clear: () => sessionStorage.removeItem(driverOperationMarker(actor)),
    invalidate: async (operation) => {
      if (!authorized(operation.kind)) return;
      await qc.invalidateQueries({ queryKey: orderKeys.all, refetchType: "none" });
      void qc
        .refetchQueries({ queryKey: [...orderKeys.all, "list"], type: "active" })
        .catch(() => undefined);
      if (operation.kind !== "remove") {
        await qc.invalidateQueries({
          queryKey: adminKeys.user(operation.driverId),
          refetchType: "none",
        });
        await qc.invalidateQueries({ queryKey: [...adminKeys.all, "users"], refetchType: "none" });
        void qc
          .refetchQueries({ queryKey: [...adminKeys.all, "users"], type: "active" })
          .catch(() => undefined);
      }
    },
  };
  const submit = useMutation({
    retry: false,
    mutationFn: async (proposal: DriverProposal) => {
      await submitDriverOperation(deps, proposal);
      return deps.get();
    },
  });
  const recover = useMutation({
    retry: false,
    mutationFn: async () => {
      await recoverDriverOperation(deps);
      return deps.get();
    },
  });
  return {
    state,
    submit: submit.mutateAsync,
    recover: recover.mutateAsync,
    authorized,
    busy: state.phase === "busy",
    locked: driverOperationBlocks(qc, actor),
    initialBlocked: driverOperationBlocks(qc, actor) || removalHistory(actor, orderId),
    removalHistory: removalHistory(actor, orderId),
    initialConflict: () => initialOperationBlocks(qc, actor),
  };
}
export type DriverOperations = ReturnType<typeof useDriverOperations>;
