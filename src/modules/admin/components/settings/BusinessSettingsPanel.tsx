/**
 * @file Business Settings Panel
 */

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import { Can } from "@shared/auth/Can";

import { useUpdateSettingsSectionMutation } from "../../hooks/useAdminQueries";
import { businessSettingsSchema, type BusinessSettingsFormValues } from "../../schemas/admin.schemas";
import type { SystemSettings } from "@modules/settings/types";

interface Props {
  settings: SystemSettings;
}

export function BusinessSettingsPanel({ settings }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const { mutate, isPending } = useUpdateSettingsSectionMutation();

  const form = useForm<BusinessSettingsFormValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: settings.business,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(settings.business);
  }, [settings.business, form]);

  const onSubmit = (values: BusinessSettingsFormValues) => {
    mutate(
      { section: "business", payload: values },
      {
        onSuccess: () => toast.success(t("superAdmin.settings.business.saved")),
        onError: () => toast.error(t("common.errorTitle")),
      }
    );
  };

  const isDirty = form.formState.isDirty;

  return (
    <Card className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-lg)] p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="font-[var(--font-main)] font-semibold text-lg text-[var(--color-ink-body)]">
          {t("superAdmin.settings.business.heading")}
        </h2>
      </div>

      <Form {...form}>
        <form id="business-settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="defaultCommissionRate"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.business.defaultCommissionRate")} (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      dir="ltr"
                      {...field}
                      onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{t("superAdmin.settings.business.commissionHint")}</p>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="minWithdrawalAmount"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.business.minWithdrawalAmount")} (ر.س)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      dir="ltr"
                      {...field}
                      onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{t("superAdmin.settings.business.minWithdrawalHint")}</p>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="settlementHoldDays"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.business.settlementHoldDays")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      dir="ltr"
                      {...field}
                      onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{t("superAdmin.settings.business.settlementHoldHint")}</p>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="escrowAutoReleaseDays"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.business.escrowAutoReleaseDays")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      dir="ltr"
                      {...field}
                      onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <p className="text-xs text-[var(--color-muted)] mt-1">{t("superAdmin.settings.business.escrowHint")}</p>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Can permission="settings.edit">
              <Button type="submit" disabled={!isDirty || isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </Can>
          </div>
        </form>
      </Form>
    </Card>
  );
}
