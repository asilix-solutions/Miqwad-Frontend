import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateModelMutation, useUpdateModelMutation } from "../../hooks/useAdminQueries";
import { modelSchema, type ModelFormValues } from "../../schemas/admin.schemas";
import type { VehicleModel } from "@modules/vehicles/types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  mode: "create" | "edit";
  brandId: number | null;
  model?: VehicleModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelFormDialog({ mode, brandId, model, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateModelMutation();
  const updateMutation = useUpdateModelMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && model) {
        reset({
          nameAr: model.nameAr,
          nameEn: model.nameEn,
        });
      } else {
        reset({
          nameAr: "",
          nameEn: "",
        });
      }
    }
  }, [open, mode, model, reset]);

  const onSubmit = async (data: ModelFormValues) => {
    if (!brandId) return;

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          brandId,
          payload: {
            name: data.nameEn, // Fallback for backward compatibility
            nameAr: data.nameAr,
            nameEn: data.nameEn,
          },
        });
        toast.success(t("superAdmin.models.success.created"));
      } else if (mode === "edit" && model) {
        await updateMutation.mutateAsync({
          brandId,
          modelId: model.id,
          payload: {
            name: data.nameEn,
            nameAr: data.nameAr,
            nameEn: data.nameEn,
          },
        });
        toast.success(t("superAdmin.models.success.updated"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("superAdmin.models.add") : t("superAdmin.models.edit")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nameAr">
              {t("superAdmin.models.form.nameAr")} <span className="text-danger-500">*</span>
            </Label>
            <Input id="nameAr" {...register("nameAr")} disabled={isPending} />
            {errors.nameAr && (
              <p className="text-sm text-danger-500">{t(errors.nameAr.message as string)}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nameEn">
              {t("superAdmin.models.form.nameEn")} <span className="text-danger-500">*</span>
            </Label>
            <Input id="nameEn" dir="ltr" className="text-left" {...register("nameEn")} disabled={isPending} />
            {errors.nameEn && (
              <p className="text-sm text-danger-500">{t(errors.nameEn.message as string)}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
