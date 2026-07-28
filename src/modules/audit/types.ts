/**
 * @file Data types for the Audit module.
 */

// Only "create"/"update"/"delete" are backed by the real API (mapped from
// its EF-style "Added"/"Modified"/"Deleted" action strings in
// audit.adapter.ts). The rest are legacy mock-only values kept off the
// type until the backend exposes richer, business-level audit actions.
export type AuditAction = "create" | "update" | "delete";

export interface AuditLogEntry {
  id: number;
  actorId: string;
  actorName: string;
  actorRole: string;          // e.g. "super_admin" — empty when unknown (see audit.adapter.ts)
  action: AuditAction;
  // Real backend has no fixed module taxonomy — this is the raw entity
  // name reported by GET /api/auditlogs (e.g. "user"), not a curated enum.
  module: string;
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
  module?: string;
  action?: AuditAction;
  actorId?: string;
  dateFrom?: string;          // ISO date
  dateTo?: string;            // ISO date
  search?: string;
}
