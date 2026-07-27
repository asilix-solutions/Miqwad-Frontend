/**
 * @file AddAdminDialog.tsx
 * @description Dedicated, elevated-privilege "Add Admin" dialog for the
 * admin Users page. Deliberately separate from `AddUserDialog`'s 4-type
 * stepper — this is a single-purpose form gated behind a safeguard
 * confirmation checkbox, wired to the real `POST /api/Users` endpoint.
 *
 * No password step here: the backend emails the new admin an activation
 * OTP and they set their own password via the existing reset-password flow.
 *
 * SECURITY: the safeguard checkbox and the `Can`-gated trigger button are
 * UX affordances only. The actual authorization boundary is server-side
 * ([Authorize(Roles=Admin)] on POST /api/Users) — see adminApi.createAdmin.
 */

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ShieldAlert, MailCheck } from "lucide-react";
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
import { useToast } from "@shared/components/ui/toastContext";
import { AppError } from "@shared/types/api";
import { useCreateAdminMutation } from "../../hooks/useAdminQueries";
import { adminCreateSchema } from "../../schemas/adminSchema";
import type { AdminCreateRequest } from "../../api/adminApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Form shape: `confirmGrant` is a plain boolean here (the zod schema narrows it to literal `true` on submit). */
interface AddAdminFormShape {
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  address: string;
  confirmGrant: boolean;
}

const DEFAULT_VALUES: AddAdminFormShape = {
  fullName: "",
  email: "",
  phoneNumber: "",
  city: "",
  address: "",
  confirmGrant: false,
};

const resolver = zodResolver(adminCreateSchema) as unknown as Resolver<AddAdminFormShape>;

export function AddAdminDialog({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const createAdminMutation = useCreateAdminMutation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddAdminFormShape>({
    resolver,
    defaultValues: DEFAULT_VALUES,
  });

  const isPending = createAdminMutation.isPending;
  const confirmGrant = watch("confirmGrant");

  const handleOpenChange = (val: boolean) => {
    if (isPending) return;
    if (!val) {
      reset(DEFAULT_VALUES);
      setErrorMessage(null);
    }
    onOpenChange(val);
  };

  const onSubmit = async (data: AddAdminFormShape) => {
    setErrorMessage(null);
    const payload: AdminCreateRequest = {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      city: data.city,
      address: data.address,
      role: 1,
    };
    try {
      await createAdminMutation.mutateAsync(payload);
      toast.success(t("admin.addAdmin.successToast"));
      handleOpenChange(false);
    } catch (err) {
      const message = err instanceof AppError ? err.message : t("common.saveFailed");
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="lg" dir={i18n.dir()}>
        <DialogHeader>
          <DialogTitle>{t("admin.addAdmin.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-warning-500)] bg-[color-mix(in_srgb,var(--color-warning-500)_10%,transparent)] p-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-[var(--color-warning-500)]" aria-hidden />
          <p className="text-sm text-[var(--color-ink-body)]">{t("admin.addAdmin.caution")}</p>
        </div>

        {errorMessage && (
          <p className="text-sm text-danger-500" role="alert">
            {errorMessage}
          </p>
        )}

        <form id="add-admin-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-fullName">
                {t("admin.addAdmin.fullNameLabel")} <span className="text-danger-500">*</span>
              </Label>
              <Input
                id="admin-fullName"
                placeholder={t("admin.addAdmin.fullNamePlaceholder")}
                {...register("fullName")}
                disabled={isPending}
                invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <p className="text-sm text-danger-500">{t(errors.fullName.message as string)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-phoneNumber">
                {t("admin.addAdmin.phoneLabel")} <span className="text-danger-500">*</span>
              </Label>
              <Input
                id="admin-phoneNumber"
                dir="ltr"
                className="text-left"
                placeholder={t("admin.addAdmin.phonePlaceholder")}
                {...register("phoneNumber")}
                disabled={isPending}
                invalid={!!errors.phoneNumber}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-danger-500">{t(errors.phoneNumber.message as string)}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">
              {t("admin.addAdmin.emailLabel")} <span className="text-danger-500">*</span>
            </Label>
            <Input
              id="admin-email"
              type="email"
              dir="ltr"
              className="text-left"
              placeholder={t("admin.addAdmin.emailPlaceholder")}
              {...register("email")}
              disabled={isPending}
              invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-danger-500">{t(errors.email.message as string)}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-city">
                {t("admin.addAdmin.cityLabel")} <span className="text-danger-500">*</span>
              </Label>
              <Input
                id="admin-city"
                placeholder={t("admin.addAdmin.cityPlaceholder")}
                {...register("city")}
                disabled={isPending}
                invalid={!!errors.city}
              />
              {errors.city && (
                <p className="text-sm text-danger-500">{t(errors.city.message as string)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-address">
                {t("admin.addAdmin.addressLabel")} <span className="text-danger-500">*</span>
              </Label>
              <Input
                id="admin-address"
                placeholder={t("admin.addAdmin.addressPlaceholder")}
                {...register("address")}
                disabled={isPending}
                invalid={!!errors.address}
              />
              {errors.address && (
                <p className="text-sm text-danger-500">{t(errors.address.message as string)}</p>
              )}
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[var(--color-divider)] p-3 text-sm text-[var(--color-ink-body)]">
            <input
              type="checkbox"
              {...register("confirmGrant")}
              disabled={isPending}
              className="mt-0.5 h-4 w-4 rounded-sm"
              style={{ accentColor: "var(--color-brand-orange)" }}
            />
            {t("admin.addAdmin.confirmGrantLabel")}
          </label>
          {errors.confirmGrant && (
            <p className="text-sm text-danger-500">{t(errors.confirmGrant.message as string)}</p>
          )}

          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-info-500)] bg-[color-mix(in_srgb,var(--color-info-500)_10%,transparent)] p-3">
            <MailCheck className="h-5 w-5 shrink-0 text-[var(--color-info-500)]" aria-hidden />
            <p className="text-sm text-[var(--color-ink-body)]">{t("admin.addAdmin.otpNotice")}</p>
          </div>
        </form>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="add-admin-form" disabled={isPending || !confirmGrant}>
            {isPending ? t("common.loading") : t("admin.addAdmin.submitButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
