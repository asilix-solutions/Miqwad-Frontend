/**
 * @file useLogout.ts
 *
 * The ONLY sanctioned logout entry point. Every "sign out" button in the
 * app must call this hook's `logout` callback instead of hand-rolling the
 * dispatch/navigate sequence — the inline version used across topbars
 * cleared Redux auth state but left the previous user's server data
 * cached in TanStack Query, leaking it into the next session on a shared
 * browser tab (soft navigation, no reload).
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@app/store";
import { logout } from "@modules/auth/store/authSlice";
import { authApi } from "@modules/auth/api/authApi";

export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutCallback = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort: clear locally even if the server call fails.
    }
    dispatch(logout());
    queryClient.clear();
    navigate("/login", { replace: true });
  }, [dispatch, navigate, queryClient]);

  return { logout: logoutCallback };
}
