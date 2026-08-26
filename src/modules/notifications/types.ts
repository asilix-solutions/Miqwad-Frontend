/**
 * @file Data layer types for the Notifications module.
 *
 * Defines the core models for notification templates, sent messages,
 * channels, audiences, and status states (admin send-notification feature —
 * see src/modules/admin/{api,hooks}/*.ts, src/modules/admin/components/notifications/).
 *
 * Also holds the LIVE session-notifications shapes (`NotificationItem`,
 * `NotificationsConnectionStatus`) used by the provider-facing notification
 * bell/toast/page — see ../store/notificationsSlice.ts and
 * ../api/notificationsHub.ts. GROUND TRUTH for that side (live-diagnosed, do
 * not assume beyond this): the backend has no persisted notifications
 * feature for providers yet. The only live surface is the SignalR hub event
 * "TestNotification", whose payload is `{ type, title, message, sentAt }` —
 * no id, no isRead, no per-user targeting (global broadcast). There are no
 * list / unread-count / mark-read REST endpoints (404 verified), so
 * `NotificationItem.id` is generated client-side (crypto.randomUUID) and
 * `isRead` is tracked purely in Redux.
 *
 * @module modules/notifications/types
 */

export type NotificationChannel = "in_app" | "push" | "email" | "sms";
export type NotificationAudience = "all" | "customers" | "providers";
export type NotificationStatus = "pending" | "sent" | "failed";

export interface NotificationTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  variables: string[];
  channel: NotificationChannel;
  isActive: boolean;
}

export interface SentNotification {
  id: string;
  templateId?: string | null;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  audience: NotificationAudience;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: string;
  recipientsCount: number;
}

// ── Live session notifications (provider bell/toast/page) ──────────────────

export interface NotificationItem {
  /** Generated client-side (crypto.randomUUID) — the hub payload carries no id. */
  id: string;
  /** Raw event type from the hub payload (e.g. "TestNotification"). */
  type: string;
  title: string;
  message: string;
  /** ISO 8601 — format to relative/local time on display. */
  sentAt: string;
  /** Client-side only for now — there is no backend read-state yet. */
  isRead: boolean;
}

export type NotificationsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";
