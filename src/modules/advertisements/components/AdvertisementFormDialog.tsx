/**
 * @file AdvertisementFormDialog.tsx
 * @description Create + edit dialog for an Advertisement (multipart POST/PUT
 * /api/Advertisement). Title, Image (drag-and-drop or click-to-browse, with
 * live preview; on edit shows the current image and allows keeping it or
 * replacing it), DeepLink (with a "test link" affordance), IsActive.
 */

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, ImagePlus, Loader2, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@shared/components/ui/toastContext";

import {
  advertisementFormSchema,
  type AdvertisementFormValues,
} from "../schemas/advertisements.schemas";
import {
  useCreateAdvertisementMutation,
  useUpdateAdvertisementMutation,
} from "../hooks/useAdvertisementsQueries";
import type { Advertisement } from "../types";

const MAX_SIZE_MB = 8;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface AdvertisementFormDialogProps {
  advertisement: Advertisement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Human-readable file size, e.g. "1.2 MB" / "480 KB". */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdvertisementFormDialog({
  advertisement,
  open,
  onOpenChange,
}: AdvertisementFormDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const createMutation = useCreateAdvertisementMutation();
  const updateMutation = useUpdateAdvertisementMutation();

  const isEdit = !!advertisement;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const form = useForm<AdvertisementFormValues>({
    resolver: zodResolver(advertisementFormSchema),
    defaultValues: { title: "", deepLink: "", isActive: true },
  });

  const deepLinkValue = form.watch("deepLink");
  const deepLinkHasError = !!form.formState.errors.deepLink;
  const canTestLink = !!deepLinkValue && !deepLinkHasError;

  useEffect(() => {
    if (!open) return;
    setImageFile(null);
    setImageError(null);
    setIsDragActive(false);
    if (advertisement) {
      form.reset({
        title: advertisement.title,
        deepLink: advertisement.deepLink,
        isActive: advertisement.isActive,
      });
      setImagePreview(advertisement.image || null);
    } else {
      form.reset({ title: "", deepLink: "", isActive: true });
      setImagePreview(null);
    }
    // Autofocus the first field; Radix returns focus to the trigger on close.
    const timer = window.setTimeout(() => titleInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, advertisement, form]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const applyFile = (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith("image/")) {
      setImageError(t("superAdmin.ads.validation.imageInvalidType"));
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setImageError(t("superAdmin.ads.validation.imageTooLarge", { size: MAX_SIZE_MB }));
      return;
    }
    setImageFile(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    applyFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (isPending) return;
    applyFile(e.dataTransfer.files?.[0]);
  };

  /** Cancels a newly picked (not-yet-saved) file, reverting to the current/original image. */
  const handleRemoveImage = (e: MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImageError(null);
    setImagePreview(advertisement?.image || null);
  };

  const onSubmit = async (values: AdvertisementFormValues) => {
    if (!isEdit && !imageFile) {
      setImageError(t("superAdmin.ads.validation.imageRequired"));
      return;
    }

    try {
      if (isEdit && advertisement) {
        await updateMutation.mutateAsync({
          id: advertisement.id,
          input: { ...values, image: imageFile ?? undefined },
        });
        toast.success(t("superAdmin.ads.toasts.updated"));
      } else {
        await createMutation.mutateAsync({ ...values, image: imageFile as File });
        toast.success(t("superAdmin.ads.toasts.created"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("superAdmin.ads.form.editTitle") : t("superAdmin.ads.form.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="advertisement-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto ps-1 pe-2 space-y-6"
          >
            <div className="flex flex-col items-center gap-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isPending) setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleDrop}
                aria-disabled={isPending}
                className={`group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed bg-[var(--color-surface-2)] transition-colors ${
                  isDragActive
                    ? "border-[var(--color-brand-orange)] bg-[color-mix(in_srgb,var(--color-brand-orange)_8%,var(--color-surface-2))]"
                    : "border-[var(--color-divider)] hover:border-[var(--color-brand-orange)]"
                } ${isPending ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-ink-body)]/0 opacity-0 transition-opacity duration-150 group-hover:bg-[var(--color-ink-body)]/40 group-hover:opacity-100">
                      <span className="text-xs font-medium text-white">
                        {t("superAdmin.ads.form.imageChange")}
                      </span>
                    </div>
                    {imageFile && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-xs"
                        onClick={handleRemoveImage}
                        disabled={isPending}
                        aria-label={t("superAdmin.ads.form.imageRemove")}
                        className="absolute end-1.5 top-1.5"
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-4 text-center text-[var(--color-muted)]">
                    <ImagePlus className="h-6 w-6" aria-hidden />
                    <span className="text-xs">{t("superAdmin.ads.form.imagePlaceholder")}</span>
                    <span className="text-[11px]">{t("superAdmin.ads.form.imageDragHint")}</span>
                  </div>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                tabIndex={-1}
                aria-hidden
              />
              {imageFile && (
                <p className="text-xs text-[var(--color-muted)]">
                  {imageFile.name} · {formatFileSize(imageFile.size)}
                </p>
              )}
              {imageError && (
                <p role="alert" className="text-xs text-[var(--color-danger-500)]">
                  {imageError}
                </p>
              )}
              <p className="text-[11px] text-[var(--color-muted)]">
                {t("superAdmin.ads.form.imageHint", { size: MAX_SIZE_MB })}
              </p>
            </div>

            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.ads.form.titleLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      ref={(el) => {
                        field.ref(el);
                        titleInputRef.current = el;
                      }}
                      placeholder={t("superAdmin.ads.form.titlePlaceholder")}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && t(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="deepLink"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.ads.form.deepLinkLabel")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        {...field}
                        dir="ltr"
                        placeholder={t("superAdmin.ads.form.deepLinkPlaceholder")}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={!canTestLink}
                        onClick={() => window.open(deepLinkValue, "_blank", "noopener,noreferrer")}
                        aria-label={t("superAdmin.ads.form.testLink")}
                        title={t("superAdmin.ads.form.testLink")}
                      >
                        <ExternalLink className="size-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage>{fieldState.error?.message && t(fieldState.error.message)}</FormMessage>
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-divider)] p-4">
                  <div className="flex flex-col gap-0.5">
                    <FormLabel className="text-sm">{t("superAdmin.ads.form.isActive")}</FormLabel>
                    <p className="text-xs text-[var(--color-muted)]">
                      {field.value
                        ? t("superAdmin.ads.form.isActiveHintOn")
                        : t("superAdmin.ads.form.isActiveHintOff")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <div className="flex items-center justify-end gap-2 border-t pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button form="advertisement-form" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isPending ? t("superAdmin.ads.form.saving") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
