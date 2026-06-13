/**
 * @file Feature Flags Panel
 */

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import { Can } from "@shared/auth/Can";

import { useUpdateSettingsSectionMutation } from "../../hooks/useAdminQueries";
import { featureFlagsSchema, type FeatureFlagsFormValues } from "../../schemas/admin.schemas";
import type { SystemSettings } from "@modules/settings/types";

interface Props {
  settings: SystemSettings;
}

export function FeatureFlagsPanel({ settings }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { mutate, isPending } = useUpdateSettingsSectionMutation();

  const isRtl = i18n.language === "ar";

  const form = useForm<FeatureFlagsFormValues>({
    resolver: zodResolver(featureFlagsSchema),
    defaultValues: { flags: settings.featureFlags },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "flags",
  });

  useEffect(() => {
    form.reset({ flags: settings.featureFlags });
  }, [settings.featureFlags, form]);

  const onSubmit = (values: FeatureFlagsFormValues) => {
    mutate(
      { section: "featureFlags", payload: values },
      {
        onSuccess: () => toast.success(t("superAdmin.settings.flags.saved")),
        onError: () => toast.error(t("common.errorTitle")),
      }
    );
  };

  const isDirty = form.formState.isDirty;

  return (
    <Card className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-lg)] p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-[var(--font-main)] font-semibold text-lg text-[var(--color-ink-body)]">
          {t("superAdmin.settings.flags.heading")}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              key: "",
              labelAr: "",
              labelEn: "",
              descriptionAr: "",
              descriptionEn: "",
              enabled: false,
            })
          }
          className="gap-2"
        >
          <Plus size={16} />
          {t("superAdmin.settings.flags.add")}
        </Button>
      </div>

      <Form {...form}>
        <form id="feature-flags-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {fields.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] text-center py-4">
              {t("common.none")}
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => {
                const isMaintenance = form.watch(`flags.${index}.key`) === "maintenance_mode";
                const isEnabled = form.watch(`flags.${index}.enabled`);
                const labelAr = form.watch(`flags.${index}.labelAr`);
                const labelEn = form.watch(`flags.${index}.labelEn`);
                const rowTitle = isRtl ? (labelAr || "ميزة جديدة") : (labelEn || "New Feature");

                return (
                  <div key={field.id} className="border border-[var(--color-divider)] rounded-[var(--radius-lg)] p-4 space-y-4">
                    {/* Top Row */}
                    <div className="flex items-center justify-between border-b pb-4">
                      <Controller
                        control={form.control}
                        name={`flags.${index}.enabled` as const}
                        render={({ field: fProps }) => (
                          <FormItem className="flex flex-row items-center gap-4 space-y-0">
                            <FormControl>
                              <Switch
                                checked={fProps.value}
                                onCheckedChange={fProps.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-base font-semibold cursor-pointer">
                              {rowTitle}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-danger-500 hover:text-danger-600 hover:bg-danger-50 shrink-0"
                        onClick={() => remove(index)}
                        title={t("superAdmin.settings.flags.remove")}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>

                    {/* Expandable/Inline Fields */}
                    <div className="grid grid-cols-1 gap-4">
                      <Controller
                        control={form.control}
                        name={`flags.${index}.key` as const}
                        render={({ field: fProps, fieldState }) => (
                          <FormItem>
                            <FormLabel>{t("superAdmin.settings.flags.key")}</FormLabel>
                            <FormControl>
                              <Input {...fProps} dir="ltr" />
                            </FormControl>
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Controller
                          control={form.control}
                          name={`flags.${index}.labelAr` as const}
                          render={({ field: fProps, fieldState }) => (
                            <FormItem>
                              <FormLabel>{t("superAdmin.settings.flags.labelAr")}</FormLabel>
                              <FormControl>
                                <Input {...fProps} />
                              </FormControl>
                              <FormMessage>{fieldState.error?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <Controller
                          control={form.control}
                          name={`flags.${index}.labelEn` as const}
                          render={({ field: fProps, fieldState }) => (
                            <FormItem>
                              <FormLabel>{t("superAdmin.settings.flags.labelEn")}</FormLabel>
                              <FormControl>
                                <Input {...fProps} dir="ltr" />
                              </FormControl>
                              <FormMessage>{fieldState.error?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Controller
                          control={form.control}
                          name={`flags.${index}.descriptionAr` as const}
                          render={({ field: fProps, fieldState }) => (
                            <FormItem>
                              <FormLabel>{t("superAdmin.settings.flags.descAr")} ({t("common.optional")})</FormLabel>
                              <FormControl>
                                <Textarea {...fProps} value={fProps.value ?? ""} className="resize-none" />
                              </FormControl>
                              <FormMessage>{fieldState.error?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                        <Controller
                          control={form.control}
                          name={`flags.${index}.descriptionEn` as const}
                          render={({ field: fProps, fieldState }) => (
                            <FormItem>
                              <FormLabel>{t("superAdmin.settings.flags.descEn")} ({t("common.optional")})</FormLabel>
                              <FormControl>
                                <Textarea {...fProps} value={fProps.value ?? ""} dir="ltr" className="resize-none" />
                              </FormControl>
                              <FormMessage>{fieldState.error?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                      </div>

                      {isMaintenance && isEnabled && (
                        <p className="text-xs text-[var(--color-warning-500)]">
                          {t("superAdmin.settings.flags.maintenanceWarn")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
