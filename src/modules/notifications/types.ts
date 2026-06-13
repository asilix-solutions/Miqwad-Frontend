/**
 * @file Data layer types for the Notifications module.
 *
 * Defines the core models for notification templates, sent messages,
 * channels, audiences, and status states.
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
