/**
 * @file PlacementFormDialog.tsx
 * @description Dialog form to create or edit an ad placement.
 */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@shared/components/ui/toastContext";

import { placementSchema, type PlacementFormValues } from "../../schemas/admin.schemas";
import { useCreatePlacementMutation, useUpdatePlacementMutation } from "../../hooks/useAdminQueries";
import type { AdPlacement } from "@modules/ads/types";

interface Props {
  placement: AdPlacement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlacementFormDialog({ placement, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const createMutation = useCreatePlacementMutation();
  const updateMutation = useUpdatePlacementMutation();

  const isEdit = !!placement;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<PlacementFormValues>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      code: "",
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (placement) {
        form.reset({
          code: placement.code,
          nameAr: placement.nameAr,
          nameEn: placement.nameEn,
          descriptionAr: placement.descriptionAr ?? "",
          descriptionEn: placement.descriptionEn ?? "",
          isActive: placement.isActive,
        });
      } else {
        form.reset({
          code: "",
          nameAr: "",
          nameEn: "",
          descriptionAr: "",
          descriptionEn: "",
          isActive: true,
        });
      }
    }
  }, [open, placement, form]);

  const onSubmit = async (values: PlacementFormValues) => {
    try {
      if (isEdit && placement) {
        await updateMutation.mutateAsync({ id: placement.id, payload: values });
        toast.success(t("superAdmin.ads.placements.updatedToast"));
      } else {
        await createMutation.mutateAsync(values);
        toast.success(t("superAdmin.ads.placements.createdToast"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("superAdmin.ads.placements.form.editTitle") : t("superAdmin.ads.placements.form.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="placement-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto pr-2 pl-2 space-y-6"
          >
            <Controller
              control={form.control}
              name="code"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.ads.placements.form.codeLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="ltr" />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="nameAr"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.ads.placements.form.nameAr")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />
              <Controller
                control={form.control}
                name="nameEn"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.ads.placements.form.nameEn")}</FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="descriptionAr"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.ads.placements.form.descAr")} ({t("common.optional")})</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} className="resize-none" />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="descriptionEn"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.ads.placements.form.descEn")} ({t("common.optional")})</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} dir="ltr" className="resize-none" />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="isActive"
              render={({ field, fieldState }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("superAdmin.ads.placements.form.isActive")}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button form="placement-form" type="submit" disabled={isPending}>
            {isPending ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
