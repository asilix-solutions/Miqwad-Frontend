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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCategoryMutation, useUpdateCategoryMutation } from "../../hooks/useAdminQueries";
import { categorySchema, type CategoryFormValues } from "../../schemas/admin.schemas";
import type { ServiceCategory } from "@modules/services/types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  mode: "create" | "edit";
  category?: ServiceCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLOR_OPTIONS = ["blue", "green", "orange", "purple", "red", "navy"] as const;
const COLOR_MAP: Record<string, string> = {
  blue: "var(--color-brand-blue)",
  green: "var(--color-success-500)",
  orange: "var(--color-brand-orange)",
  purple: "var(--color-surface-4)",
  red: "var(--color-danger-500)",
  navy: "var(--color-ink-900)",
};

export function CategoryFormDialog({ mode, category, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      iconUrl: undefined,
      colorHint: undefined,
    },
  });

  const selectedColor = watch("colorHint");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && category) {
        reset({
          nameAr: category.nameAr,
          nameEn: category.nameEn,
          iconUrl: category.iconUrl ?? undefined,
          colorHint: category.colorHint ?? undefined,
        });
      } else {
        reset({
          nameAr: "",
          nameEn: "",
          iconUrl: undefined,
          colorHint: undefined,
        });
      }
    }
  }, [open, mode, category, reset]);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          iconUrl: data.iconUrl || null,
          colorHint: data.colorHint || undefined,
        });
        toast.success(t("superAdmin.categories.success.created"));
      } else if (mode === "edit" && category) {
        await updateMutation.mutateAsync({
          id: category.id,
          payload: {
            nameAr: data.nameAr,
            nameEn: data.nameEn,
            iconUrl: data.iconUrl || null,
            colorHint: data.colorHint || undefined,
          },
        });
        toast.success(t("superAdmin.categories.success.updated"));
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
            {mode === "create" ? t("superAdmin.categories.add") : t("superAdmin.categories.edit")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nameAr">
              {t("superAdmin.categories.form.nameAr")} <span className="text-danger-500">*</span>
            </Label>
            <Input id="nameAr" {...register("nameAr")} disabled={isPending} />
            {errors.nameAr && (
              <p className="text-sm text-danger-500">{t(errors.nameAr.message as string)}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nameEn">
              {t("superAdmin.categories.form.nameEn")} <span className="text-danger-500">*</span>
            </Label>
            <Input id="nameEn" dir="ltr" className="text-left" {...register("nameEn")} disabled={isPending} />
            {errors.nameEn && (
              <p className="text-sm text-danger-500">{t(errors.nameEn.message as string)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="iconUrl">
              {t("superAdmin.categories.form.iconUrl")} ({t("common.optional")})
            </Label>
            <Input id="iconUrl" type="url" dir="ltr" className="text-left" {...register("iconUrl")} disabled={isPending} />
            {errors.iconUrl && (
              <p className="text-sm text-danger-500">{t(errors.iconUrl.message as string)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorHint">
              {t("superAdmin.categories.form.colorHint")} ({t("common.optional")})
            </Label>
            <Select
              disabled={isPending}
              value={selectedColor ?? ""}
              onValueChange={(val: any) => setValue("colorHint", val)}
            >
              <SelectTrigger id="colorHint">
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {COLOR_OPTIONS.map((color) => (
                  <SelectItem key={color} value={color}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border border-ink-200 shrink-0"
                        style={{ backgroundColor: COLOR_MAP[color] }}
                      />
                      <span>{t(`superAdmin.categories.form.colorOptions.${color}`)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.colorHint && (
              <p className="text-sm text-danger-500">{t(errors.colorHint.message as string)}</p>
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
