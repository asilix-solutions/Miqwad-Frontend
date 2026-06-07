import { useMutation } from "@tanstack/react-query";
import { useAppDispatch } from "@app/store";
import { authApi } from "../api/authApi";
import {
  clearPendingVerification,
  setCredentials,
  setPendingVerification,
  setUser,
} from "../store/authSlice";
import type {
  RegisterRequest,
  UpdateProfileRequest,
  VerifyOtpRequest,
} from "../types";

/**
 * Hooks that bridge React Query mutations with the Redux auth slice.
 * Components stay thin and stateless; all side-effects live here.
 */

export function useRegisterMutation() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (req: RegisterRequest) => authApi.register(req),
    onSuccess: (res, vars) => {
      dispatch(
        setPendingVerification({
          verificationId: res.verificationId,
          phoneNumber: vars.phoneNumber,
          resendAfter: res.resendAfter,
        }),
      );
    },
  });
}

export function useVerifyOtpMutation() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (req: VerifyOtpRequest) => authApi.verifyOtp(req),
    onSuccess: (res) => {
      dispatch(
        setCredentials({
          user: res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        }),
      );
      dispatch(clearPendingVerification());
    },
  });
}

export function useUpdateProfileMutation() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (req: UpdateProfileRequest) => authApi.updateProfile(req),
    onSuccess: (user) => {
      dispatch(setUser(user));
    },
  });
}
