/**
 * @file SendConfirmDialog.tsx
 * @description Confirmation dialog before broadcasting a notification to users.
 */
import { useTranslation } from "react-i18next";
import { Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SendConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  audienceLabel: string;
  channelLabel: string;
}

export function SendConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  audienceLabel,
  channelLabel,
}: SendConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-orange)]/10 text-[var(--color-brand-orange)]">
              <Send className="h-5 w-5" />
            </div>
            <DialogTitle>{t("superAdmin.notifications.send.confirm.title")}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-[var(--color-ink-body)]">
            {t("superAdmin.notifications.send.confirm.message", {
              audience: audienceLabel,
              channel: channelLabel,
            })}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-[var(--color-brand-orange)] hover:bg-[#E3460F] text-white gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("superAdmin.notifications.send.confirm.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
