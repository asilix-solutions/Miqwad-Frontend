import { useEffect } from "react";
import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@shared/components/ui/spinner";
import { useBrandsQuery, useModelsQuery, useYearsQuery } from "../hooks/useBrandsModels";
import type { VehicleFormValues } from "../schemas/vehicles.schemas";

interface Props {
  control: Control<VehicleFormValues>;
  watch: UseFormWatch<VehicleFormValues>;
  setValue: UseFormSetValue<VehicleFormValues>;
  errors: FieldErrors<VehicleFormValues>;
}

/**
 * Cascading Brand → Model → Year selector.
 *
 * Behaviour:
 *   - Brands load once (long staleTime via `useBrandsQuery`).
 *   - Models load only when a brand has been picked.
 *   - Years load only when both brand + model have been picked.
 *   - Changing brand resets model + year; changing model resets year.
 *     This prevents impossible combinations (e.g. Toyota → Sonata).
 *
 * Validation messages are i18n keys produced by Zod; we translate
 * them at render time so the form stays language-agnostic.
 */
export function BrandModelYearSelect({ control, watch, setValue, errors }: Props) {
  const { t } = useTranslation();
  const brandId = watch("brandId");
  const modelId = watch("modelId");

  const brandsQuery = useBrandsQuery();
  const modelsQuery = useModelsQuery(brandId || null);
  const yearsQuery = useYearsQuery(brandId || null, modelId || null);

  // Reset cascade when the parent changes.
  // We compare against the *current* form values so we don't blow away
  // initial values pre-populated by EditVehiclePage on first render.
  const currentBrand = brandId;
  const currentModel = modelId;

  useEffect(() => {
    // When the model query returns and the previously-selected model
    // doesn't belong to the new brand, clear it.
    if (!modelsQuery.data || !currentModel) return;
    const valid = modelsQuery.data.some((m) => m.id === currentModel);
    if (!valid) {
      setValue("modelId", 0, { shouldValidate: false });
      setValue("year", 0, { shouldValidate: false });
    }
  }, [modelsQuery.data, currentBrand, currentModel, setValue]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Brand */}
      <div>
        <Label htmlFor="brand">{t("vehicles.fields.brand")}</Label>
        <Controller
          name="brandId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ? String(field.value) : "none"}
              onValueChange={(val) => field.onChange(val === "none" ? 0 : Number(val))}
              disabled={brandsQuery.isLoading}
            >
              <SelectTrigger id="brand" aria-invalid={!!errors.brandId}>
                <SelectValue placeholder={t("common.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("common.select")}</SelectItem>
                {brandsQuery.data?.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {brandsQuery.isLoading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
            <Spinner size="sm" /> {t("common.loading")}
          </div>
        )}
        {errors.brandId && (
          <p className="mt-1 text-xs text-danger-500">{t(errors.brandId.message ?? "common.requiredField")}</p>
        )}
      </div>

      {/* Model */}
      <div>
        <Label htmlFor="model">{t("vehicles.fields.model")}</Label>
        <Controller
          name="modelId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ? String(field.value) : "none"}
              onValueChange={(val) => field.onChange(val === "none" ? 0 : Number(val))}
              disabled={!brandId || modelsQuery.isFetching}
            >
              <SelectTrigger id="model" aria-invalid={!!errors.modelId}>
                <SelectValue placeholder={!brandId ? t("vehicles.pickBrandFirst") : t("common.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {!brandId ? t("vehicles.pickBrandFirst") : t("common.select")}
                </SelectItem>
                {modelsQuery.data?.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {modelsQuery.isFetching && brandId > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
            <Spinner size="sm" /> {t("common.loading")}
          </div>
        )}
        {errors.modelId && (
          <p className="mt-1 text-xs text-danger-500">{t(errors.modelId.message ?? "common.requiredField")}</p>
        )}
      </div>

      {/* Year */}
      <div>
        <Label htmlFor="year">{t("vehicles.fields.year")}</Label>
        <Controller
          name="year"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ? String(field.value) : "none"}
              onValueChange={(val) => field.onChange(val === "none" ? 0 : Number(val))}
              disabled={!modelId || yearsQuery.isFetching}
            >
              <SelectTrigger id="year" aria-invalid={!!errors.year}>
                <SelectValue placeholder={!modelId ? t("vehicles.pickModelFirst") : t("common.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {!modelId ? t("vehicles.pickModelFirst") : t("common.select")}
                </SelectItem>
                {yearsQuery.data?.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {yearsQuery.isFetching && modelId > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
            <Spinner size="sm" /> {t("common.loading")}
          </div>
        )}
        {errors.year && (
          <p className="mt-1 text-xs text-danger-500">{t(errors.year.message ?? "common.requiredField")}</p>
        )}
      </div>
    </div>
  );
}
