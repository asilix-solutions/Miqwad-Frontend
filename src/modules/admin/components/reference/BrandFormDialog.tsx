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
import { useCreateBrandMutation, useUpdateBrandMutation } from "../../hooks/useAdminQueries";
import { brandSchema, type BrandFormValues } from "../../schemas/admin.schemas";
import type { Brand } from "@modules/vehicles/types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  mode: "create" | "edit";
  brand?: Brand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandFormDialog({ mode, brand, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateBrandMutation();
  const updateMutation = useUpdateBrandMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && brand) {
        reset({
          nameAr: brand.nameAr,
          nameEn: brand.nameEn,
        });
      } else {
        reset({
          nameAr: "",
          nameEn: "",
        });
      }
    }
  }, [open, mode, brand, reset]);

  const onSubmit = async (data: BrandFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          name: data.nameEn, // Fallback for backward compatibility
          nameAr: data.nameAr,
          nameEn: data.nameEn,
        });
        toast.success(t("superAdmin.brands.success.created"));
      } else if (mode === "edit" && brand) {
        await updateMutation.mutateAsync({
          id: brand.id,
          payload: {
            name: data.nameEn,
            nameAr: data.nameAr,
            nameEn: data.nameEn,
          },
        });
        toast.success(t("superAdmin.brands.success.updated"));
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
            {mode === "create" ? t("superAdmin.brands.add") : t("superAdmin.brands.edit")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nameAr">
              {t("superAdmin.brands.form.nameAr")} <span className="text-danger-500">*</span>
            </Label>
            <Input id="nameAr" {...register("nameAr")} disabled={isPending} />
            {errors.nameAr && (
              <p className="text-sm text-danger-500">{t(errors.nameAr.message as string)}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nameEn">
              {t("superAdmin.brands.form.nameEn")} <span className="text-danger-500">*</span>
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
