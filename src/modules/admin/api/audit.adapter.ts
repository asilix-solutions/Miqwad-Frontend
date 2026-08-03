/**
 * @file audit.adapter.ts
 * @description Adapts the real `GET /api/auditlogs` contract onto the
 * frontend's `AuditLogEntry` / `PaginatedResponse<AuditLogEntry>` shape.
 *
 * Confirmed live response envelope: `{ success, message, data: { items,
 * pageNumber, pageSize, totalCount, totalPages }, errors }`. Item fields:
 * `id, entityName, action, entityId, oldValues, newValues, userId,
 * ipAddress, createdAt` — no actor name/role, no business-level module
 * taxonomy, and no per-field filters beyond a single generic
 * `FilterBy`/`FilterValue` pair (see adminApi.getAuditLogs). module/action/
 * date-range/search are therefore applied client-side, to the current
 * page only, in `adaptAuditLogsResponse` below.
 */
import type { AuditLogEntry, AuditLogQuery } from "@modules/audit/types";
import type { PaginatedResponse } from "@shared/types/api";

export interface RawAuditLogItem {
  id: number;
  entityName: string;
  action: string;
  entityId: string;
  oldValues: string | null;
  newValues: string | null;
  userId: number;
  ipAddress: string;
  createdAt: string;
}

export interface RawAuditLogPage {
  items: RawAuditLogItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * FRAGILE: only "Added" has been observed live. "Modified"/"Deleted" are
 * inferred from EF Core's `EntityState` naming convention (the usual
 * source for a generic audit interceptor) but unconfirmed. Anything
 * unrecognized falls back to "update" rather than a raw value, so the
 * StatusBadge/i18n lookup in AdminAuditLogPage never renders an
 * untranslated key.
 */
const ACTION_MAP: Record<string, AuditLogEntry["action"]> = {
  Added: "create",
  Modified: "update",
  Updated: "update",
  Deleted: "delete",
  Removed: "delete",
};

const ACTION_LABEL_AR: Record<string, string> = {
  Added: "أضاف",
  Modified: "عدّل",
  Updated: "عدّل",
  Deleted: "حذف",
  Removed: "حذف",
};

function parseJsonSafe(raw: string | null): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : { value: parsed };
  } catch {
    return { raw };
  }
}

function adaptAuditLogItem(raw: RawAuditLogItem): AuditLogEntry {
  const metadata: Record<string, unknown> = {};
  const oldValues = parseJsonSafe(raw.oldValues);
  const newValues = parseJsonSafe(raw.newValues);
  if (oldValues) metadata.oldValues = oldValues;
  if (newValues) metadata.newValues = newValues;

  const actionAr = ACTION_LABEL_AR[raw.action] ?? raw.action;

  return {
    id: raw.id,
    actorId: String(raw.userId),
    // Backend gap: the audit log only returns a numeric userId, no actor
    // name/role. TODO: resolve via GET /api/Users/{id} (batched) once that
    // lookup is cheap enough, or once the backend enriches this itself.
    actorName: `#${raw.userId}`,
    actorRole: "",
    action: ACTION_MAP[raw.action] ?? "update",
    module: raw.entityName.toLowerCase(),
    entityType: raw.entityName,
    entityId: raw.entityId,
    summaryAr: `${actionAr} ${raw.entityName} #${raw.entityId}`,
    summaryEn: `${raw.action} ${raw.entityName} #${raw.entityId}`,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    ipAddress: raw.ipAddress || undefined,
    createdAt: raw.createdAt,
  };
}

/**
 * Adapts the real backend page and applies the query's module/action/
 * date-range/search filters client-side.
 *
 * TEMPORARY: `GET /api/auditlogs` only exposes PageNumber, PageSize,
 * SortBy, SortDescending, and a single generic FilterBy/FilterValue pair
 * — no per-field module/action filters, no date range, no full-text
 * search. Wiring those server-side would mean guessing undocumented
 * FilterBy field names (risking silently-wrong results). Until the
 * backend exposes real filter params, they're applied here to the
 * current page only — `total`/`totalPages` still reflect the *unfiltered*
 * server page, so a filtered view can show fewer rows than the pager
 * implies.
 *
 * TODO(audit): filter model is per-page/client-side — refine to
 *   server-side when backend supports audit filters. Carried from main
 *   (545fbf1) as-is; may need adaptation to current patterns.
 */
export function adaptAuditLogsResponse(raw: RawAuditLogPage, query: AuditLogQuery): PaginatedResponse<AuditLogEntry> {
  let items = raw.items.map(adaptAuditLogItem);

  if (query.module) items = items.filter((i) => i.module === query.module);
  if (query.action) items = items.filter((i) => i.action === query.action);
  if (query.dateFrom) items = items.filter((i) => new Date(i.createdAt) >= new Date(query.dateFrom!));
  if (query.dateTo) items = items.filter((i) => new Date(i.createdAt) <= new Date(query.dateTo!));
  if (query.search) {
    const q = query.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.summaryAr.toLowerCase().includes(q) ||
        i.summaryEn.toLowerCase().includes(q) ||
        i.actorName.toLowerCase().includes(q),
    );
  }

  return {
    items,
    page: raw.pageNumber,
    pageSize: raw.pageSize,
    total: raw.totalCount,
    totalPages: raw.totalPages,
  };
}
