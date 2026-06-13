/**
 * @file DeleteCampaignDialog.tsx
 * @description Dialog to confirm deletion of an ad campaign.
 */

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
import { useDeleteCampaignMutation } from "../../hooks/useAdminQueries";
import type { AdCampaign } from "@modules/ads/types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  campaign: AdCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCampaignDialog({ campaign, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteCampaignMutation();

  const handleConfirm = async () => {
    if (!campaign) return;
    try {
      await deleteMutation.mutateAsync(campaign.id);
      toast.success(t("superAdmin.ads.campaigns.deleted"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.deleteFailed"));
    }
  };

  const campaignTitle = campaign ? (i18n.language === "ar" ? campaign.titleAr : campaign.titleEn) : "";

  return (
    <Dialog open={open} onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-danger-500">
            {t("superAdmin.ads.campaigns.deleteTitle")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("superAdmin.ads.campaigns.deleteMessage", {
              name: campaignTitle,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? t("common.loading")
              : t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
