import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@shared/components/ui/toastContext";

import { planSchema, type PlanFormValues } from "../../schemas/admin.schemas";
import { useCreatePlanMutation, useUpdatePlanMutation } from "../../hooks/useAdminQueries";
import type { SubscriptionPlan } from "@modules/subscriptions/types";

interface Props {
  plan: SubscriptionPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanFormDialog({ plan, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const createMutation = useCreatePlanMutation();
  const updateMutation = useUpdatePlanMutation();

  const isEdit = !!plan;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      price: 0,
      billingCycle: "monthly",
      isActive: true,
      features: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  });

  useEffect(() => {
    if (open) {
      if (plan) {
        form.reset({
          nameAr: plan.nameAr,
          nameEn: plan.nameEn,
          descriptionAr: plan.descriptionAr ?? "",
          descriptionEn: plan.descriptionEn ?? "",
          price: plan.price,
          billingCycle: plan.billingCycle,
          isActive: plan.isActive,
          features: plan.features.map(f => ({ ...f })), // Clone to avoid mutation
        });
      } else {
        form.reset({
          nameAr: "",
          nameEn: "",
          descriptionAr: "",
          descriptionEn: "",
          price: 0,
          billingCycle: "monthly",
          isActive: true,
          features: [],
        });
      }
    }
  }, [open, plan, form]);

  const onSubmit = async (values: PlanFormValues) => {
    try {
      if (isEdit && plan) {
        await updateMutation.mutateAsync({ id: plan.id, payload: values });
        toast.success(t("superAdmin.plans.success.updated"));
      } else {
        await createMutation.mutateAsync(values);
        toast.success(t("superAdmin.plans.success.created"));
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
            {isEdit ? t("superAdmin.plans.edit") : t("superAdmin.plans.add")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="plan-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto pr-2 pl-2 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="nameAr"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.plans.form.nameAr")}</FormLabel>
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
                    <FormLabel>{t("superAdmin.plans.form.nameEn")}</FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="price"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.plans.form.price")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="billingCycle"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.plans.form.billingCycle")}</FormLabel>
                    <Select
                      dir="rtl"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">
                          {t("superAdmin.plans.billingCycles.monthly")}
                        </SelectItem>
                        <SelectItem value="yearly">
                          {t("superAdmin.plans.billingCycles.yearly")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="descriptionAr"
                render={({ field, fieldState }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("superAdmin.plans.form.descriptionAr")} ({t("common.optional")})</FormLabel>
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("superAdmin.plans.form.descriptionEn")} ({t("common.optional")})</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} dir="ltr" className="resize-none" />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="isActive"
                render={({ field, fieldState }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t("superAdmin.plans.form.isActive")}
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
            </div>

            {/* DYNAMIC FEATURES EDITOR */}
            <div className="space-y-4 rounded-lg border p-4 bg-[var(--color-surface-2)]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{t("superAdmin.plans.form.features")}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ id: crypto.randomUUID(), labelAr: "", labelEn: "" })}
                  className="gap-2"
                >
                  <Plus size={16} />
                  {t("superAdmin.plans.form.addFeature")}
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("common.none")}
                </p>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Controller
                          control={form.control}
                          name={`features.${index}.labelAr` as const}
                          render={({ field: fProps, fieldState }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder={t("superAdmin.plans.form.featureLabelAr")} {...fProps} />
                              </FormControl>
                              <FormMessage>{fieldState.error?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <Controller
                          control={form.control}
                          name={`features.${index}.labelEn` as const}
                          render={({ field: fProps, fieldState }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder={t("superAdmin.plans.form.featureLabelEn")} {...fProps} dir="ltr" />
                              </FormControl>
                              <FormMessage>{fieldState.error?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-danger-500 hover:text-danger-600 hover:bg-danger-50 shrink-0"
                        onClick={() => remove(index)}
                        title={t("superAdmin.plans.form.removeFeature")}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
          <Button form="plan-form" type="submit" disabled={isPending}>
            {isPending ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
