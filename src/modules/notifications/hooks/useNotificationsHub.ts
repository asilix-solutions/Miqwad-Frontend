/**
 * React bridge between the SignalR notifications hub transport and Redux
 * notifications state. Mirrors ../../chat/hooks/useChatHub.ts. Owns the
 * connection lifecycle for as long as the consuming component (the scrap
 * shell — see ScrapLayout.tsx) is mounted. `status` is informational only:
 * it never gates sending or receiving anything (lesson learned from the
 * chat composer — see fix/chat-composer-allow-send-offline).
 */
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@app/store";
import { notificationsHubManager, type TestNotificationPayload } from "../api/notificationsHub";
import { notificationReceived, selectNotificationStatus, setStatus } from "../store/notificationsSlice";
import type { NotificationItem, NotificationsConnectionStatus } from "../types";

interface UseNotificationsHubResult {
  status: NotificationsConnectionStatus;
}

function toNotificationItem(payload: TestNotificationPayload): NotificationItem {
  return {
    id: crypto.randomUUID(),
    type: payload.type,
    title: payload.title,
    message: payload.message,
    sentAt: payload.sentAt,
    isRead: false,
  };
}

// Module-level counter (not component-scoped) — see chat's useChatHub.ts for
// the full rationale: prevents a late resolution from an earlier mount
// (StrictMode double-mount, fast remount) from overwriting a later mount's
// dispatch.
let connectGeneration = 0;

export function useNotificationsHub(): UseNotificationsHubResult {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectNotificationStatus);

  useEffect(() => {
    const generation = ++connectGeneration;

    const unsubscribeNotification = notificationsHubManager.onNotification((payload) => {
      dispatch(notificationReceived(toNotificationItem(payload)));
    });
    const unsubscribeReconnecting = notificationsHubManager.onReconnecting(() =>
      dispatch(setStatus("reconnecting")),
    );
    const unsubscribeReconnected = notificationsHubManager.onReconnected(() =>
      dispatch(setStatus("connected")),
    );
    const unsubscribeClosed = notificationsHubManager.onClosed(() =>
      dispatch(setStatus("disconnected")),
    );

    dispatch(setStatus("connecting"));
    notificationsHubManager
      .connect()
      .then(() => {
        if (generation === connectGeneration && notificationsHubManager.isConnected()) {
          dispatch(setStatus("connected"));
        }
      })
      .catch(() => {
        if (generation === connectGeneration) dispatch(setStatus("disconnected"));
      });

    // Deliberately do NOT disconnect the hub here — it is an app-level
    // singleton torn down only on logout (see useLogout.ts). Only unsubscribe
    // this effect's own listeners so a remount doesn't stack duplicates.
    return () => {
      unsubscribeNotification();
      unsubscribeReconnecting();
      unsubscribeReconnected();
      unsubscribeClosed();
    };
  }, [dispatch]);

  return { status };
}
