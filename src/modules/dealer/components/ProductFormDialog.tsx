/**
 * @file ProductFormDialog.tsx
 *
 * Product create / edit dialog using the provider design system.
 * ProviderDialog shell, ProviderInput / ProviderTextarea / ProviderSelect /
 * ProviderImageUpload replace the old admin-flavoured controls.
 * Category selection uses CategoryCascader (3-level L1→L2→L3) instead of a flat select.
 * Form logic (react-hook-form + zod, mutations, reset-on-open) is unchanged.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Tag, Hash, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProviderDialog,
  ProviderInput,
  ProviderTextarea,
  ProviderSelect,
  ProviderImageUpload,
} from "@shared/provider-ui";
import type { ProviderSelectOption } from "@shared/provider-ui";
import { CategoryCascader } from "@shared/provider-ui/CategoryCascader";
import type { ServiceCategory } from "@modules/services/types";
import { useCreateProductMutation, useUpdateProductMutation } from "../hooks/useDealerMutations";
import { productSchema, type ProductFormValues } from "../schemas/productSchema";
import type { Product } from "../types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  mode: "create" | "edit";
  product?: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Full flat list of ServiceCategory records for the cascader. */
  categories: ServiceCategory[];
}

export function ProductFormDialog({ mode, product, open, onOpenChange, categories }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      sku: "",
      categoryId: "",
      price: 0,
      stockQty: 0,
      condition: "new",
      status: "draft",
      descriptionAr: "",
      descriptionEn: "",
      images: [],
    },
  });

  const categoryId = watch("categoryId");
  const status = watch("status");
  const images = watch("images");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && product) {
        reset({
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          sku: product.sku,
          categoryId: product.categoryId,
          price: product.price,
          stockQty: product.stockQty,
          condition: product.condition,
          status: product.status,
          descriptionAr: product.descriptionAr || "",
          descriptionEn: product.descriptionEn || "",
          images: product.images || [],
        });
      } else {
        reset({
          nameAr: "",
          nameEn: "",
          sku: "",
          categoryId: "",
          price: 0,
          stockQty: 0,
          condition: "new",
          status: "active",
          descriptionAr: "",
          descriptionEn: "",
          images: [],
        });
      }
    }
  }, [open, mode, product, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success(t("common.saved"));
      } else if (mode === "edit" && product) {
        await updateMutation.mutateAsync({ id: product.id, payload: data });
        toast.success(t("common.saved"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  const statusOptions: ProviderSelectOption[] = [
    { value: "active",       label: t("dealer.status.product.active") },
    { value: "draft",        label: t("dealer.status.product.draft") },
    { value: "out_of_stock", label: t("dealer.status.product.out_of_stock") },
    { value: "archived",     label: t("dealer.status.product.archived") },
  ];

  return (
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
      size="lg"
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
        {/* Names row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProviderInput
            id="nameAr"
            label={`${t("dealer.products.form.nameAr")} *`}
            error={errors.nameAr ? t(errors.nameAr.message!) : undefined}
            leadingIcon={<Tag className="h-4 w-4" aria-hidden />}
            disabled={isPending}
            {...register("nameAr")}
          />
          <ProviderInput
            id="nameEn"
            dir="ltr"
            label={`${t("dealer.products.form.nameEn")} *`}
            error={errors.nameEn ? t(errors.nameEn.message!) : undefined}
            leadingIcon={<Tag className="h-4 w-4" aria-hidden />}
            className="text-left"
            disabled={isPending}
            {...register("nameEn")}
          />
        </div>

        {/* SKU row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProviderInput
            id="sku"
            dir="ltr"
            label={`${t("dealer.products.form.sku")} *`}
            error={errors.sku ? t(errors.sku.message!) : undefined}
            leadingIcon={<Hash className="h-4 w-4" aria-hidden />}
            className="text-left"
            disabled={isPending}
            {...register("sku")}
          />
        </div>

        {/* Category — three-level cascader (dealer providerType scope) */}
        {/*
         * String↔number bridge: Product.categoryId is stored as a string (e.g. "215").
         * CategoryCascader works with numeric ids internally.
         * value:    convert stored string → number | null at the cascader boundary.
         * onChange: convert selected number back → string before storing in form state.
         * The form's zod schema validates categoryId as a non-empty string; since the
         * cascader only fires onChange when L3 is chosen, an empty string means no leaf
         * was selected and validation will fail with categoryL3Required.
         */}
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-ink-body)]">
            {t("dealer.products.form.category")} *
          </p>
          <CategoryCascader
            categories={categories}
            providerType="dealer"
            value={categoryId ? Number(categoryId) : null}
            onChange={(id) => setValue("categoryId", String(id), { shouldValidate: true })}
            error={errors.categoryId ? t(errors.categoryId.message!) : undefined}
            disabled={isPending}
          />
        </div>

        {/* Price + Stock row */}
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
            id="stockQty"
            type="number"
            dir="ltr"
            label={`${t("dealer.products.form.stock")} *`}
            error={errors.stockQty ? t(errors.stockQty.message!) : undefined}
            leadingIcon={<Package className="h-4 w-4" aria-hidden />}
            className="text-left"
            disabled={isPending}
            {...register("stockQty", { valueAsNumber: true })}
          />
        </div>

        {/* Status row (half-width) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProviderSelect
            id="status"
            label={`${t("dealer.products.form.status")} *`}
            value={status}
            onValueChange={(val) =>
              setValue("status", val as ProductFormValues["status"], { shouldValidate: true })
            }
            options={statusOptions}
            placeholder={t("common.select")}
            error={errors.status ? t(errors.status.message!) : undefined}
            disabled={isPending}
          />
        </div>

        {/* Image upload */}
        <ProviderImageUpload
          label={t("dealer.products.form.images")}
          dropLabel={t("dealer.products.form.dropImage")}
          hint={t("dealer.products.form.imageHint")}
          value={images}
          onChange={(urls) => setValue("images", urls as string[], { shouldValidate: true })}
          multiple
          maxSizeMB={8}
        />

        {/* Descriptions */}
        <ProviderTextarea
          id="descriptionAr"
          label={`${t("dealer.products.form.descriptionAr")} (${t("common.optional")})`}
          rows={3}
          disabled={isPending}
          {...register("descriptionAr")}
        />
        <ProviderTextarea
          id="descriptionEn"
          dir="ltr"
          label={`${t("dealer.products.form.descriptionEn")} (${t("common.optional")})`}
          className="text-left"
          rows={3}
          disabled={isPending}
          {...register("descriptionEn")}
        />
      </form>
    </ProviderDialog>
  );
}
