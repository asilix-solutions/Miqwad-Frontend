/**
 * @file PartFormDialog.tsx
 *
 * Scrap spare part create / edit dialog.
 * Allows scrap yard providers to add catalog-backed spare parts into their active inventory
 * with unit pricing, stock quantity, vehicle compatibility fitment, images, and notes.
 *
 * UX Redesign Iteration 2:
 * - Structured information hierarchy: Item Selection -> Pricing & Stock -> Details -> Images
 * - Clean currency affix container completely isolated from numeric input text area
 * - Dedicated tactile quantity stepper with unit indicator and keyboard entry
 * - Inviting catalog picker CTA and anchored confirmed item card
 * - Responsive 2-column pricing & stock layout with size="lg" breathing room
 * - Full RTL/LTR compliance with clear required asterisks and localized inline errors
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Loader2,
  Lock,
  Search,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProviderCurrencyInput,
  ProviderDialog,
  ProviderInput,
  ProviderQuantityInput,
  ProviderTextarea,
} from "@shared/provider-ui";
import {
  providerServiceSchema as partSchema,
  ProviderServiceImagesPicker,
  type ProviderServiceFormValues as PartFormValues,
  type ProviderService,
  type ServiceCatalogItem,
} from "@shared/provider-services";
import {
  useScrapPartsQuery,
  useCreateScrapPartMutation,
  useUpdateScrapPartMutation,
} from "../hooks/useScrapPartsQueries";
import { useToast } from "@shared/components/ui/toastContext";
import { PartServicePicker } from "./PartServicePicker";
import { cn } from "@shared/lib/utils";

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
    defaultValues: {
      serviceId: "",
      quantity: 1,
      price: 0,
      notes: "",
      isCompatibleWith: "",
      files: [],
    },
  });

  const files = watch("files") ?? [];
  const quantityValue = watch("quantity") ?? 1;

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
          mode === "create"
            ? t("scrap.parts.form.createSubtitle")
            : t("scrap.parts.form.editSubtitle")
        }
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="min-w-[100px]"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="part-form"
              disabled={isPending}
              className="min-w-[130px] bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)]"
            >
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {t("common.loading")}
                </>
              ) : mode === "create" ? (
                t("scrap.parts.form.saveBtn")
              ) : (
                t("common.save")
              )}
            </Button>
          </div>
        }
      >
        <form
          id="part-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          dir={i18n.dir()}
        >
          {/* ── Section 1: Item Identity & Catalog Selection ──────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("scrap.parts.form.sectionItem")}
                <span
                  className="ms-1 font-bold text-[var(--color-danger-500)] select-none"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>
              <span className="text-xs text-[var(--color-muted)]">
                {t("scrap.parts.form.sectionItemSubtitle")}
              </span>
            </div>

            {selectedServiceName ? (
              /* Selected State Card */
              <div
                className={cn(
                  "flex items-center justify-between gap-3.5 rounded-[var(--radius-md)] border p-3.5 shadow-xs transition-all",
                  mode === "edit"
                    ? "border-[var(--color-divider)] bg-[var(--color-surface-2)]"
                    : "border-[var(--color-brand-orange)]/40 bg-[var(--color-brand-50)]/30 hover:border-[var(--color-brand-orange)]",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-orange)]/10 text-[var(--color-brand-orange)]">
                    <Wrench className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--color-ink-body)]">
                        {selectedServiceName}
                      </p>
                      <span className="hidden items-center gap-1 rounded-full bg-[var(--color-success-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-success-500)] sm:inline-flex">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        {t("scrap.parts.form.verifiedCatalogItem")}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {mode === "edit"
                        ? t("scrap.parts.form.immutableHint")
                        : t("scrap.parts.form.selectedItem")}
                    </p>
                  </div>
                </div>

                {mode === "create" && !isPending && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                    className="h-8 shrink-0 text-xs font-medium text-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/10 hover:text-[var(--color-brand-orange-hover)]"
                  >
                    {t("scrap.parts.form.changeItem")}
                  </Button>
                )}

                {mode === "edit" && (
                  <div className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-muted)]">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                )}
              </div>
            ) : (
              /* Empty Call to Action Card */
              <button
                type="button"
                disabled={mode === "edit" || isPending}
                onClick={() => setPickerOpen(true)}
                aria-required="true"
                className={cn(
                  "group flex w-full items-center justify-between gap-4 rounded-[var(--radius-md)] border-2 border-dashed p-4 text-start transition-all",
                  errors.serviceId
                    ? "border-[var(--color-danger-500)] bg-[var(--color-danger-50)]/30"
                    : "border-[var(--color-divider)] bg-[var(--color-surface)] hover:border-[var(--color-brand-orange)] hover:bg-[var(--color-brand-50)]/20",
                )}
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface-2)] text-[var(--color-brand-orange)] shadow-xs transition-transform group-hover:scale-105">
                    <Search className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-ink-body)] transition-colors group-hover:text-[var(--color-brand-orange)]">
                      {t("scrap.parts.form.selectPrompt")}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                      {t("scrap.parts.form.servicePlaceholder")}
                    </p>
                  </div>
                </div>

                <span className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-secondary)] shadow-xs transition-colors group-hover:border-[var(--color-brand-orange)] group-hover:text-[var(--color-brand-orange)]">
                  <span>{t("scrap.parts.form.browseCatalog")}</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </button>
            )}

            {errors.serviceId && (
              <p role="alert" className="text-xs font-medium text-[var(--color-danger-500)]">
                {t(errors.serviceId.message!)}
              </p>
            )}
          </div>

          {/* ── Section 2: Pricing and Inventory Stock ────────────────────── */}
          <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 p-4">
            <div className="flex items-center gap-2 border-b border-[var(--color-divider)] pb-2.5">
              <CircleDollarSign
                className="h-4 w-4 text-[var(--color-brand-orange)]"
                aria-hidden="true"
              />
              <div className="flex min-w-0 items-baseline gap-2">
                <h3 className="text-sm font-semibold text-[var(--color-ink-body)]">
                  {t("scrap.parts.form.sectionPricing")}
                </h3>
                <span className="text-xs text-[var(--color-muted)]">
                  {t("scrap.parts.form.sectionPricingSubtitle")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProviderCurrencyInput
                id="price"
                required
                label={t("scrap.parts.form.price")}
                unitContext={t("scrap.parts.form.unit", "قطعة")}
                currencyLabel={t("common.sar", "ر.س")}
                hint={t("scrap.parts.form.pricePerUnit")}
                error={errors.price ? t(errors.price.message!) : undefined}
                disabled={isPending}
                {...register("price", { valueAsNumber: true })}
              />

              <ProviderQuantityInput
                id="quantity"
                required
                min={1}
                label={t("scrap.parts.form.quantity")}
                unitLabel={t("scrap.parts.form.unit", "قطعة")}
                hint={t("scrap.parts.form.stockUnits")}
                value={quantityValue}
                onValueChange={(val) => setValue("quantity", val, { shouldValidate: true })}
                decreaseAriaLabel={t("common.decreaseQuantity")}
                increaseAriaLabel={t("common.increaseQuantity")}
                error={errors.quantity ? t(errors.quantity.message!) : undefined}
                disabled={isPending}
                {...register("quantity", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* ── Section 3: Specifications & Additional Details ────────────── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--color-divider)] pb-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />
              <div className="flex min-w-0 items-baseline gap-2">
                <h3 className="text-sm font-semibold text-[var(--color-ink-body)]">
                  {t("scrap.parts.form.sectionDetails")}{" "}
                  <span className="text-xs font-normal text-[var(--color-muted)]">
                    ({t("common.optional")})
                  </span>
                </h3>
                <span className="hidden text-xs text-[var(--color-muted)] sm:inline">
                  {t("scrap.parts.form.sectionDetailsSubtitle")}
                </span>
              </div>
            </div>

            <ProviderInput
              id="isCompatibleWith"
              label={t("scrap.parts.form.isCompatibleWith")}
              placeholder={t("scrap.parts.form.isCompatibleWithPlaceholder")}
              hint={t("scrap.parts.form.isCompatibleWithHint")}
              error={errors.isCompatibleWith ? t(errors.isCompatibleWith.message!) : undefined}
              disabled={isPending}
              {...register("isCompatibleWith")}
            />

            <ProviderTextarea
              id="notes"
              label={t("scrap.parts.form.notes")}
              placeholder={t("scrap.parts.form.notesPlaceholder")}
              hint={t("scrap.parts.form.notesHint")}
              rows={3}
              error={errors.notes ? t(errors.notes.message!) : undefined}
              disabled={isPending}
              {...register("notes")}
            />
          </div>

          {/* ── Section 4: Visual Verification & Images ───────────────────── */}
          <div className="space-y-2 border-t border-[var(--color-divider)] pt-4">
            <ProviderServiceImagesPicker
              existingImages={mode === "edit" && part ? part.images : []}
              files={files}
              onFilesChange={(next) => setValue("files", next, { shouldValidate: true })}
              disabled={isPending}
            />
          </div>
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
