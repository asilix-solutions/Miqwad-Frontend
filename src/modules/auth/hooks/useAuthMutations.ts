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
  ForgotPasswordRequest,
  LoginRequest,
  RegisterProviderPayload,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  VerifyEmailOtpRequest,
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

// PROVISIONAL CONTRACT — pending backend OQ1 (BACKEND_API_REQUIREMENTS.md:1049).
// Response shape mirrors verifyOtp so session wiring is reused. Confirm with backend before .NET wiring.
export function useLoginMutation() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (req: LoginRequest) => authApi.login(req),
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

// Provider signup engine. The backend issues NO token on register (the
// account must verify its email first), so this is a session-less,
// fire-and-toast mutation — no Redux dispatch. Login happens separately.
export function useRegisterProviderMutation() {
  return useMutation({
    mutationFn: (req: RegisterProviderPayload) => authApi.registerProvider(req),
  });
}

// Session-less: no Redux dispatch, no credential change — fire-and-toast only.
export function useVerifyEmailOtpMutation() {
  return useMutation({
    mutationFn: (req: VerifyEmailOtpRequest) => authApi.verifyEmailOtp(req),
  });
}

// Session-less: no Redux dispatch, no credential change — fire-and-toast only.
export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (req: ForgotPasswordRequest) => authApi.forgotPassword(req),
  });
}

// Session-less: no Redux dispatch, no credential change — fire-and-toast only.
export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (req: ResetPasswordRequest) => authApi.resetPassword(req),
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
