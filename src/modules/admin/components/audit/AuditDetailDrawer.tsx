/**
 * @file AuditDetailDrawer.tsx
 * @description Drawer side-panel to view full details of a single audit log entry.
 */

import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "../shared/StatusBadge";
import { formatDate } from "@shared/lib/formatDate";
import type { AuditLogEntry } from "@modules/audit/types";

export interface AuditDetailDrawerProps {
  entry: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditDetailDrawer({ entry, open, onOpenChange }: AuditDetailDrawerProps) {
  const { t, i18n } = useTranslation();

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 
        We use DialogContent directly with custom classes to behave like a side panel.
        sm:max-w-md, slide from the start/end depending on dir.
      */}
      <DialogContent 
        className="fixed inset-y-0 start-auto end-0 z-50 h-full w-full max-w-md gap-4 border-l bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-right-1/2 rtl:data-[state=closed]:slide-out-to-left-1/2 rtl:data-[state=open]:slide-in-from-left-1/2 flex flex-col overflow-y-auto sm:rounded-none"
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-bold">
            {t("superAdmin.audit.columns.details")}
          </DialogTitle>
          {/* Default Dialog has its own close button, but if we need a custom one we can add it, 
              here we rely on Dialog's default close button or provide one if overridden. */}
        </DialogHeader>

        <div className="flex flex-col space-y-6 flex-1">
          {/* Header section */}
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-divider)]">
            <StatusBadge kind="audit" status={entry.action} />
            <span className="text-sm font-medium">
              {t(`superAdmin.audit.modules.${entry.module}`)}
            </span>
            <span className="text-sm text-[var(--color-muted)] flex-1 text-end" dir="ltr">
              {formatDate(entry.createdAt, i18n.language)}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-[var(--color-muted)] mb-1">{t("superAdmin.audit.detail.actor")}</div>
              <div className="font-medium">{entry.actorName}</div>
              <div className="text-xs text-[var(--color-muted)]">{entry.actorRole}</div>
            </div>

            {(entry.entityType || entry.entityId) && (
              <div dir="ltr" className="text-start">
                <div className="text-[var(--color-muted)] mb-1 text-end" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
                  {t("superAdmin.audit.detail.entity")}
                </div>
                <div className="font-medium bg-[var(--color-surface-2)] inline-block px-2 py-1 rounded">
                  {entry.entityType} {entry.entityId ? `#${entry.entityId}` : ""}
                </div>
              </div>
            )}

            {entry.ipAddress && (
              <div dir="ltr" className="text-start">
                <div className="text-[var(--color-muted)] mb-1 text-end" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
                  {t("superAdmin.audit.detail.ip")}
                </div>
                <div className="font-mono text-sm">{entry.ipAddress}</div>
              </div>
            )}

            <div>
              <div className="text-[var(--color-muted)] mb-1">{t("superAdmin.audit.detail.summary")}</div>
              <div className="font-medium bg-[var(--color-surface-2)] p-3 rounded-[var(--radius-md)]">
                {i18n.language === "ar" ? entry.summaryAr : entry.summaryEn}
              </div>
            </div>

            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
              <div>
                <div className="text-[var(--color-muted)] mb-1">{t("superAdmin.audit.detail.metadata")}</div>
                <pre dir="ltr" className="text-xs bg-[var(--color-surface-2)] rounded-[var(--radius-md)] p-3 overflow-auto text-start">
                  {JSON.stringify(entry.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Action / Close */}
        <div className="pt-4 mt-auto border-t border-[var(--color-divider)] flex justify-end">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium border border-[var(--color-divider)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)]"
            onClick={() => onOpenChange(false)}
          >
            {t("common.close")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
