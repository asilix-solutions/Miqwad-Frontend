/**
 * @file BrandFormDialog.tsx
 * @description Create/edit dialog for the real-backend `/api/Brands`
 * resource — single Arabic name + optional image URL (backend accepts a
 * plain `image` string field, not a file upload).
 */
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
      name: "",
      image: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && brand) {
        reset({
          name: brand.name,
          image: brand.image ?? "",
        });
      } else {
        reset({
          name: "",
          image: "",
        });
      }
    }
  }, [open, mode, brand, reset]);

  const onSubmit = async (data: BrandFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({ name: data.name, image: data.image || null });
        toast.success(t("superAdmin.brands.success.created"));
      } else if (mode === "edit" && brand) {
        await updateMutation.mutateAsync({ id: brand.id, name: data.name, image: data.image || null });
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
            <Label htmlFor="name">
              {t("superAdmin.brands.form.name")} <span className="text-danger-500">*</span>
            </Label>
            <Input id="name" {...register("name")} disabled={isPending} />
            {errors.name && (
              <p className="text-sm text-danger-500">{t(errors.name.message as string)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">{t("superAdmin.brands.form.image")}</Label>
            <Input id="image" dir="ltr" className="text-left" {...register("image")} disabled={isPending} />
            {errors.image && (
              <p className="text-sm text-danger-500">{t(errors.image.message as string)}</p>
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
