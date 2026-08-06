/**
 * @file useServicesAdminQueries.ts
 * @description TanStack Query hooks for the Service entity (mock-flagged
 * self-join tree, `serviceApi.ts`) and the real category↔service
 * assignment endpoints (`categoryServicesApi.ts`). No UI here — toasts are
 * wired via the shared toast context so consuming screens don't each have
 * to repeat success/error messaging.
 */
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useToast } from "@shared/components/ui/toastContext";
import { serviceApi, type ServiceWriteInput, type ServicesQuery } from "../api/serviceApi";
import { categoryServicesApi } from "../api/categoryServicesApi";
import { buildServiceTree } from "../lib/serviceAdapter";
import type { Service } from "../service.types";

// ── Query keys ───────────────────────────────────────────────────────────────

export const serviceEntityKeys = {
  all: ["services", "tree"] as const,
};

export const categoryServicesKeys = {
  forCategory: (categoryId: number) => ["categories", categoryId, "services"] as const,
};

// ── Service entity (mock-flagged) ───────────────────────────────────────────

export function useServicesTreeQuery(params?: ServicesQuery) {
  return useQuery({
    queryKey: [...serviceEntityKeys.all, params] as const,
    queryFn: async (): Promise<Service[]> => buildServiceTree((await serviceApi.list(params)).items),
  });
}

export function useCreateServiceMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ServiceWriteInput) => serviceApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: serviceEntityKeys.all });
      toast.success(t("common.saved"));
    },
    onError: () => {
      toast.error(t("common.saveFailed"));
    },
  });
}

export function useUpdateServiceMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<ServiceWriteInput> }) => serviceApi.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: serviceEntityKeys.all });
      toast.success(t("common.saved"));
    },
    onError: () => {
      toast.error(t("common.saveFailed"));
    },
  });
}

export function useDeleteServiceMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: number) => serviceApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: serviceEntityKeys.all });
      toast.success(t("common.deleted"));
    },
    onError: () => {
      toast.error(t("common.deleteFailed"));
    },
  });
}

// ── Category ↔ Service assignment (real backend) ────────────────────────────

export function useCategoryServicesQuery(categoryId: number | null) {
  return useQuery({
    queryKey: categoryId != null ? categoryServicesKeys.forCategory(categoryId) : ["categories", "noop", "services"],
    queryFn: () => categoryServicesApi.listForCategory(categoryId!),
    enabled: categoryId != null,
  });
}

export function useAssignServiceMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ categoryId, serviceId }: { categoryId: number; serviceId: number }) =>
      categoryServicesApi.assign(categoryId, serviceId),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: categoryServicesKeys.forCategory(variables.categoryId) });
      void qc.invalidateQueries({ queryKey: serviceEntityKeys.all });
      toast.success(t("common.saved"));
    },
    onError: () => {
      toast.error(t("common.saveFailed"));
    },
  });
}

/**
 * Assigned-service count per category, for a flat category list's row
 * badges. Fires one `listForCategory` request per id (there is no bulk
 * count endpoint) — fine for the small L1-only category lists this backs.
 */
export function useCategoryServiceCounts(categoryIds: number[]) {
  const results = useQueries({
    queries: categoryIds.map((id) => ({
      queryKey: categoryServicesKeys.forCategory(id),
      queryFn: () => categoryServicesApi.listForCategory(id),
    })),
  });

  const counts: Record<number, number | undefined> = {};
  categoryIds.forEach((id, index) => {
    counts[id] = results[index]?.data?.length;
  });
  return counts;
}

export function useUnassignServiceMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ categoryId, serviceId }: { categoryId: number; serviceId: number }) =>
      categoryServicesApi.unassign(categoryId, serviceId),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: categoryServicesKeys.forCategory(variables.categoryId) });
      void qc.invalidateQueries({ queryKey: serviceEntityKeys.all });
      toast.success(t("common.deleted"));
    },
    onError: () => {
      toast.error(t("common.deleteFailed"));
    },
  });
}
