/**
 * @file PlanFormDialog.tsx
 * @description Create + edit dialog for a subscription plan (one dialog, two
 * modes) — Radix Dialog + react-hook-form + the Stage-1 zod schema
 * (`subscriptionPlanSchema`). Exactly four fields: name, description, price,
 * billingCycle. On submit it calls `useCreatePlan` / `useUpdatePlan` (which
 * own query invalidation), toasts success/failure, and closes. Only the four
 * payload fields are sent — the backend silently ignores extras, so there is
 * no field-level 400 to map.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  subscriptionPlanSchema,
  type SubscriptionPlanFormValues,
} from "../schemas/subscriptionPlan.schema";
import { useCreatePlan, useUpdatePlan } from "../hooks/useSubscriptionQueries";
import { BILLING_CYCLE, type SubscriptionPlan, type SubscriptionPlanWritePayload } from "../types";

interface PlanFormDialogProps {
  plan: SubscriptionPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BILLING_CYCLE_OPTIONS: { value: number; labelKey: string }[] = [
  { value: BILLING_CYCLE.monthly, labelKey: "superAdmin.plans.billingCycles.monthly" },
  { value: BILLING_CYCLE.yearly, labelKey: "superAdmin.plans.billingCycles.yearly" },
];

export function PlanFormDialog({ plan, open, onOpenChange }: PlanFormDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();

  const isEdit = !!plan;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<
    z.input<typeof subscriptionPlanSchema>,
    unknown,
    SubscriptionPlanFormValues
  >({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
      billingCycle: BILLING_CYCLE.monthly,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description ?? "",
        price: plan.price,
        billingCycle: plan.billingCycle,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: undefined,
        billingCycle: BILLING_CYCLE.monthly,
      });
    }
  }, [open, plan, form]);

  const onSubmit = async (values: SubscriptionPlanFormValues) => {
    const description = values.description?.trim();
    const payload: SubscriptionPlanWritePayload = {
      name: values.name.trim(),
      description: description ? description : undefined,
      price: values.price,
      billingCycle: values.billingCycle,
    };

    try {
      if (isEdit && plan) {
        await updateMutation.mutateAsync({ id: plan.id, payload });
        toast.success(t("superAdmin.plans.toasts.updated"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("superAdmin.plans.toasts.created"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[480px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("superAdmin.plans.form.editTitle")
              : t("superAdmin.plans.form.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="plan-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.plans.form.nameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("superAdmin.plans.form.namePlaceholder")}
                    />
                  </FormControl>
                  <FormMessage>
                    {fieldState.error?.message && t(fieldState.error.message)}
                  </FormMessage>
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.plans.form.descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
                      placeholder={t("superAdmin.plans.form.descriptionPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage>
                    {fieldState.error?.message && t(fieldState.error.message)}
                  </FormMessage>
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="price"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.plans.form.priceLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={0}
                      dir="ltr"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                      }
                      placeholder={t("superAdmin.plans.form.pricePlaceholder")}
                    />
                  </FormControl>
                  <FormMessage>
                    {fieldState.error?.message && t(fieldState.error.message)}
                  </FormMessage>
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="billingCycle"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.plans.form.billingCycleLabel")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("superAdmin.plans.form.billingCyclePlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {BILLING_CYCLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {t(opt.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {fieldState.error?.message && t(fieldState.error.message)}
                  </FormMessage>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--color-divider)] pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button form="plan-form" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isPending ? t("superAdmin.plans.form.saving") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
