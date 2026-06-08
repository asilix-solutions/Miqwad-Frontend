import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@shared/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import {
  providerServiceSchema,
  type ProviderServiceFormValues,
} from "../schemas/providers.schemas";
import {
  useServiceCategoriesQuery,
  useServiceSubcategoriesQuery,
} from "@modules/services/hooks/useServicesQueries";
import type { ProviderService } from "../types";

/**
 * Shared Add/Edit form for a single provider service.
 *
 * DRY: same component for both routes, only the submit label and
 * the default values change. The Category → Subcategory cascade
 * mirrors the Brand → Model selector from Sprint 2.
 */
interface Props {
  defaultValues?: ProviderService | null;
  onSubmit: (values: ProviderServiceFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel: string;
}

export function ProviderServiceForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const form = useForm<ProviderServiceFormValues>({
    resolver: zodResolver(providerServiceSchema),
    defaultValues: toFormValues(defaultValues),
  });
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const categoriesQ = useServiceCategoriesQuery();
  const categoryId = watch("categoryId");
  const validCategoryId = Number.isFinite(categoryId) && categoryId > 0 ? categoryId : null;
  const subcategoriesQ = useServiceSubcategoriesQuery(validCategoryId);

  // Hydrate when defaultValues finally arrive (Edit page).
  useEffect(() => {
    if (defaultValues) reset(toFormValues(defaultValues));
  }, [defaultValues, reset]);

  const onValid = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={onValid} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">{t("providers.services.fields.name")}</Label>
          <Input
            id="name"
            placeholder={t("providers.services.fields.namePlaceholder")}
            invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-danger-500">
              {t(errors.name.message ?? "common.requiredField")}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="categoryId">{t("providers.services.fields.category")}</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={Number.isNaN(field.value) ? "none" : String(field.value)}
                onValueChange={(v) => {
                  field.onChange(v === "none" ? Number.NaN : Number(v));
                  setValue("subcategoryId", null);
                }}
              >
                <SelectTrigger
                  id="categoryId"
                  aria-invalid={!!errors.categoryId}
                  className="w-full"
                >
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.select")}</SelectItem>
                  {categoriesQ.data?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {isAr ? c.nameAr : c.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <p className="mt-1 text-xs text-danger-500">
              {t(errors.categoryId.message ?? "common.requiredField")}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="subcategoryId">
            {t("providers.services.fields.subcategory")}{" "}
            <span className="text-ink-400 text-xs">({t("common.optional")})</span>
          </Label>
          <Controller
            control={control}
            name="subcategoryId"
            render={({ field }) => (
              <Select
                value={field.value === null ? "none" : String(field.value)}
                onValueChange={(v) => {
                  field.onChange(v === "none" ? null : Number(v));
                }}
                disabled={!validCategoryId || subcategoriesQ.isLoading}
              >
                <SelectTrigger
                  id="subcategoryId"
                  aria-invalid={!!errors.subcategoryId}
                  className="w-full"
                >
                  <SelectValue
                    placeholder={
                      !validCategoryId
                        ? t("providers.services.pickCategoryFirst")
                        : t("common.select")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {!validCategoryId
                      ? t("providers.services.pickCategoryFirst")
                      : t("common.select")}
                  </SelectItem>
                  {subcategoriesQ.data?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {isAr ? s.nameAr : s.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="price">{t("providers.services.fields.price")}</Label>
          <Input
            id="price"
            inputMode="decimal"
            placeholder="0"
            invalid={!!errors.price}
            {...register("price", {
              setValueAs: (v: unknown) =>
                v === "" || v === null || v === undefined
                  ? Number.NaN
                  : Number(v),
            })}
          />
          {errors.price && (
            <p className="mt-1 text-xs text-danger-500">
              {t(errors.price.message ?? "providers.services.invalidPrice")}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="estimatedDuration">
            {t("providers.services.fields.duration")}{" "}
            <span className="text-ink-400 text-xs">({t("common.optional")})</span>
          </Label>
          <Input
            id="estimatedDuration"
            inputMode="numeric"
            placeholder={t("providers.services.fields.durationPlaceholder")}
            invalid={!!errors.estimatedDuration}
            {...register("estimatedDuration", {
              setValueAs: (v: unknown) =>
                v === "" || v === null || v === undefined
                  ? null
                  : Number(v),
            })}
          />
          {errors.estimatedDuration && (
            <p className="mt-1 text-xs text-danger-500">
              {t(errors.estimatedDuration.message ?? "providers.services.invalidDuration")}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">
            {t("providers.services.fields.description")}{" "}
            <span className="text-ink-400 text-xs">({t("common.optional")})</span>
          </Label>
          <Textarea
            id="description"
            rows={3}
            placeholder={t("providers.services.fields.descriptionPlaceholder")}
            {...register("description")}
          />
        </div>
      </div>

      {categoriesQ.isLoading && <LoadingState />}

      <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-6 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? t("common.loading") : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function toFormValues(s: ProviderService | null | undefined): ProviderServiceFormValues {
  return {
    name: s?.name ?? "",
    description: s?.description ?? "",
    // Use NaN to represent "no value yet" — Zod will surface the
    // required/invalid_type error on submit instead of falsely
    // treating `0` as a valid price.
    price: s?.price ?? Number.NaN,
    estimatedDuration: s?.estimatedDuration ?? null,
    categoryId: s?.categoryId ?? Number.NaN,
    subcategoryId: s?.subcategoryId ?? null,
  };
}
