/**
 * @file General Settings Panel
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@shared/components/ui/toastContext";
import { Can } from "@shared/auth/Can";

import { useUpdateSettingsSectionMutation } from "../../hooks/useAdminQueries";
import { generalSettingsSchema, type GeneralSettingsFormValues } from "../../schemas/admin.schemas";
import type { SystemSettings } from "@modules/settings/types";

interface Props {
  settings: SystemSettings;
}

export function GeneralSettingsPanel({ settings }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const { mutate, isPending } = useUpdateSettingsSectionMutation();

  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: settings.general,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(settings.general);
  }, [settings.general, form]);

  const onSubmit = (values: GeneralSettingsFormValues) => {
    mutate(
      { section: "general", payload: values },
      {
        onSuccess: () => toast.success(t("superAdmin.settings.general.saved")),
        onError: () => toast.error(t("common.errorTitle")),
      }
    );
  };

  const isDirty = form.formState.isDirty;

  return (
    <Card className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-lg)] p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="font-[var(--font-main)] font-semibold text-lg text-[var(--color-ink-body)]">
          {t("superAdmin.settings.general.heading")}
        </h2>
      </div>

      <Form {...form}>
        <form id="general-settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="platformNameAr"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.general.platformNameAr")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="platformNameEn"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.general.platformNameEn")}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="ltr" />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="logoUrl"
              render={({ field, fieldState }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("superAdmin.settings.general.logoUrl")} ({t("common.optional")})</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} dir="ltr" />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="supportEmail"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.general.supportEmail")}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="ltr" type="email" />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="supportPhone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.general.supportPhone")}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="ltr" />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              control={form.control}
              name="defaultCurrency"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.general.defaultCurrency")}</FormLabel>
                  <Select dir="rtl" value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SAR">SAR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="defaultLanguage"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.general.defaultLanguage")}</FormLabel>
                  <Select dir="rtl" value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ar">العربية (ar)</SelectItem>
                      <SelectItem value="en">English (en)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="timezone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.general.timezone")}</FormLabel>
                  <Select dir="rtl" value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                      <SelectItem value="Africa/Cairo">Africa/Cairo</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
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
