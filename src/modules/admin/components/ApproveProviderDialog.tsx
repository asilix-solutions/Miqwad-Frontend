import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  submitting: boolean;
}

export function ApproveProviderDialog({
  providerName,
  open,
  onOpenChange,
  onConfirm,
  submitting,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("superAdmin.providers.detail.approveConfirm.title")}</DialogTitle>
          <DialogDescription>
            {t("superAdmin.providers.detail.approveConfirm.description", { name: providerName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("superAdmin.providers.detail.approveConfirm.cancel")}
          </Button>
          <Button variant="secondary" onClick={onConfirm} disabled={submitting} className="bg-success-100 text-success-700 hover:bg-success-200">
            {submitting ? t("common.loading") : t("superAdmin.providers.detail.approveConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
