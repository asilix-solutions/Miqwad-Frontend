import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        {!entry ? null : (
          <>
            <DialogHeader>
              <DialogTitle>{t("superAdmin.audit.detail.title")}</DialogTitle>
              <div className="flex items-center gap-3 pt-2">
                <StatusBadge kind="audit" status={entry.action} />
                <span className="text-sm font-medium">{entry.module}</span>
                <span className="text-sm text-[var(--color-muted)] flex-1 text-end" dir="ltr">
                  {formatDate(entry.createdAt, i18n.language)}
                </span>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 py-4 text-start">
              <div>
                <div className="text-xs text-[var(--color-muted)]">{t("superAdmin.audit.detail.actor")}</div>
                <div className="text-sm text-[var(--color-ink-body)]">
                  {entry.actorName}
                  {entry.actorRole ? ` · ${entry.actorRole}` : ""}
                </div>
              </div>

              {(entry.entityType || entry.entityId) && (
                <div>
                  <div className="text-xs text-[var(--color-muted)]">{t("superAdmin.audit.detail.entity")}</div>
                  <div className="text-sm text-[var(--color-ink-body)]" dir="ltr">
                    {entry.entityType} {entry.entityId ? `#${entry.entityId}` : ""}
                  </div>
                </div>
              )}

              {entry.ipAddress && (
                <div>
                  <div className="text-xs text-[var(--color-muted)]">{t("superAdmin.audit.detail.ip")}</div>
                  <div className="text-sm text-[var(--color-ink-body)] font-mono" dir="ltr">
                    {entry.ipAddress}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs text-[var(--color-muted)]">{t("superAdmin.audit.detail.summary")}</div>
                <div className="text-sm text-[var(--color-ink-body)]">
                  {i18n.language === "ar" ? entry.summaryAr : entry.summaryEn}
                </div>
              </div>

              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <div>
                  <div className="text-xs text-[var(--color-muted)]">{t("superAdmin.audit.detail.metadata")}</div>
                  <pre dir="ltr" className="mt-1 text-xs bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-[var(--radius-md)] p-3 overflow-auto max-h-[240px]">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-[var(--color-divider)] pt-4 sm:justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
