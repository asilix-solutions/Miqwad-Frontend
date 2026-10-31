/**
 * @file CreateCityDialog.tsx
 * @description Dialog for adding a new city backed by live POST /api/Cities.
 * Supports coordinates entry via Leaflet map picker or manual input,
 * Google Place ID entry with idempotency notification, and form validation.
 */

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import {
  createCitySchema,
  type CreateCityFormValues,
} from "../../schemas/citySchema";
import { useCreateCityMutation } from "../../hooks/useRoadsQueries";
import { CityMapPicker } from "./CityMapPicker";
import { CityGooglePlacesAutocomplete } from "./CityGooglePlacesAutocomplete";
import type { CityPlaceSelection } from "../../types/googlePlaces";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_FORM_VALUES: CreateCityFormValues = {
  name: "",
  countryCode: "SA",
  googlePlaceId: "",
  latitude: undefined,
  longitude: undefined,
};

export function CreateCityDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const createMutation = useCreateCityMutation();
  const isPending = createMutation.isPending;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateCityFormValues>({
    resolver: zodResolver(createCitySchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const rawLat = useWatch({ control, name: "latitude" });
  const rawLng = useWatch({ control, name: "longitude" });
  const currentCountryCode = useWatch({ control, name: "countryCode" }) || "SA";
  const currentGooglePlaceId = useWatch({ control, name: "googlePlaceId" }) || "";

  const latNumber =
    typeof rawLat === "number" && !isNaN(rawLat)
      ? rawLat
      : typeof rawLat === "string" && rawLat.trim() !== "" && !isNaN(Number(rawLat))
        ? Number(rawLat)
        : null;
  const lngNumber =
    typeof rawLng === "number" && !isNaN(rawLng)
      ? rawLng
      : typeof rawLng === "string" && rawLng.trim() !== "" && !isNaN(Number(rawLng))
        ? Number(rawLng)
        : null;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setServerError(null);
      reset(DEFAULT_FORM_VALUES);
    }
    onOpenChange(isOpen);
  };

  const handleMapChange = (lat: number, lng: number) => {
    setValue("latitude", lat, { shouldValidate: true, shouldDirty: true });
    setValue("longitude", lng, { shouldValidate: true, shouldDirty: true });
  };

  const handleSelectPlace = (selection: CityPlaceSelection) => {
    setValue("googlePlaceId", selection.placeId, { shouldValidate: true, shouldDirty: true });
    // Pre-fill / update city name with selected place name, while remaining editable by admin
    setValue("name", selection.name, { shouldValidate: true, shouldDirty: true });
    // Synchronize verified ISO country code from address components
    if (selection.countryCode) {
      setValue("countryCode", selection.countryCode, { shouldValidate: true, shouldDirty: true });
    }
    // Google Places content must NOT be passed into Leaflet/OSM views or persisted
    // as permanent coordinates in City records per Section 6.
  };

  const handlePlaceIdChange = (placeId: string) => {
    setValue("googlePlaceId", placeId, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: CreateCityFormValues) => {
    setServerError(null);

    // Enforce selection invariant in submit handler
    if (!values.googlePlaceId || values.googlePlaceId.trim().length === 0) {
      setServerError(t("superAdmin.cities.validation.googlePlaceIdRequired"));
      return;
    }

    try {
      const lat =
        typeof values.latitude === "number" && !isNaN(values.latitude)
          ? values.latitude
          : typeof values.latitude === "string" && values.latitude.trim() !== "" && !isNaN(Number(values.latitude))
            ? Number(values.latitude)
            : undefined;

      const lng =
        typeof values.longitude === "number" && !isNaN(values.longitude)
          ? values.longitude
          : typeof values.longitude === "string" && values.longitude.trim() !== "" && !isNaN(Number(values.longitude))
            ? Number(values.longitude)
            : undefined;

      const result = await createMutation.mutateAsync({
        name: values.name.trim(),
        countryCode: values.countryCode.trim().toUpperCase(),
        googlePlaceId: values.googlePlaceId.trim(),
        latitude: lat,
        longitude: lng,
      });

      if (result.isExisting) {
        toast.info(t("superAdmin.cities.success.existingRetrieved"));
      } else {
        toast.success(t("superAdmin.cities.success.created"));
      }

      reset(DEFAULT_FORM_VALUES);
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("superAdmin.cities.errors.createFailed");
      setServerError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && handleOpenChange(val)}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[var(--color-ink-body)] flex items-center gap-2">
            <MapPin className="size-5 text-[var(--color-brand-orange)]" />
            {t("superAdmin.cities.form.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {serverError && (
            <div
              role="alert"
              className="rounded-[var(--radius-md)] bg-[var(--color-danger-50,#fef2f2)] border border-[var(--color-danger-200,#fecaca)] p-3 text-xs text-[var(--color-danger-700,#b91c1c)] flex items-start gap-2"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          {/* Google Places City Autocomplete & Place ID */}
          <CityGooglePlacesAutocomplete
            countryCode={currentCountryCode}
            value={currentGooglePlaceId}
            onChange={handlePlaceIdChange}
            onSelectPlace={handleSelectPlace}
            disabled={isPending}
            error={errors.googlePlaceId ? t(errors.googlePlaceId.message as string) : undefined}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* City Name (Editable, confirmed by admin) */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cityName" className="text-xs font-semibold text-[var(--color-ink-body)]">
                {t("superAdmin.cities.form.name")} <span className="text-danger-500">*</span>
              </Label>
              <Input
                id="cityName"
                {...register("name")}
                disabled={isPending}
                placeholder={t("superAdmin.cities.form.namePlaceholder")}
                className="h-10 text-sm"
              />
              <p className="text-[11px] text-[var(--color-muted)]">
                {t("superAdmin.cities.form.nameHelp")}
              </p>
              {errors.name && (
                <p className="text-xs text-danger-500">{t(errors.name.message as string)}</p>
              )}
            </div>

            {/* Country Code */}
            <div className="space-y-1.5">
              <Label htmlFor="countryCode" className="text-xs font-semibold text-[var(--color-ink-body)]">
                {t("superAdmin.cities.form.countryCode")} <span className="text-danger-500">*</span>
              </Label>
              <Input
                id="countryCode"
                dir="ltr"
                className="h-10 text-sm font-mono uppercase text-left"
                {...register("countryCode", {
                  onChange: () => {
                    setValue("googlePlaceId", "", { shouldValidate: true, shouldDirty: true });
                  },
                })}
                disabled={isPending}
                placeholder={t("superAdmin.cities.form.countryCodePlaceholder")}
                maxLength={10}
              />
              <p className="text-[11px] text-[var(--color-muted)]">
                {t("superAdmin.cities.form.countryCodeHelp")}
              </p>
              {errors.countryCode && (
                <p className="text-xs text-danger-500">{t(errors.countryCode.message as string)}</p>
              )}
            </div>
          </div>

          {/* Coordinates Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="latitude" className="text-xs font-semibold text-[var(--color-ink-body)]">
                {t("superAdmin.cities.form.latitude")}
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                dir="ltr"
                className="h-10 text-sm font-mono text-left"
                {...register("latitude")}
                disabled={isPending}
                placeholder={t("superAdmin.cities.form.latitudePlaceholder")}
              />
              <p className="text-[11px] text-[var(--color-muted)]">
                {t("superAdmin.cities.form.latitudeHelp")}
              </p>
              {errors.latitude && (
                <p className="text-xs text-danger-500">{t(errors.latitude.message as string)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="longitude" className="text-xs font-semibold text-[var(--color-ink-body)]">
                {t("superAdmin.cities.form.longitude")}
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                dir="ltr"
                className="h-10 text-sm font-mono text-left"
                {...register("longitude")}
                disabled={isPending}
                placeholder={t("superAdmin.cities.form.longitudePlaceholder")}
              />
              <p className="text-[11px] text-[var(--color-muted)]">
                {t("superAdmin.cities.form.longitudeHelp")}
              </p>
              {errors.longitude && (
                <p className="text-xs text-danger-500">{t(errors.longitude.message as string)}</p>
              )}
            </div>
          </div>

          {/* Interactive Map Picker */}
          <CityMapPicker
            latitude={latNumber}
            longitude={lngNumber}
            onChange={handleMapChange}
            disabled={isPending}
          />

          <DialogFooter className="pt-3 gap-2 flex-row-reverse sm:justify-start">
            <Button
              type="submit"
              disabled={isPending || !currentGooglePlaceId || currentGooglePlaceId.trim().length === 0}
              className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover,#e3460f)] text-white font-semibold min-w-[120px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin me-2" />
                  {t("superAdmin.cities.form.submitting")}
                </>
              ) : (
                t("superAdmin.cities.form.submit")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
