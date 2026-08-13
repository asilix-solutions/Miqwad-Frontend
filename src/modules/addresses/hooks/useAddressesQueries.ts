/**
 * @file useAddressesQueries.ts
 * @description TanStack Query hooks for the admin Addresses module. Hooks
 * are silent — toasts are shown by the calling UI, not here. Mutations
 * invalidate the address list/detail/by-user query keys.
 */
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { addressesApi, type AddressesListParams } from "../api/addressesApi";
import { adaptRawAddress, adaptToWritePayload } from "../lib/addressAdapter";
import type { WriteAddressInput } from "../types";

export const addressKeys = {
  all: ["addresses"] as const,
  list: (params: AddressesListParams = {}) => [...addressKeys.all, "list", params] as const,
  detail: (id: string) => [...addressKeys.all, "detail", id] as const,
  byUser: (userId: string) => [...addressKeys.all, "byUser", userId] as const,
};

export function useAddressesList(params: AddressesListParams = {}) {
  return useQuery({
    queryKey: addressKeys.list(params),
    queryFn: async () => {
      const page = await addressesApi.list(params);
      return { ...page, items: page.items.map(adaptRawAddress) };
    },
    placeholderData: keepPreviousData,
  });
}

export function useAddress(id: string) {
  return useQuery({
    queryKey: addressKeys.detail(id),
    queryFn: async () => adaptRawAddress(await addressesApi.get(id)),
    enabled: !!id,
  });
}

export function useUserAddresses(userId: string) {
  return useQuery({
    queryKey: addressKeys.byUser(userId),
    queryFn: async () => {
      const page = await addressesApi.getUserAddresses(userId);
      return { ...page, items: page.items.map(adaptRawAddress) };
    },
    enabled: !!userId,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WriteAddressInput) => addressesApi.create(adaptToWritePayload(input)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WriteAddressInput }) =>
      addressesApi.update(id, adaptToWritePayload(input)),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: addressKeys.all });
      void qc.invalidateQueries({ queryKey: addressKeys.detail(variables.id) });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}
