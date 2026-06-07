import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@shared/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  vehicleSchema,
  type VehicleFormValues,
} from "../schemas/vehicles.schemas";
import type { Vehicle } from "../types";
import { BrandModelYearSelect } from "./BrandModelYearSelect";

interface Props {
  /** Pre-existing values when editing. */
  defaultValues?: Vehicle | null;
  onSubmit: (values: VehicleFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel: string;
}

/**
 * Shared form component used by both Add and Edit pages.
 *
 * Centralising the form here gives us:
 *   - One Zod schema in one place
 *   - One layout / accessibility pass to maintain
 *   - DRY between two large pages
 *
 * Mileage / cost-style numeric fields are typed as `number` in the schema
 * but we render them with type="text" + inputMode="numeric" to avoid the
 * spinner UI and accept empty strings as "not provided".
 */
export function VehicleForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: Props) {
  const { t } = useTranslation();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: toFormValues(defaultValues),
  });
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  // When `defaultValues` (the loaded vehicle on Edit page) arrives, populate.
  useEffect(() => {
    if (defaultValues) {
      reset(toFormValues(defaultValues));
    }
  }, [defaultValues, reset]);

  const onValid = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={onValid} className="space-y-8" noValidate>
      {/* ---- Basic info -------------------------------------------------- */}
      <section className="space-y-4">
        <header>
          <h3 className="font-display text-base font-semibold text-ink-900">
            {t("vehicles.sections.basicInfo")}
          </h3>
        </header>

        <BrandModelYearSelect
          control={control}
          watch={watch}
          setValue={setValue}
          errors={errors}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="plate">{t("vehicles.fields.plate")}</Label>
            <Input
              id="plate"
              placeholder={t("vehicles.fields.platePlaceholder")}
              invalid={!!errors.plateNumber}
              {...register("plateNumber")}
            />
            {errors.plateNumber && (
              <p className="mt-1 text-xs text-danger-500">
                {t(errors.plateNumber.message ?? "common.requiredField")}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="nickname">
              {t("vehicles.fields.nickname")}{" "}
              <span className="text-ink-400 text-xs">({t("common.optional")})</span>
            </Label>
            <Input
              id="nickname"
              placeholder={t("vehicles.fields.nicknamePlaceholder")}
              invalid={!!errors.nickname}
              {...register("nickname")}
            />
          </div>
        </div>
      </section>

      {/* ---- More details (optional) ------------------------------------ */}
      <section className="space-y-4">
        <header>
          <h3 className="font-display text-base font-semibold text-ink-900">
            {t("vehicles.sections.moreDetails")}
          </h3>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="color">{t("vehicles.fields.color")}</Label>
            <Input
              id="color"
              placeholder={t("vehicles.fields.colorPlaceholder")}
              {...register("color")}
            />
          </div>
          <div>
            <Label htmlFor="mileage">{t("vehicles.fields.mileage")}</Label>
            <Input
              id="mileage"
              inputMode="numeric"
              placeholder={t("vehicles.fields.mileagePlaceholder")}
              invalid={!!errors.mileage}
              {...register("mileage", {
                setValueAs: (v: unknown) => {
                  if (v === "" || v === null || v === undefined) return undefined;
                  const n = Number(v);
                  return Number.isFinite(n) ? n : undefined;
                },
              })}
            />
            {errors.mileage && (
              <p className="mt-1 text-xs text-danger-500">{t(errors.mileage.message ?? "")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="vin">{t("vehicles.fields.vin")}</Label>
            <Input
              id="vin"
              placeholder={t("vehicles.fields.vinPlaceholder")}
              invalid={!!errors.vin}
              {...register("vin")}
            />
            {errors.vin && (
              <p className="mt-1 text-xs text-danger-500">{t(errors.vin.message ?? "")}</p>
            )}
          </div>
          <div>
            <Label htmlFor="registrationDate">{t("vehicles.fields.registrationDate")}</Label>
            <Input
              id="registrationDate"
              type="date"
              {...register("registrationDate")}
            />
          </div>

          <div>
            <Label htmlFor="fuelType">{t("vehicles.fields.fuelType")}</Label>
            <Select id="fuelType" {...register("fuelType")}>
              <option value="">{t("common.select")}</option>
              <option value="gasoline">{t("vehicles.fields.fuelGasoline")}</option>
              <option value="diesel">{t("vehicles.fields.fuelDiesel")}</option>
              <option value="hybrid">{t("vehicles.fields.fuelHybrid")}</option>
              <option value="electric">{t("vehicles.fields.fuelElectric")}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="imageUrl">
              {t("vehicles.fields.image")}{" "}
              <span className="text-ink-400 text-xs">({t("common.optional")})</span>
            </Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://…"
              {...register("imageUrl")}
            />
          </div>
        </div>
      </section>

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

/**
 * Convert a server-shaped Vehicle into the form's expected value shape.
 * Nulls become empty strings / undefined so RHF can render them properly.
 */
function toFormValues(v: Vehicle | null | undefined): VehicleFormValues {
  return {
    brandId: v?.brandId ?? 0,
    modelId: v?.modelId ?? 0,
    year: v?.year ?? 0,
    plateNumber: v?.plateNumber ?? "",
    nickname: v?.nickname ?? "",
    color: v?.color ?? "",
    mileage: v?.mileage ?? undefined,
    vin: v?.vin ?? "",
    registrationDate: v?.registrationDate ?? "",
    fuelType: v?.fuelType ?? undefined,
    imageUrl: v?.imageUrl ?? "",
  };
}
