import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@shared/components/ui/toastContext";
import {
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
} from "../../hooks/useAdminQueries";
import { templateSchema, type TemplateFormValues } from "../../schemas/admin.schemas";
import type { NotificationTemplate } from "@modules/notifications/types";

interface TemplateFormDialogProps {
  template: NotificationTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateFormDialog({
  template,
  open,
  onOpenChange,
}: TemplateFormDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const createMutation = useCreateTemplateMutation();
  const updateMutation = useUpdateTemplateMutation();

  const isEditing = !!template;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      titleAr: "",
      titleEn: "",
      bodyAr: "",
      bodyEn: "",
      channel: "in_app",
      variables: [],
      isActive: true,
    },
  });

  const variables = watch("variables") || [];

  useEffect(() => {
    if (open) {
      if (template) {
        reset({
          nameAr: template.nameAr,
          nameEn: template.nameEn,
          titleAr: template.titleAr,
          titleEn: template.titleEn,
          bodyAr: template.bodyAr,
          bodyEn: template.bodyEn,
          channel: template.channel,
          variables: template.variables || [],
          isActive: template.isActive,
        });
      } else {
        reset({
          nameAr: "",
          nameEn: "",
          titleAr: "",
          titleEn: "",
          bodyAr: "",
          bodyEn: "",
          channel: "in_app",
          variables: [],
          isActive: true,
        });
      }
    }
  }, [open, template, reset]);

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      const payload = {
        ...data,
        variables: data.variables || [],
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: template.id,
          payload,
        });
        toast.success(t("superAdmin.notifications.templates.success.updated"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("superAdmin.notifications.templates.success.created"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("superAdmin.notifications.templates.edit")
              : t("superAdmin.notifications.templates.add")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameAr">
                {t("superAdmin.notifications.templates.form.nameAr")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="nameAr" {...register("nameAr")} />
              {errors.nameAr && <p className="text-sm text-danger-500">{t(errors.nameAr.message!)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {t("superAdmin.notifications.templates.form.nameEn")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="nameEn" {...register("nameEn")} dir="ltr" />
              {errors.nameEn && <p className="text-sm text-danger-500">{t(errors.nameEn.message!)}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("superAdmin.notifications.templates.form.channel")}</Label>
            <Select
              value={watch("channel")}
              onValueChange={(val: any) => setValue("channel", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
              <SelectContent>
                {["in_app", "push", "email", "sms"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`superAdmin.notifications.channels.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.channel && <p className="text-sm text-danger-500">{t(errors.channel.message!)}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titleAr">
                {t("superAdmin.notifications.templates.form.titleAr")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="titleAr" {...register("titleAr")} />
              {errors.titleAr && <p className="text-sm text-danger-500">{t(errors.titleAr.message!)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleEn">
                {t("superAdmin.notifications.templates.form.titleEn")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="titleEn" {...register("titleEn")} dir="ltr" />
              {errors.titleEn && <p className="text-sm text-danger-500">{t(errors.titleEn.message!)}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyAr">
              {t("superAdmin.notifications.templates.form.bodyAr")} <span className="text-danger-500">*</span>
            </Label>
            <Textarea id="bodyAr" {...register("bodyAr")} rows={3} />
            {errors.bodyAr && <p className="text-sm text-danger-500">{t(errors.bodyAr.message!)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyEn">
              {t("superAdmin.notifications.templates.form.bodyEn")} <span className="text-danger-500">*</span>
            </Label>
            <Textarea id="bodyEn" {...register("bodyEn")} rows={3} dir="ltr" />
            {errors.bodyEn && <p className="text-sm text-danger-500">{t(errors.bodyEn.message!)}</p>}
          </div>

          {/* Variables Editor */}
          <div className="space-y-3 p-4 bg-[var(--color-surface-2)] rounded-md">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">{t("superAdmin.notifications.templates.form.variables")}</Label>
                <p className="text-sm text-[var(--color-ink-lighter)]">
                  {t("superAdmin.notifications.templates.form.variableHint")}
                </p>
                <div className="flex items-center gap-1.5 w-max" dir="rtl">
                  <span className="text-sm text-[var(--color-ink-lighter)]">مثال:</span>
                  <span dir="ltr" className="font-mono text-xs text-[var(--color-ink-lighter)]">{"{{userName}}"}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue("variables", [...variables, ""])}
                className="gap-2 shrink-0"
              >
                <Plus size={16} />
                {t("superAdmin.notifications.templates.form.addVariable")}
              </Button>
            </div>

            {variables.length > 0 && (
              <div className="space-y-2 mt-4">
                {variables.map((v, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        value={v}
                        onChange={(e) => {
                          const newVars = [...variables];
                          newVars[index] = e.target.value;
                          setValue("variables", newVars);
                        }}
                        dir="ltr"
                        placeholder="e.g. userName"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-danger-500 shrink-0"
                      onClick={() => {
                        const newVars = variables.filter((_, i) => i !== index);
                        setValue("variables", newVars);
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-2)] rounded-md">
            <div className="space-y-0.5">
              <Label className="text-base">{t("superAdmin.notifications.templates.form.isActive")}</Label>
              <p className="text-sm text-[var(--color-ink-lighter)]">
                {t("superAdmin.notifications.templates.form.isActiveHint")}
              </p>
            </div>
            <Switch
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 text-white"
            >
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
