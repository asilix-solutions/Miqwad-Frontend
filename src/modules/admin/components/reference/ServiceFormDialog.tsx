/**
 * @file ServiceFormDialog.tsx
 *
 * Admin dialog for creating or editing a Service.
 * Uses CategoryCascader (three-level) instead of a flat category select,
 * so the admin must choose a valid level-3 leaf before saving.
 */

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CategoryCascader } from "@shared/provider-ui/CategoryCascader";
import { useCreateServiceMutation, useUpdateServiceMutation } from "../../hooks/useAdminQueries";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import { serviceSchema, type ServiceFormValues } from "../../schemas/admin.schemas";
import type { Service } from "@modules/services/types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  mode: "create" | "edit";
  service?: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceFormDialog({ mode, service, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateServiceMutation();
  const updateMutation = useUpdateServiceMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const categoriesQ = useServiceCategoriesQuery();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      categoryId: undefined,
      basePrice: 0,
      estimatedDuration: undefined,
      descriptionAr: undefined,
      descriptionEn: undefined,
      isActive: true,
      sortOrder: undefined,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && service) {
        reset({
          nameAr: service.nameAr,
          nameEn: service.nameEn,
          categoryId: service.categoryId,
          basePrice: service.basePrice,
          estimatedDuration: service.estimatedDuration ?? undefined,
          descriptionAr: service.descriptionAr ?? undefined,
          descriptionEn: service.descriptionEn ?? undefined,
          isActive: service.isActive,
          sortOrder: service.sortOrder ?? undefined,
        });
      } else {
        reset({
          nameAr: "",
          nameEn: "",
          categoryId: undefined,
          basePrice: 0,
          estimatedDuration: undefined,
          descriptionAr: undefined,
          descriptionEn: undefined,
          isActive: true,
          sortOrder: undefined,
        });
      }
    }
  }, [open, mode, service, reset]);

  const onSubmit = async (data: ServiceFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          categoryId: data.categoryId,
          basePrice: data.basePrice,
          estimatedDuration: data.estimatedDuration ?? null,
          descriptionAr: data.descriptionAr ?? null,
          descriptionEn: data.descriptionEn ?? null,
          isActive: data.isActive,
          sortOrder: data.sortOrder ?? null,
        });
        toast.success(t("superAdmin.services.success.created"));
      } else if (mode === "edit" && service) {
        await updateMutation.mutateAsync({
          id: service.id,
          payload: {
            nameAr: data.nameAr,
            nameEn: data.nameEn,
            categoryId: data.categoryId,
            basePrice: data.basePrice,
            estimatedDuration: data.estimatedDuration ?? null,
            descriptionAr: data.descriptionAr ?? null,
            descriptionEn: data.descriptionEn ?? null,
            isActive: data.isActive,
            sortOrder: data.sortOrder ?? null,
          },
        });
        toast.success(t("superAdmin.services.success.updated"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("superAdmin.services.add") : t("superAdmin.services.edit")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameAr">
                {t("superAdmin.services.form.nameAr")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="nameAr" {...register("nameAr")} disabled={isPending} />
              {errors.nameAr && (
                <p className="text-sm text-danger-500">{t(errors.nameAr.message as string)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {t("superAdmin.services.form.nameEn")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="nameEn" dir="ltr" className="text-left" {...register("nameEn")} disabled={isPending} />
              {errors.nameEn && (
                <p className="text-sm text-danger-500">{t(errors.nameEn.message as string)}</p>
              )}
            </div>
          </div>

          {/* Three-level category cascader */}
          <div className="space-y-1">
            <Label>
              {t("superAdmin.services.form.category")} <span className="text-danger-500">*</span>
            </Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <CategoryCascader
                  categories={categoriesQ.data ?? []}
                  value={field.value ?? null}
                  onChange={(id) => {
                    field.onChange(id);
                    setValue("categoryId", id, { shouldValidate: true });
                  }}
                  disabled={isPending || categoriesQ.isLoading}
                  error={errors.categoryId ? t(errors.categoryId.message as string) : undefined}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">
                {t("superAdmin.services.form.basePrice")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="basePrice" type="number" min={0} {...register("basePrice", { valueAsNumber: true })} disabled={isPending} />
              {errors.basePrice && (
                <p className="text-sm text-danger-500">{t(errors.basePrice.message as string)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">
                {t("superAdmin.services.form.duration")} ({t("common.optional")})
              </Label>
              <Input id="estimatedDuration" type="number" min={1} {...register("estimatedDuration", { valueAsNumber: true, setValueAs: v => v === "" || isNaN(v) ? undefined : v })} disabled={isPending} />
              {errors.estimatedDuration && (
                <p className="text-sm text-danger-500">{t(errors.estimatedDuration.message as string)}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">
              {t("superAdmin.services.form.sortOrder")} ({t("common.optional")})
            </Label>
            <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true, setValueAs: v => v === "" || isNaN(v) ? undefined : v })} disabled={isPending} />
            {errors.sortOrder && (
              <p className="text-sm text-danger-500">{t(errors.sortOrder.message as string)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionAr">
              {t("superAdmin.services.form.descriptionAr")} ({t("common.optional")})
            </Label>
            <Textarea id="descriptionAr" {...register("descriptionAr")} disabled={isPending} />
            {errors.descriptionAr && (
              <p className="text-sm text-danger-500">{t(errors.descriptionAr.message as string)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionEn">
              {t("superAdmin.services.form.descriptionEn")} ({t("common.optional")})
            </Label>
            <Textarea id="descriptionEn" dir="ltr" className="text-left" {...register("descriptionEn")} disabled={isPending} />
            {errors.descriptionEn && (
              <p className="text-sm text-danger-500">{t(errors.descriptionEn.message as string)}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(val) => setValue("isActive", val, { shouldValidate: true })}
              disabled={isPending}
              dir="ltr"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              {t("superAdmin.services.form.isActive")}
            </Label>
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
