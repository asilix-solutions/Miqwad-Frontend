/**
 * @file useProfileQueries.ts
 *
 * TanStack Query hooks for the admin's own profile (/api/profile).
 * Silent — no toasts here; toasts live in AdminProfilePage.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/profileApi";

export const profileKeys = {
  all: ["admin", "profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
};

export function useAdminProfileQuery() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: () => profileApi.getProfile(),
  });
}

export function useUpdateAdminProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof profileApi.updateProfile>[0]) =>
      profileApi.updateProfile(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}

export function useResetAdminPasswordMutation() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof profileApi.resetPassword>[0]) =>
      profileApi.resetPassword(payload),
  });
}

export function useChangeAdminPhoneRequestMutation() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof profileApi.changePhoneRequest>[0]) =>
      profileApi.changePhoneRequest(payload),
  });
}

export function useChangeAdminPhoneVerifyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof profileApi.changePhoneVerify>[0]) =>
      profileApi.changePhoneVerify(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}
