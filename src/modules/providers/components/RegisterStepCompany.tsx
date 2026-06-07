import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Button } from "@shared/components/ui/button";
import {
  providerCompanySchema,
  type ProviderCompanyValues,
} from "../schemas/providers.schemas";

interface Props {
  defaultValues: Partial<ProviderCompanyValues>;
  onNext: (values: ProviderCompanyValues) => void;
  onCancel?: () => void;
}

/** Step 1 — Company basics: name, contact, password. */
export function RegisterStepCompany({ defaultValues, onNext, onCancel }: Props) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProviderCompanyValues>({
    resolver: zodResolver(providerCompanySchema),
    defaultValues: {
      companyName: defaultValues.companyName ?? "",
      email: defaultValues.email ?? "",
      phone: defaultValues.phone ?? "",
      password: defaultValues.password ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="companyName">{t("providers.fields.companyName")}</Label>
        <Input
          id="companyName"
          placeholder={t("providers.fields.companyNamePlaceholder")}
          invalid={!!errors.companyName}
          {...register("companyName")}
        />
        {errors.companyName && (
          <p className="mt-1 text-xs text-danger-500">
            {t(errors.companyName.message ?? "common.requiredField")}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">{t("providers.fields.email")}</Label>
          <Input
            id="email"
            type="email"
            invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-danger-500">
              {t(errors.email.message ?? "common.requiredField")}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">{t("providers.fields.phone")}</Label>
          <Input
            id="phone"
            inputMode="numeric"
            placeholder="5xxxxxxxx"
            invalid={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-danger-500">
              {t(errors.phone.message ?? "common.requiredField")}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="password">{t("providers.fields.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          invalid={!!errors.password}
          {...register("password")}
        />
        <p className="mt-1 text-xs text-ink-500">{t("providers.fields.passwordHint")}</p>
        {errors.password && (
          <p className="mt-1 text-xs text-danger-500">
            {t(errors.password.message ?? "common.requiredField")}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-4 border-t border-ink-100 sm:flex-row sm:justify-between">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isSubmitting}>
          {t("common.next")}
        </Button>
      </div>
    </form>
  );
}
