import { useEffect } from "react";
import { z } from "zod";
import { initialAssignmentBlock } from "../lib/dispatchModel";
import { readRemovalEvidence, removalHistoryKey } from "../lib/reassignment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { store, useAppSelector } from "@app/store";
import { getRolePermissions, hasPermission } from "@shared/auth/permissions";
import { ordersApi } from "@modules/orders/api/ordersApi";
import { orderKeys } from "@modules/orders/hooks/useOrdersQueries";
import { adminApi } from "@modules/admin/api/adminApi";
import { adminKeys } from "@modules/admin/hooks/useAdminQueries";
import { cancellationBlocks } from "../lib/cancellationJournal";
import { driverOperationBlocks, initialOperationBlocks } from "../lib/driverOperationGuards";
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
      const raw = sessionStorage.getItem(marker);
      if (!raw) return { phase: "idle" };
      const id = z
        .string()
        .regex(/^[1-9]\d*$/)
        .refine((v) => Number.isSafeInteger(Number(v)));
      const parsed = z
        .object({
          orderId: z.literal(orderId),
          driverId: id,
          service: z.string(),
          replacement: z
            .object({
              orderId: z.literal(orderId),
              driverId: id,
              finance: z.string(),
              service: z.string(),
            })
            .optional(),
          receipt: z
            .union([
              z.object({ towTruckDriverId: z.number().int().positive().safe() }).strict(),
              z
                .object({
                  towTruckDriverId: z.number().int().positive().safe(),
                  cost: z.number().positive(),
                  duration: z.string().trim().min(1).max(100),
                })
                .strict(),
            ])
            .optional(),
        })
        .safeParse(JSON.parse(raw));
      if (
        !parsed.success ||
        (parsed.data.receipt &&
          String(parsed.data.receipt.towTruckDriverId) !== parsed.data.driverId)
      )
        return { phase: "uncertain", message: "r2UncertainFinality" };
      return {
        phase: parsed.data.receipt ? "accepted" : "uncertain",
        operation: parsed.data,
        receipt: parsed.data.receipt,
        message: "r2UncertainFinality",
      };
    } catch {
      return { phase: "uncertain", message: "assignmentStorage" };
    }
  };
  // Existing actor/order journal: minimal identity and material comparison fields only.
  const state = useQuery<AssignmentState>({
    queryKey: key,
    enabled: false,
    queryFn: () => qc.getQueryData<AssignmentState>(key) ?? readMarker(),
    initialData: readMarker,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  }).data;
  const evidence = readRemovalEvidence(userId ?? "", orderId);
  // A separately acknowledged later removal starts another review cycle.
  // Attempt-only/legacy markers can never reset a completed assignment.
  const mayReviewAgain =
    state.phase === "success" &&
    evidence !== null &&
    evidence !== "unverified" &&
    state.operation?.driverId === evidence.driverId;
  useEffect(() => {
    if (mayReviewAgain)
      qc.setQueryData(["tow-truck-assignment-outcome", userId, orderId], { phase: "idle" });
  }, [mayReviewAgain, qc, userId, orderId]);
  const readAuthorized = () => {
    const user = store.getState().auth.user;
    const permissions = user?.permissions?.length
      ? user.permissions
      : getRolePermissions(user?.role);
    return (
      !!userId &&
      user?.id === userId &&
      hasPermission(permissions, "orders.manage") &&
      hasPermission(permissions, "orders.view")
    );
  };
  const dependencies: AssignmentDependencies = {
    orderId,
    get: () => {
      const cached = qc.getQueryData<AssignmentState>(key);
      const journal = readMarker();
      return cached && ["busy", "uncertain", "accepted"].includes(cached.phase)
        ? cached
        : ["uncertain", "accepted"].includes(journal.phase)
          ? journal
          : (cached ?? journal);
    },
    set: (value) => qc.setQueryData(key, value),
    readAuthorized,
    evidence: () => readRemovalEvidence(userId ?? "", orderId),
    authorized: () =>
      readAuthorized() &&
      !driverOperationBlocks(qc, userId ?? "") &&
      !initialOperationBlocks(qc, userId ?? "", orderId) &&
      !cancellationBlocks(qc, userId ?? "", orderId),
    readDriver: async (id) => {
      await qc.cancelQueries({ queryKey: adminKeys.user(id), exact: true });
      const driver = await adminApi.getUser(id, true);
      if (!readAuthorized()) throw new Error("Permission changed");
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
      if (!readAuthorized()) throw new Error("Permission changed");
      if (order.id !== orderId) throw new Error("Mismatched order");
      qc.setQueryData(orderKeys.detail(orderId), raw);
      return order;
    },
    send: (payload) => ordersApi.assignTowTruckDriver(orderId, payload),
    mark: (operation) => sessionStorage.setItem(marker, JSON.stringify(operation)),
    completedReplacement: () =>
      sessionStorage.setItem(removalHistoryKey(userId ?? "", orderId), "review-required"),
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
  return {
    state,
    submit: submit.mutateAsync,
    check: check.mutateAsync,
    block: (order: ReturnType<typeof adaptTowTruck>) =>
      !readAuthorized()
        ? "assignmentForbidden"
        : !dependencies.authorized()
          ? "opsMutationConflict"
          : initialAssignmentBlock(order, readRemovalEvidence(userId ?? "", order.id)),
    evidence,
  };
}
