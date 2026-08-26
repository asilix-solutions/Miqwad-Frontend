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
import { chatHubManager } from "@modules/chat/lib/chatHub";
import { resetChat } from "@modules/chat/store/chatSlice";
import { notificationsHubManager } from "@modules/notifications/api/notificationsHub";
import { clearAll as clearNotifications } from "@modules/notifications/store/notificationsSlice";

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
    // This is the single sanctioned logout entry point (see file JSDoc), so
    // chat cleanup lives here rather than being duplicated at each call site:
    // tear down the live hub connection and clear per-user chat state before
    // the next user signs in on this tab.
    void chatHubManager.disconnect();
    dispatch(resetChat());
    void notificationsHubManager.disconnect();
    dispatch(clearNotifications());
    dispatch(logout());
    queryClient.clear();
    navigate("/login", { replace: true });
  }, [dispatch, navigate, queryClient]);

  return { logout: logoutCallback };
}
