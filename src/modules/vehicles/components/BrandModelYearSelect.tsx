import { useEffect } from "react";
import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Select } from "@shared/components/ui/select";
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
              id="brand"
              value={field.value || ""}
              invalid={!!errors.brandId}
              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
              disabled={brandsQuery.isLoading}
            >
              <option value="">{t("common.select")}</option>
              {brandsQuery.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
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
              id="model"
              value={field.value || ""}
              invalid={!!errors.modelId}
              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
              disabled={!brandId || modelsQuery.isFetching}
            >
              <option value="">
                {!brandId ? t("vehicles.pickBrandFirst") : t("common.select")}
              </option>
              {modelsQuery.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
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
              id="year"
              value={field.value || ""}
              invalid={!!errors.year}
              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
              disabled={!modelId || yearsQuery.isFetching}
            >
              <option value="">
                {!modelId ? t("vehicles.pickModelFirst") : t("common.select")}
              </option>
              {yearsQuery.data?.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
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
