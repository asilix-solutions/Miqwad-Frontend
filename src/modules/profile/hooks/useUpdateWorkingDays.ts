/**
 * @file useUpdateWorkingDays.ts
 *
 * TanStack Query mutation for `PUT /api/profile/working-days`. Role-agnostic
 * (WorkshopOwner today, scrap once its role is allowed backend-side) —
 * silent, no toasts, invalidates the shared profile query on success.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/profileApi";
import { profileKeys } from "./useProfileQueries";

export function useUpdateWorkingDaysMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof profileApi.updateWorkingDays>[0]) =>
      profileApi.updateWorkingDays(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}
