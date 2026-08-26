/**
 * @file notificationsSlice.ts
 *
 * Session-only notifications store. Holds every notification received over
 * the live hub for the current tab session, plus the derived unread count.
 *
 * // TODO: wire to backend — replace this session store with REST
 * // (GET /api/notifications, GET /api/notifications/unread-count,
 * // PUT /api/notifications/{id}/read, PUT /api/notifications/read-all)
 * // once the backend ships a persisted notifications feature. At that
 * // point `notificationReceived` should become a cache-invalidation signal
 * // (or an optimistic prepend) rather than the sole source of truth.
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { storage, StorageKeys } from "@shared/lib/storage";
import type { NotificationItem, NotificationsConnectionStatus } from "../types";

interface NotificationsState {
  status: NotificationsConnectionStatus;
  items: NotificationItem[];
  unreadCount: number;
  /** Sound mute preference — persisted via @shared/lib/storage, see `setMuted`. */
  muted: boolean;
}

const initialState: NotificationsState = {
  status: "idle",
  items: [],
  unreadCount: 0,
  muted: storage.get<boolean>(StorageKeys.notificationsMuted) ?? false,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<NotificationsConnectionStatus>) {
      state.status = action.payload;
    },
    /** Prepends a newly received notification and increments the unread count. */
    notificationReceived(state, action: PayloadAction<NotificationItem>) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead(state) {
      state.items.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    clearAll(state) {
      state.items = [];
      state.unreadCount = 0;
    },
    /** Also persists to storage so the preference survives a reload — see @shared/lib/storage. */
    setMuted(state, action: PayloadAction<boolean>) {
      state.muted = action.payload;
      storage.set(StorageKeys.notificationsMuted, action.payload);
    },
  },
});

export const { setStatus, notificationReceived, markRead, markAllRead, clearAll, setMuted } =
  notificationsSlice.actions;

/** Slice of RootState holding this reducer, kept local to avoid importing @app/store here. */
interface NotificationsRootState {
  notifications: NotificationsState;
}

const selectNotificationsSlice = (state: NotificationsRootState): NotificationsState =>
  state.notifications;

export const selectNotificationStatus = (
  state: NotificationsRootState,
): NotificationsConnectionStatus => selectNotificationsSlice(state).status;

export const selectNotificationItems = (state: NotificationsRootState): NotificationItem[] =>
  selectNotificationsSlice(state).items;

export const selectUnreadCount = (state: NotificationsRootState): number =>
  selectNotificationsSlice(state).unreadCount;

export const selectMuted = (state: NotificationsRootState): boolean =>
  selectNotificationsSlice(state).muted;

export default notificationsSlice.reducer;
