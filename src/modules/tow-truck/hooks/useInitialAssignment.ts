import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { store, useAppSelector } from "@app/store";
import { getRolePermissions, hasPermission } from "@shared/auth/permissions";
import { ordersApi } from "@modules/orders/api/ordersApi";
import { orderKeys } from "@modules/orders/hooks/useOrdersQueries";
import { adminApi } from "@modules/admin/api/adminApi";
import { adminKeys } from "@modules/admin/hooks/useAdminQueries";
import { adaptTowTruck } from "../lib/towTruckModel";
import {
  checkAssignmentOutcome,
  submitInitialAssignment,
  type AssignmentDependencies,
  type AssignmentRequest,
  type AssignmentState,
} from "../lib/initialAssignment";

export function useInitialAssignment(orderId: string) {
  const qc = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const key = ["tow-truck-assignment-outcome", userId, orderId] as const;
  const marker = `miqwad:initial-assignment:${userId}:${orderId}`;
  const readMarker = (): AssignmentState => {
    try {
      return sessionStorage.getItem(marker)
        ? { phase: "uncertain", message: "assignmentUncertain" }
        : { phase: "idle" };
    } catch {
      return { phase: "uncertain", message: "assignmentStorage" };
    }
  };
  // Local operation journal, separate from raw server Orders. No driver/contact,
  // financial or credential values are persisted: only a pending-result marker.
  const state = useQuery<AssignmentState>({
    queryKey: key,
    enabled: false,
    queryFn: () => qc.getQueryData<AssignmentState>(key) ?? readMarker(),
    initialData: readMarker,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  }).data;
  const dependencies: AssignmentDependencies = {
    orderId,
    get: () => qc.getQueryData<AssignmentState>(key) ?? readMarker(),
    set: (value) => qc.setQueryData(key, value),
    authorized: () => {
      const user = store.getState().auth.user;
      const permissions = user?.permissions?.length
        ? user.permissions
        : getRolePermissions(user?.role);
      return (
        !!userId &&
        user?.id === userId &&
        hasPermission(permissions, "orders.manage") &&
        hasPermission(permissions, "users.view")
      );
    },
    readDriver: async (id) => {
      const driver = await adminApi.getUser(id);
      if (driver.id !== id) throw new Error("Mismatched driver");
      qc.setQueryData(adminKeys.user(id), driver);
      return driver;
    },
    readOrder: async () => {
      // Cancel older in-flight reads before the fresh read so stale data cannot
      // arrive later and overwrite the authoritative post-write detail.
      await qc.cancelQueries({ queryKey: orderKeys.detail(orderId), exact: true });
      const raw = await ordersApi.get(orderId);
      const order = adaptTowTruck(raw);
      if (order.id !== orderId) throw new Error("Mismatched order");
      qc.setQueryData(orderKeys.detail(orderId), raw);
      return order;
    },
    send: (payload) => ordersApi.assignTowTruckDriver(orderId, payload),
    mark: () => sessionStorage.setItem(marker, "pending"),
    clear: () => sessionStorage.removeItem(marker),
    invalidate: async () => {
      await qc.invalidateQueries({ queryKey: orderKeys.all, refetchType: "none" });
      void qc
        .refetchQueries({ queryKey: [...orderKeys.all, "list"], type: "active" })
        .catch(() => undefined);
    },
  };
  const submit = useMutation({
    mutationKey: ["tow-truck-initial-assignment", userId, orderId],
    retry: false,
    mutationFn: async (request: AssignmentRequest) => {
      await submitInitialAssignment(dependencies, request);
      return dependencies.get();
    },
  });
  const check = useMutation({
    retry: false,
    mutationFn: async () => {
      await checkAssignmentOutcome(dependencies);
      return dependencies.get();
    },
  });
  return { state, submit: submit.mutateAsync, check: check.mutateAsync };
}
