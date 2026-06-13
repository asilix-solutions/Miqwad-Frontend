/**
 * @file Data types for the Audit module.
 */

export type AuditAction =
  | "create" | "update" | "delete" | "approve" | "reject" | "resolve"
  | "suspend" | "restore" | "send" | "settle" | "cancel" | "login";

export type AuditModule =
  | "users" | "providers" | "settlements" | "disputes" | "services"
  | "packages" | "plans" | "subscriptions" | "notifications" | "ads"
  | "settings" | "auth";

export interface AuditLogEntry {
  id: number;
  actorId: string;
  actorName: string;
  actorRole: string;          // e.g. "super_admin"
  action: AuditAction;
  module: AuditModule;
  entityType?: string;        // e.g. "ProviderProfile"
  entityId?: string;
  summaryAr: string;          // human-readable bilingual summary
  summaryEn: string;
  metadata?: Record<string, unknown>;  // arbitrary change detail (shown in drawer, dir=ltr)
  ipAddress?: string;
  createdAt: string;          // ISO
}

export interface AuditLogQuery {
  page: number;
  pageSize: number;
  module?: AuditModule;
  action?: AuditAction;
  actorId?: string;
  dateFrom?: string;          // ISO date
  dateTo?: string;            // ISO date
  search?: string;
}
