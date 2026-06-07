import { useMutation, useQueryClient } from "@tanstack/react-query";
import { providersApi } from "../api/providersApi";
import { providersKeys } from "./useProviderQueries";
import type {
  CreateProviderServiceRequest,
  ProviderDocument,
  RegisterProviderRequest,
  UpdateProviderServiceRequest,
} from "../types";

/**
 * Write-side mutations for the providers module.
 * Each mutation invalidates the matching read query so the UI
 * re-renders with the freshest data automatically.
 */

export function useRegisterProviderMutation() {
  return useMutation({
    mutationFn: (payload: RegisterProviderRequest) => providersApi.register(payload),
  });
}

export function useUploadProviderDocumentsMutation(providerId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documents: ProviderDocument[]) =>
      providersApi.uploadDocuments(providerId, documents),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: providersKeys.profile(providerId) });
    },
  });
}

export function useAddProviderServiceMutation(providerId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProviderServiceRequest) =>
      providersApi.addService(providerId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: providersKeys.services(providerId) });
    },
  });
}

export function useUpdateProviderServiceMutation(providerId: number, serviceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProviderServiceRequest) =>
      providersApi.updateService(providerId, serviceId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: providersKeys.services(providerId) });
    },
  });
}

export function useDeleteProviderServiceMutation(providerId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: number) => providersApi.removeService(providerId, serviceId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: providersKeys.services(providerId) });
    },
  });
}
