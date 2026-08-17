/**
 * @file PartFormDialog.tsx
 *
 * Scrap "part" create / edit dialog. A scrap part is a thin wrapper around
 * the admin service catalog — ADD mode opens the {@link PartServicePicker}
 * to choose a serviceId, then price/quantity/notes; EDIT mode shows the
 * chosen service read-only (serviceId is immutable after create — PUT only
 * accepts quantity/price/notes).
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ChevronDown, DollarSign, Hash, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderDialog, ProviderInput, ProviderTextarea } from "@shared/provider-ui";
import {
  providerServiceSchema as partSchema,
  ProviderServiceImagesPicker,
  type ProviderServiceFormValues as PartFormValues,
  type ProviderService,
  type ServiceCatalogItem,
} from "@shared/provider-services";
import { useScrapPartsQuery, useCreateScrapPartMutation, useUpdateScrapPartMutation } from "../hooks/useScrapPartsQueries";
import { useToast } from "@shared/components/ui/toastContext";
import { PartServicePicker } from "./PartServicePicker";

interface Props {
  mode: "create" | "edit";
  part?: ProviderService;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartFormDialog({ mode, part, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const partsQuery = useScrapPartsQuery();
  const createMutation = useCreateScrapPartMutation();
  const updateMutation = useUpdateScrapPartMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedServiceName, setSelectedServiceName] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    reset,
    watch,
    formState: { errors },
  } = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: { serviceId: "", quantity: 1, price: 0, notes: "", isCompatibleWith: "", files: [] },
  });

  const files = watch("files") ?? [];

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && part) {
      reset({
        serviceId: part.serviceId,
        quantity: part.quantity,
        price: part.price,
        notes: part.notes ?? "",
        isCompatibleWith: part.isCompatibleWith ?? "",
        files: [],
      });
      setSelectedServiceName(part.serviceName);
    } else {
      reset({ serviceId: "", quantity: 1, price: 0, notes: "", isCompatibleWith: "", files: [] });
      setSelectedServiceName("");
    }
  }, [open, mode, part, reset]);

  // Services already offered — excludes the row being edited so its own service isn't self-disabled.
  const existingServiceIds = new Set(
    (partsQuery.data?.items ?? [])
      .filter((p) => !(mode === "edit" && part && p.id === part.id))
      .map((p) => p.serviceId),
  );

  const handleServiceSelect = (service: ServiceCatalogItem) => {
    setValue("serviceId", service.id, { shouldValidate: true });
    setSelectedServiceName(service.name);
    setPickerOpen(false);
    setFocus("price");
  };

  const onSubmit = async (data: PartFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success(t("common.saved"));
      } else if (mode === "edit" && part) {
        await updateMutation.mutateAsync({ id: part.id, values: data });
        toast.success(t("common.saved"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  return (
    <>
      <ProviderDialog
        open={open}
        onOpenChange={(val) => !isPending && onOpenChange(val)}
        blurBackdrop
        title={
          mode === "create" ? t("scrap.parts.form.createTitle") : t("scrap.parts.form.editTitle")
        }
        description={
          mode === "create" ? t("scrap.parts.form.createSubtitle") : t("scrap.parts.form.editSubtitle")
        }
        size="md"
        footer={
          <>
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
              form="part-form"
              disabled={isPending}
              className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)]"
            >
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </>
        }
      >
        <form
          id="part-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          dir={i18n.dir()}
        >
          {/* Service picker trigger */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-[var(--color-ink-body)]">
              {t("scrap.parts.form.service")} *
            </p>
            <button
              type="button"
              disabled={mode === "edit" || isPending}
              onClick={() => setPickerOpen(true)}
              className={[
                "flex h-[var(--size-input-h)] w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border px-3 text-sm transition-colors duration-[var(--dur-fast)]",
                mode === "edit"
                  ? "cursor-not-allowed border-[var(--color-divider)] bg-[var(--color-surface-2)]"
                  : errors.serviceId
                    ? "border-[var(--color-danger-500)]"
                    : "border-[var(--color-divider)] bg-[var(--color-surface)] hover:border-[var(--color-brand-orange)]",
              ].join(" ")}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Wrench className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden />
                <span
                  className={
                    selectedServiceName
                      ? "truncate text-[var(--color-ink-body)]"
                      : "truncate text-[var(--color-muted)]"
                  }
                >
                  {selectedServiceName || t("scrap.parts.form.servicePlaceholder")}
                </span>
              </span>
              {mode === "create" && (
                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden />
              )}
            </button>
            {errors.serviceId && (
              <p role="alert" className="mt-1 text-xs text-[var(--color-danger-500)]">
                {t(errors.serviceId.message!)}
              </p>
            )}
          </div>

          {/* Price + Quantity row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProviderInput
              id="price"
              type="number"
              step="1"
              dir="ltr"
              label={`${t("scrap.parts.form.price")} (SAR) *`}
              error={errors.price ? t(errors.price.message!) : undefined}
              leadingIcon={<DollarSign className="h-4 w-4" aria-hidden />}
              className="text-left"
              disabled={isPending}
              {...register("price", { valueAsNumber: true })}
            />
            <ProviderInput
              id="quantity"
              type="number"
              dir="ltr"
              label={`${t("scrap.parts.form.quantity")} *`}
              error={errors.quantity ? t(errors.quantity.message!) : undefined}
              leadingIcon={<Hash className="h-4 w-4" aria-hidden />}
              className="text-left"
              disabled={isPending}
              {...register("quantity", { valueAsNumber: true })}
            />
          </div>

          {/* Vehicle compatibility */}
          <ProviderInput
            id="isCompatibleWith"
            label={`${t("scrap.parts.form.isCompatibleWith")} (${t("common.optional")})`}
            placeholder={t("scrap.parts.form.isCompatibleWithPlaceholder")}
            hint={t("scrap.parts.form.isCompatibleWithHint")}
            error={errors.isCompatibleWith ? t(errors.isCompatibleWith.message!) : undefined}
            disabled={isPending}
            {...register("isCompatibleWith")}
          />

          {/* Images */}
          <ProviderServiceImagesPicker
            existingImages={mode === "edit" && part ? part.images : []}
            files={files}
            onFilesChange={(next) => setValue("files", next, { shouldValidate: true })}
            disabled={isPending}
          />

          {/* Notes */}
          <ProviderTextarea
            id="notes"
            label={`${t("scrap.parts.form.notes")} (${t("common.optional")})`}
            rows={3}
            disabled={isPending}
            {...register("notes")}
          />
        </form>
      </ProviderDialog>

      {pickerOpen && (
        <PartServicePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          existingServiceIds={existingServiceIds}
          onSelect={handleServiceSelect}
        />
      )}
    </>
  );
}
