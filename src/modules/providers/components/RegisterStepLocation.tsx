import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@shared/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { Button } from "@shared/components/ui/button";
import {
  providerLocationSchema,
  type ProviderLocationValues,
} from "../schemas/providers.schemas";

interface Props {
  defaultValues: Partial<ProviderLocationValues>;
  onNext: (values: ProviderLocationValues) => void;
  onBack: () => void;
}

/** Step 2 — Address, lat/lng, working hours. */
export function RegisterStepLocation({ defaultValues, onNext, onBack }: Props) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProviderLocationValues>({
    resolver: zodResolver(providerLocationSchema),
    defaultValues: {
      address: defaultValues.address ?? "",
      city: defaultValues.city ?? "",
      lat: defaultValues.lat ?? null,
      lng: defaultValues.lng ?? null,
      workingHours: defaultValues.workingHours ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="address">
          {t("providers.fields.address")}{" "}
          <span className="text-ink-400 text-xs">({t("common.optional")})</span>
        </Label>
        <Input
          id="address"
          placeholder={t("providers.fields.addressPlaceholder")}
          {...register("address")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="city">
            {t("providers.fields.city")}{" "}
            <span className="text-ink-400 text-xs">({t("common.optional")})</span>
          </Label>
          <Input id="city" {...register("city")} />
        </div>
        <div>
          <Label htmlFor="lat">
            {t("providers.fields.lat")}{" "}
            <span className="text-ink-400 text-xs">({t("common.optional")})</span>
          </Label>
          <Input
            id="lat"
            type="number"
            step="any"
            {...register("lat", {
              setValueAs: (v: unknown) => (v === "" || v == null ? null : Number(v)),
            })}
          />
        </div>
        <div>
          <Label htmlFor="lng">
            {t("providers.fields.lng")}{" "}
            <span className="text-ink-400 text-xs">({t("common.optional")})</span>
          </Label>
          <Input
            id="lng"
            type="number"
            step="any"
            {...register("lng", {
              setValueAs: (v: unknown) => (v === "" || v == null ? null : Number(v)),
            })}
          />
        </div>
      </div>

      <p className="text-xs text-ink-500">{t("providers.fields.mapHint")}</p>

      <div>
        <Label htmlFor="workingHours">
          {t("providers.fields.workingHours")}{" "}
          <span className="text-ink-400 text-xs">({t("common.optional")})</span>
        </Label>
        <Textarea
          id="workingHours"
          rows={2}
          placeholder={t("providers.fields.workingHoursPlaceholder")}
          {...register("workingHours")}
        />
      </div>

      {errors.lat || errors.lng ? (
        <p className="text-xs text-danger-500">{t("common.requiredField")}</p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-4 border-t border-ink-100 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("common.back")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {t("common.next")}
        </Button>
      </div>
    </form>
  );
}
