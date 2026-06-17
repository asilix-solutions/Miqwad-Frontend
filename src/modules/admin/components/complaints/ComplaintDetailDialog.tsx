/**
 * @file ComplaintDetailDialog.tsx
 * @description Dialog to view and update a complaint.
 */

import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "../shared/StatusBadge";
import { formatDate } from "@shared/lib/formatDate";
import type { Complaint, ComplaintStatus } from "@modules/complaints/types";
import { useUpdateComplaintStatusMutation } from "../../hooks/useAdminQueries";
import { useToast } from "@shared/components/ui/toastContext";
import { Can } from "@shared/auth/Can";

export interface ComplaintDetailDialogProps {
  complaint: Complaint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComplaintDetailDialog({ complaint, open, onOpenChange }: ComplaintDetailDialogProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const updateStatusMutation = useUpdateComplaintStatusMutation();

  if (!complaint) return null;

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(
      { id: complaint.id, status: newStatus as ComplaintStatus },
      {
        onSuccess: () => {
          toast.success(t("superAdmin.complaints.toast.updated"));
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t("superAdmin.complaints.toast.error"));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("superAdmin.complaints.detail.title")}</DialogTitle>
          <div className="flex items-center gap-3 pt-2">
            <StatusBadge kind="complaint" status={complaint.status} />
            <span className="text-sm font-medium">
              {complaint.customerName}
            </span>
            <span className="text-sm text-[var(--color-muted)] flex-1 text-end" dir="ltr">
              {formatDate(complaint.createdAt, i18n.language)}
            </span>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-4 text-start">
          <div>
            <div className="text-xs text-[var(--color-muted)]">{t("superAdmin.complaints.columns.title")}</div>
            <div className="text-sm text-[var(--color-ink-body)] font-semibold mt-1">
              {complaint.title}
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--color-muted)]">{t("superAdmin.complaints.detail.body")}</div>
            <div className="text-sm text-[var(--color-ink-body)] mt-1 whitespace-pre-wrap bg-[var(--color-surface-2)] p-3 rounded-[var(--radius-md)] border border-[var(--color-divider)]">
              {complaint.body}
            </div>
          </div>
          
          <Can permission="complaints.manage">
            <div className="mt-4 border-t border-[var(--color-divider)] pt-4">
              <div className="text-sm font-medium mb-2">{t("superAdmin.complaints.detail.changeStatus")}</div>
              <Select 
                defaultValue={complaint.status} 
                onValueChange={handleStatusChange} 
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("superAdmin.complaints.detail.statusLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("superAdmin.complaints.status.new")}</SelectItem>
                  <SelectItem value="under_review">{t("superAdmin.complaints.status.under_review")}</SelectItem>
                  <SelectItem value="resolved">{t("superAdmin.complaints.status.resolved")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Can>
        </div>

        <DialogFooter className="border-t border-[var(--color-divider)] pt-4 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
