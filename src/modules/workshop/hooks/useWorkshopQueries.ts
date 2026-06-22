/**
 * @file useWorkshopQueries.ts
 *
 * TanStack Query hooks for the workshop provider area.
 * Follows the same silent-query / toast-in-UI convention as dealer hooks.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workshopApi } from "../api/workshopApi";

export const workshopKeys = {
  all: ["workshop"] as const,
  profile: () => [...workshopKeys.all, "profile"] as const,
  subscription: () => [...workshopKeys.all, "subscription"] as const,
};

export function useWorkshopProfileQuery() {
  return useQuery({
    queryKey: workshopKeys.profile(),
    queryFn: () => workshopApi.getProfile(),
  });
}

export function useUpdateWorkshopProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof workshopApi.updateProfile>[0]) =>
      workshopApi.updateProfile(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: workshopKeys.profile() });
    },
  });
}

export function useWorkshopSubscriptionQuery() {
  return useQuery({
    queryKey: workshopKeys.subscription(),
    queryFn: () => workshopApi.getSubscription(),
  });
}

export function useRenewSubscriptionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => workshopApi.renewSubscription(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: workshopKeys.subscription() });
    },
  });
}
