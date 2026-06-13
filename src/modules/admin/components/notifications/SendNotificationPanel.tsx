/**
 * @file SendNotificationPanel.tsx
 * @description Admin panel to compose and send notifications to specific audiences or broadcast to all users.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Smartphone, Mail, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@shared/components/ui/toastContext";
import { useTemplatesQuery, useSendNotificationMutation } from "../../hooks/useAdminQueries";
import { sendNotificationSchema, type SendNotificationFormValues } from "../../schemas/admin.schemas";
import { SendConfirmDialog } from "./SendConfirmDialog";
import { cn } from "@shared/lib/utils";

const channelIcons: Record<string, React.FC<any>> = {
  in_app: Bell,
  push: Smartphone,
  email: Mail,
  sms: MessageSquare,
};

export function SendNotificationPanel() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language.startsWith("ar") ? "ar" : "en";

  const { data: templates } = useTemplatesQuery({ isActive: true });
  const { mutate, isPending } = useSendNotificationMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const defaultValues: SendNotificationFormValues = {
    templateId: null,
    titleAr: "",
    titleEn: "",
    bodyAr: "",
    bodyEn: "",
    audience: "all",
    channel: "in_app",
  };

  const form = useForm<SendNotificationFormValues>({
    resolver: zodResolver(sendNotificationSchema),
    mode: "onChange",
    defaultValues,
  });

  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
    reset,
  } = form;

  const currentAudience = watch("audience");
  const currentChannel = watch("channel");
  const titleAr = watch("titleAr");
  const titleEn = watch("titleEn");
  const bodyAr = watch("bodyAr");
  const bodyEn = watch("bodyEn");

  const handleTemplateChange = (val: string) => {
    if (!val) {
      setValue("templateId", null, { shouldValidate: true, shouldDirty: true });
      return;
    }
    const tmpl = templates?.find((tItem) => String(tItem.id) === val);
    if (tmpl) {
      setValue("templateId", tmpl.id, { shouldValidate: true, shouldDirty: true });
      setValue("titleAr", tmpl.titleAr, { shouldValidate: true, shouldDirty: true });
      setValue("titleEn", tmpl.titleEn, { shouldValidate: true, shouldDirty: true });
      setValue("bodyAr", tmpl.bodyAr, { shouldValidate: true, shouldDirty: true });
      setValue("bodyEn", tmpl.bodyEn, { shouldValidate: true, shouldDirty: true });
      setValue("channel", tmpl.channel, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleSendClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    const values = getValues();
    const payload = {
      templateId: values.templateId ?? null,
      titleAr: values.titleAr,
      titleEn: values.titleEn,
      bodyAr: values.bodyAr,
      bodyEn: values.bodyEn,
      audience: values.audience,
      channel: values.channel,
    };

    mutate(payload, {
      onSuccess: () => {
        toast.success(t("superAdmin.notifications.send.success"));
        setConfirmOpen(false);
        reset(defaultValues);
      },
      onError: () => {
        toast.error(t("superAdmin.notifications.send.error"));
        setConfirmOpen(false);
      },
    });
  };

  const displayTitle = lang === "ar" ? titleAr : titleEn;
  const displayBody = lang === "ar" ? bodyAr : bodyEn;
  const isPreviewEmpty = !displayTitle && !displayBody;

  const CurrentChannelIcon = channelIcons[currentChannel] || Bell;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
      {/* LEFT — Compose card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-divider)] p-6 flex flex-col gap-6">
        <h2 className="font-[var(--font-main)] font-semibold text-[var(--color-ink-body)] text-lg">
          {t("superAdmin.notifications.send.compose")}
        </h2>

        <div className="space-y-2">
          <Label>{t("superAdmin.notifications.send.loadTemplate")}</Label>
          <Select onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("superAdmin.notifications.send.manualOption")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("superAdmin.notifications.send.manualOption")}</SelectItem>
              {templates?.map((tmpl) => (
                <SelectItem key={tmpl.id} value={String(tmpl.id)}>
                  {lang === "ar" ? tmpl.nameAr : tmpl.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="titleAr">
              {t("superAdmin.notifications.send.titleAr")} <span className="text-danger-500">*</span>
            </Label>
            <Input id="titleAr" {...register("titleAr")} />
            {errors.titleAr && <p className="text-sm text-danger-500">{t(errors.titleAr.message!)}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="titleEn">
              {t("superAdmin.notifications.send.titleEn")} <span className="text-danger-500">*</span>
            </Label>
            <Input id="titleEn" {...register("titleEn")} dir="ltr" />
            {errors.titleEn && <p className="text-sm text-danger-500">{t(errors.titleEn.message!)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bodyAr">
              {t("superAdmin.notifications.send.bodyAr")} <span className="text-danger-500">*</span>
            </Label>
            <Textarea id="bodyAr" {...register("bodyAr")} className="min-h-[120px]" />
            {errors.bodyAr && <p className="text-sm text-danger-500">{t(errors.bodyAr.message!)}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bodyEn">
              {t("superAdmin.notifications.send.bodyEn")} <span className="text-danger-500">*</span>
            </Label>
            <Textarea id="bodyEn" {...register("bodyEn")} dir="ltr" className="min-h-[120px]" />
            {errors.bodyEn && <p className="text-sm text-danger-500">{t(errors.bodyEn.message!)}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("superAdmin.notifications.send.audience")}</Label>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {["all", "customers", "providers"].map((aud) => (
              <button
                key={aud}
                type="button"
                role="radio"
                aria-checked={currentAudience === aud}
                onClick={() => setValue("audience", aud as any, { shouldValidate: true })}
                className={cn(
                  "h-9 px-4 rounded-[var(--radius-md)] text-sm transition-colors",
                  currentAudience === aud
                    ? "bg-[var(--color-brand-orange)] text-white font-semibold"
                    : "bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
                )}
              >
                {t(`superAdmin.notifications.history.audiences.${aud}`)}
              </button>
            ))}
          </div>
          {errors.audience && <p className="text-sm text-danger-500">{t(errors.audience.message!)}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t("superAdmin.notifications.send.channel")}</Label>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {["in_app", "push", "email", "sms"].map((ch) => {
              const Icon = channelIcons[ch] || Bell;
              return (
                <button
                  key={ch}
                  type="button"
                  role="radio"
                  aria-checked={currentChannel === ch}
                  onClick={() => setValue("channel", ch as any, { shouldValidate: true })}
                  className={cn(
                    "flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-sm transition-colors",
                    currentChannel === ch
                      ? "bg-[var(--color-brand-orange)] text-white font-semibold"
                      : "bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
                  )}
                >
                  <Icon size={16} />
                  {t(`superAdmin.notifications.channels.${ch}`)}
                </button>
              );
            })}
          </div>
          {errors.channel && <p className="text-sm text-danger-500">{t(errors.channel.message!)}</p>}
        </div>
      </div>

      {/* RIGHT — Preview card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-divider)] p-6 flex flex-col gap-4 lg:sticky lg:top-6">
        <h2 className="font-[var(--font-main)] font-semibold text-[var(--color-ink-body)] text-lg">
          {t("superAdmin.notifications.send.preview")}
        </h2>

        {isPreviewEmpty ? (
          <div className="text-center text-sm text-[var(--color-muted)] py-8">
            {t("superAdmin.notifications.send.previewEmpty")}
          </div>
        ) : (
          <div className="bg-[var(--color-app-bg)] rounded-[var(--radius-md)] p-4 flex flex-col gap-3" dir={lang === "ar" ? "rtl" : "ltr"}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-surface)]">
                <CurrentChannelIcon size={16} className="text-[var(--color-ink-lighter)]" />
              </div>
              <span className="text-xs text-[var(--color-muted)]">
                {t(`superAdmin.notifications.channels.${currentChannel}`)}
              </span>
            </div>
            {displayTitle && (
              <div className="font-semibold text-[var(--color-ink-body)] line-clamp-2">
                {displayTitle}
              </div>
            )}
            {displayBody && (
              <div className="text-sm text-[var(--color-ink-body)] whitespace-pre-wrap">
                {displayBody}
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-[var(--color-muted)]">
          {t("superAdmin.notifications.send.recipients")}: {t(`superAdmin.notifications.history.audiences.${currentAudience}`)}
        </div>

        <Button
          type="button"
          onClick={handleSendClick}
          disabled={!isValid || isPending}
          className="w-full h-[var(--size-input-h)] rounded-[var(--radius-md)] bg-[var(--color-brand-orange)] hover:bg-[#E3460F] text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              {t("superAdmin.notifications.send.sending")}
            </>
          ) : (
            t("superAdmin.notifications.send.submit")
          )}
        </Button>
      </div>

      {confirmOpen && (
        <SendConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={handleConfirm}
          isPending={isPending}
          audienceLabel={t(`superAdmin.notifications.history.audiences.${currentAudience}`)}
          channelLabel={t(`superAdmin.notifications.channels.${currentChannel}`)}
        />
      )}
    </div>
  );
}
