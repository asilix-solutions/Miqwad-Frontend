/**
 * @file Contact Settings Panel
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
import { contactSettingsSchema, type ContactSettingsFormValues } from "../../schemas/admin.schemas";
import type { SystemSettings } from "@modules/settings/types";

interface Props {
  settings: SystemSettings;
}

export function ContactSettingsPanel({ settings }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const { mutate, isPending } = useUpdateSettingsSectionMutation();

  const form = useForm<ContactSettingsFormValues>({
    resolver: zodResolver(contactSettingsSchema),
    defaultValues: settings.contact,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(settings.contact);
  }, [settings.contact, form]);

  const onSubmit = (values: ContactSettingsFormValues) => {
    mutate(
      { section: "contact", payload: values },
      {
        onSuccess: () => toast.success(t("superAdmin.settings.contact.saved")),
        onError: () => toast.error(t("common.errorTitle")),
      }
    );
  };

  const isDirty = form.formState.isDirty;

  return (
    <Card className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-lg)] p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="font-[var(--font-main)] font-semibold text-lg text-[var(--color-ink-body)]">
          {t("superAdmin.settings.contact.heading")}
        </h2>
      </div>

      <Form {...form}>
        <form id="contact-settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="termsUrlAr"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.contact.termsUrlAr")} ({t("common.optional")})</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} dir="ltr" />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="termsUrlEn"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.contact.termsUrlEn")} ({t("common.optional")})</FormLabel>
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
              name="privacyUrlAr"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.contact.privacyUrlAr")} ({t("common.optional")})</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} dir="ltr" />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="privacyUrlEn"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.contact.privacyUrlEn")} ({t("common.optional")})</FormLabel>
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
              name="twitterUrl"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.contact.twitterUrl")} ({t("common.optional")})</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} dir="ltr" />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="instagramUrl"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.contact.instagramUrl")} ({t("common.optional")})</FormLabel>
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
              name="whatsappNumber"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.settings.contact.whatsappNumber")} ({t("common.optional")})</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} dir="ltr" />
                  </FormControl>
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
