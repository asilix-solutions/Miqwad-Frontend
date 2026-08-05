/**
 * @file useProfileQueries.ts
 *
 * TanStack Query hooks for the signed-in user's own profile (/api/profile).
 * Role-neutral — reused by admin, dealer, workshop, and scrap account pages.
 * Silent — no toasts here; toasts live in the consuming page.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/profileApi";

export const profileKeys = {
  all: ["admin", "profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
};

export function useAccountProfileQuery() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: () => profileApi.getProfile(),
  });
}

export function useUpdateAccountProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof profileApi.updateProfile>[0]) =>
      profileApi.updateProfile(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}

export function useResetAccountPasswordMutation() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof profileApi.resetPassword>[0]) =>
      profileApi.resetPassword(payload),
  });
}

export function useChangeAccountPhoneRequestMutation() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof profileApi.changePhoneRequest>[0]) =>
      profileApi.changePhoneRequest(payload),
  });
}

export function useChangeAccountPhoneVerifyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof profileApi.changePhoneVerify>[0]) =>
      profileApi.changePhoneVerify(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}
