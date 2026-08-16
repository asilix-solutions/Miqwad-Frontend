/**
 * @file ProductFormDialog.tsx
 *
 * Dealer "product" create / edit dialog. A dealer product is a thin wrapper
 * around the admin service catalog — ADD mode opens the {@link ServicePicker}
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
import { useDealerProductsQuery } from "../hooks/useDealerQueries";
import { useCreateProductMutation, useUpdateProductMutation } from "../hooks/useDealerMutations";
import { productSchema, type ProductFormValues } from "../schemas/productSchema";
import type { Product, ServiceCatalogItem } from "../types";
import { useToast } from "@shared/components/ui/toastContext";
import { ServicePicker } from "./ServicePicker";

interface Props {
  mode: "create" | "edit";
  product?: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductFormDialog({ mode, product, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const productsQuery = useDealerProductsQuery();
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedServiceName, setSelectedServiceName] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { serviceId: "", quantity: 1, price: 0, notes: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && product) {
      reset({
        serviceId: product.serviceId,
        quantity: product.quantity,
        price: product.price,
        notes: product.notes ?? "",
      });
      setSelectedServiceName(product.serviceName);
    } else {
      reset({ serviceId: "", quantity: 1, price: 0, notes: "" });
      setSelectedServiceName("");
    }
  }, [open, mode, product, reset]);

  // Services already offered — excludes the row being edited so its own service isn't self-disabled.
  const existingServiceIds = new Set(
    (productsQuery.data?.items ?? [])
      .filter((p) => !(mode === "edit" && product && p.id === product.id))
      .map((p) => p.serviceId),
  );

  const handleServiceSelect = (service: ServiceCatalogItem) => {
    setValue("serviceId", service.id, { shouldValidate: true });
    setSelectedServiceName(service.name);
    setPickerOpen(false);
    setFocus("price");
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success(t("common.saved"));
      } else if (mode === "edit" && product) {
        await updateMutation.mutateAsync({ id: product.id, values: data });
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
          mode === "create"
            ? t("dealer.products.form.createTitle")
            : t("dealer.products.form.editTitle")
        }
        description={
          mode === "create"
            ? t("dealer.products.form.createSubtitle")
            : t("dealer.products.form.editSubtitle")
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
              form="product-form"
              disabled={isPending}
              className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)]"
            >
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </>
        }
      >
        <form
          id="product-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          dir={i18n.dir()}
        >
          {/* Service picker trigger */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-[var(--color-ink-body)]">
              {t("dealer.products.form.service")} *
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
                  {selectedServiceName || t("dealer.products.form.servicePlaceholder")}
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
              step="0.01"
              dir="ltr"
              label={`${t("dealer.products.form.price")} (SAR) *`}
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
              label={`${t("dealer.products.form.quantity")} *`}
              error={errors.quantity ? t(errors.quantity.message!) : undefined}
              leadingIcon={<Hash className="h-4 w-4" aria-hidden />}
              className="text-left"
              disabled={isPending}
              {...register("quantity", { valueAsNumber: true })}
            />
          </div>

          {/* Notes */}
          <ProviderTextarea
            id="notes"
            label={`${t("dealer.products.form.notes")} (${t("common.optional")})`}
            rows={3}
            disabled={isPending}
            {...register("notes")}
          />
        </form>
      </ProviderDialog>

      {pickerOpen && (
        <ServicePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          existingServiceIds={existingServiceIds}
          onSelect={handleServiceSelect}
        />
      )}
    </>
  );
}
