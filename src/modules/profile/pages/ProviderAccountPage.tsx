/**
 * @file ProviderAccountPage.tsx
 *
 * Provider's own account/security page (dealer, workshop, scrap alike),
 * backed by the shared, role-neutral /api/profile surface in
 * `@modules/profile/*` (api/hooks/schemas/types). Built entirely from the
 * provider design system (`@shared/provider-ui`) — visually distinct from
 * `AdminProfilePage`, which this page does not import from or share UI with.
 *
 * Two-mode page: VIEW (grouped display cards) and EDIT (inline RHF+Zod form).
 * Password reset and the two-step phone-change OTP flow are separate
 * deferred-mounted dialogs.
 *
 * GET /api/profile response shape is unverified in swagger — profileApi's
 * adaptProfile degrades every field to null, rendered here as "—".
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Pencil,
  X,
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin,
  IdCard,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@shared/components/ui/toastContext";
import {
  ProviderCard,
  ProviderPageHeader,
  ProviderSkeleton,
  ProviderInput,
  ProviderDialog,
  ProviderStatusPill,
} from "@shared/provider-ui";
import {
  accountProfileEditSchema,
  accountResetPasswordSchema,
  accountChangePhoneRequestSchema,
  accountChangePhoneVerifySchema,
  type AccountProfileEditFormValues,
  type AccountResetPasswordFormValues,
  type AccountChangePhoneRequestFormValues,
  type AccountChangePhoneVerifyFormValues,
} from "@modules/profile/schemas/accountProfile.schemas";
import {
  useAccountProfileQuery,
  useUpdateAccountProfileMutation,
  useResetAccountPasswordMutation,
  useChangeAccountPhoneRequestMutation,
  useChangeAccountPhoneVerifyMutation,
} from "@modules/profile/hooks/useProfileQueries";
import type { AccountProfile } from "@modules/profile/types";
import { ProfileImageUpload } from "@modules/profile/components/ProfileImageUpload";
import { ProviderAddressesSection } from "@modules/profile/components/ProviderAddressesSection";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDefaults(profile: AccountProfile | undefined): AccountProfileEditFormValues {
  return {
    fullName: profile?.fullName ?? "",
    phoneNumber: profile?.phoneNumber ?? "",
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    identityNumber: profile?.identityNumber ?? "",
  };
}

interface DisplayFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

function DisplayField({ icon, label, value }: DisplayFieldProps) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-lg)] p-3 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-50)]">
        <span className="text-[var(--color-brand-orange)]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--color-muted)]">{label}</p>
        <p className="text-sm font-medium text-[var(--color-ink-body)]">{value || "—"}</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProviderAccountPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneStep, setPhoneStep] = useState<"request" | "verify">("request");
  const [pendingNewPhone, setPendingNewPhone] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const initializedRef = useRef(false);

  const profileQuery = useAccountProfileQuery();
  const updateMutation = useUpdateAccountProfileMutation();
  const resetPasswordMutation = useResetAccountPasswordMutation();
  const changePhoneRequestMutation = useChangeAccountPhoneRequestMutation();
  const changePhoneVerifyMutation = useChangeAccountPhoneVerifyMutation();
  const profile = profileQuery.data;

  const form = useForm<AccountProfileEditFormValues>({
    resolver: zodResolver(accountProfileEditSchema),
    defaultValues: buildDefaults(undefined),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const passwordForm = useForm<AccountResetPasswordFormValues>({
    resolver: zodResolver(accountResetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const phoneRequestForm = useForm<AccountChangePhoneRequestFormValues>({
    resolver: zodResolver(accountChangePhoneRequestSchema),
    defaultValues: { newPhoneNumber: "" },
  });

  const phoneVerifyForm = useForm<AccountChangePhoneVerifyFormValues>({
    resolver: zodResolver(accountChangePhoneVerifySchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (profile && !initializedRef.current) {
      reset(buildDefaults(profile));
      initializedRef.current = true;
    }
  }, [profile, reset]);

  const handleEdit = () => {
    reset(buildDefaults(profile));
    setIsEditing(true);
  };

  const handleCancel = () => {
    reset(buildDefaults(profile));
    setIsEditing(false);
  };

  const onSubmit = (data: AccountProfileEditFormValues) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t("accountProfile.saveSuccess"));
        setIsEditing(false);
      },
      onError: () => {
        toast.error(t("accountProfile.saveFailed"));
      },
    });
  };

  const closePasswordDialog = () => {
    setPasswordDialogOpen(false);
    passwordForm.reset({ newPassword: "", confirmPassword: "" });
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const onSubmitPassword = (data: AccountResetPasswordFormValues) => {
    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t("accountProfile.password.success"));
        closePasswordDialog();
      },
      onError: () => {
        toast.error(t("accountProfile.password.failed"));
      },
    });
  };

  const closePhoneDialog = () => {
    setPhoneDialogOpen(false);
    setPhoneStep("request");
    setPendingNewPhone("");
    phoneRequestForm.reset({ newPhoneNumber: "" });
    phoneVerifyForm.reset({ code: "" });
  };

  const onSubmitPhoneRequest = (data: AccountChangePhoneRequestFormValues) => {
    changePhoneRequestMutation.mutate(
      { oldPhoneNumber: profile?.phoneNumber ?? "", newPhoneNumber: data.newPhoneNumber },
      {
        onSuccess: () => {
          setPendingNewPhone(data.newPhoneNumber);
          setPhoneStep("verify");
        },
        onError: () => {
          toast.error(t("accountProfile.phone.requestFailed"));
        },
      },
    );
  };

  const onSubmitPhoneVerify = (data: AccountChangePhoneVerifyFormValues) => {
    changePhoneVerifyMutation.mutate(
      { newPhoneNumber: pendingNewPhone, code: data.code },
      {
        onSuccess: () => {
          toast.success(t("accountProfile.phone.success"));
          closePhoneDialog();
        },
        onError: () => {
          toast.error(t("accountProfile.phone.verifyFailed"));
        },
      },
    );
  };

  const handleResendCode = () => {
    changePhoneRequestMutation.mutate(
      { oldPhoneNumber: profile?.phoneNumber ?? "", newPhoneNumber: pendingNewPhone },
      {
        onError: () => {
          toast.error(t("accountProfile.phone.requestFailed"));
        },
      },
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6 provider-fade-up">
        <ProviderSkeleton variant="block" height={48} />
        <ProviderSkeleton variant="block" height={180} />
        <ProviderSkeleton variant="block" height={180} />
        <ProviderSkeleton variant="block" height={130} />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (profileQuery.isError || !profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-[var(--color-muted)]">{t("common.errorTitle")}</p>
        <button
          type="button"
          onClick={() => void profileQuery.refetch()}
          className="text-sm font-medium text-[var(--color-brand-orange)] hover:underline"
        >
          {t("common.errorRetry")}
        </button>
      </div>
    );
  }

  const initial = profile.fullName?.trim().charAt(0) || "م";

  const btnPrimary =
    "flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)] " +
    "bg-[var(--color-brand-orange)] px-5 text-sm font-semibold text-white " +
    "shadow-[var(--shadow-provider-sm)] transition-colors duration-[var(--dur-fast)] " +
    "hover:bg-[var(--color-brand-orange-hover,#E3460F)] " +
    "disabled:cursor-not-allowed disabled:opacity-60";

  const btnSecondary =
    "flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)] " +
    "border border-[var(--color-divider)] bg-[var(--color-surface)] " +
    "px-4 text-sm font-medium text-[var(--color-ink-body)] " +
    "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] " +
    "disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6 provider-fade-up">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <ProviderPageHeader
          icon={<User className="h-5 w-5" aria-hidden />}
          title={t("accountProfile.title")}
          subtitle={t("accountProfile.subtitle")}
          actions={
            isEditing ? (
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleCancel} className={btnSecondary}>
                  <X className="h-4 w-4" aria-hidden />
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={updateMutation.isPending} className={btnPrimary}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden />
                  )}
                  {t("common.save")}
                </button>
              </div>
            ) : (
              <button type="button" onClick={handleEdit} className={btnPrimary}>
                <Pencil className="h-4 w-4" aria-hidden />
                {t("accountProfile.editBtn")}
              </button>
            )
          }
        />

        {/* ── Identity banner ─────────────────────────────────────────────── */}
        <ProviderCard interactive style={{ animationDelay: "40ms" }}>
          <div className="flex flex-wrap items-center gap-4">
            <ProfileImageUpload fallbackInitial={initial} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-[var(--font-display)] text-xl font-bold text-[var(--color-ink-body)]">
                {profile.fullName || "—"}
              </h2>
              <p className="text-sm text-[var(--color-muted)]">
                {profile.email || t("accountProfile.subtitle")}
              </p>
            </div>
            <ProviderStatusPill label={t("accountProfile.securitySection")} tone="brand" />
          </div>
        </ProviderCard>

        {/* ── Personal Info ───────────────────────────────────────────────── */}
        <ProviderCard interactive style={{ animationDelay: "70ms" }}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-body)]">
            {t("accountProfile.personalSection")}
          </h2>

          {isEditing ? (
            <div className="space-y-4">
              <ProviderInput
                id="fullName"
                label={t("accountProfile.fullName")}
                error={errors.fullName?.message ? t(errors.fullName.message) : undefined}
                {...register("fullName")}
              />
              <ProviderInput
                id="identityNumber"
                label={t("accountProfile.identityNumber")}
                error={errors.identityNumber?.message ? t(errors.identityNumber.message) : undefined}
                {...register("identityNumber")}
              />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <DisplayField
                icon={<User className="h-4 w-4" aria-hidden />}
                label={t("accountProfile.fullName")}
                value={profile.fullName}
              />
              <DisplayField
                icon={<IdCard className="h-4 w-4" aria-hidden />}
                label={t("accountProfile.identityNumber")}
                value={profile.identityNumber}
              />
            </div>
          )}
        </ProviderCard>

        {/* ── Contact ──────────────────────────────────────────────────────── */}
        <ProviderCard interactive style={{ animationDelay: "100ms" }}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-body)]">
            {t("accountProfile.contactSection")}
          </h2>

          {isEditing ? (
            <div className="space-y-4">
              <ProviderInput
                id="phoneNumber"
                type="tel"
                label={t("accountProfile.phoneNumber")}
                leadingIcon={<Phone className="h-4 w-4" aria-hidden />}
                error={errors.phoneNumber?.message ? t(errors.phoneNumber.message) : undefined}
                {...register("phoneNumber")}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <ProviderInput
                  id="address"
                  label={t("accountProfile.address")}
                  error={errors.address?.message ? t(errors.address.message) : undefined}
                  {...register("address")}
                />
                <ProviderInput
                  id="city"
                  label={t("accountProfile.city")}
                  error={errors.city?.message ? t(errors.city.message) : undefined}
                  {...register("city")}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <DisplayField
                icon={<Phone className="h-4 w-4" aria-hidden />}
                label={t("accountProfile.phoneNumber")}
                value={profile.phoneNumber}
              />
              <DisplayField
                icon={<Mail className="h-4 w-4" aria-hidden />}
                label={t("accountProfile.email")}
                value={profile.email}
              />
              <DisplayField
                icon={<MapPin className="h-4 w-4" aria-hidden />}
                label={t("accountProfile.address")}
                value={profile.address}
              />
              <DisplayField
                icon={<MapPin className="h-4 w-4" aria-hidden />}
                label={t("accountProfile.city")}
                value={profile.city}
              />
            </div>
          )}
        </ProviderCard>

        {/* ── Addresses ────────────────────────────────────────────────────── */}
        <ProviderAddressesSection style={{ animationDelay: "115ms" }} />

        {/* ── Security ─────────────────────────────────────────────────────── */}
        <ProviderCard interactive style={{ animationDelay: "130ms" }}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-body)]">
            {t("accountProfile.securitySection")}
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setPasswordDialogOpen(true)} className={btnSecondary}>
              <KeyRound className="h-4 w-4" aria-hidden />
              {t("accountProfile.password.changeBtn")}
            </button>
            <button type="button" onClick={() => setPhoneDialogOpen(true)} className={btnSecondary}>
              <Phone className="h-4 w-4" aria-hidden />
              {t("accountProfile.phone.changeBtn")}
            </button>
          </div>
        </ProviderCard>
      </div>

      {/* ── Change password dialog ────────────────────────────────────────── */}
      {passwordDialogOpen && (
        <ProviderDialog
          open={passwordDialogOpen}
          onOpenChange={(open) => (open ? setPasswordDialogOpen(true) : closePasswordDialog())}
          title={t("accountProfile.password.title")}
          size="sm"
          footer={
            <>
              <button type="button" onClick={closePasswordDialog} className={btnSecondary}>
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={passwordForm.handleSubmit(onSubmitPassword)}
                disabled={resetPasswordMutation.isPending}
                className={btnPrimary}
              >
                {resetPasswordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <KeyRound className="h-4 w-4" aria-hidden />
                )}
                {t("common.save")}
              </button>
            </>
          }
        >
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} noValidate className="space-y-4">
            <ProviderInput
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              label={t("accountProfile.password.newPassword")}
              hint={t("accountProfile.password.hint")}
              trailingIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={t("accountProfile.password.toggleVisibility")}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              }
              error={
                passwordForm.formState.errors.newPassword?.message
                  ? t(passwordForm.formState.errors.newPassword.message)
                  : undefined
              }
              {...passwordForm.register("newPassword")}
            />
            <ProviderInput
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              label={t("accountProfile.password.confirmPassword")}
              trailingIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={t("accountProfile.password.toggleVisibility")}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              }
              error={
                passwordForm.formState.errors.confirmPassword?.message
                  ? t(passwordForm.formState.errors.confirmPassword.message)
                  : undefined
              }
              {...passwordForm.register("confirmPassword")}
            />
          </form>
        </ProviderDialog>
      )}

      {/* ── Change phone dialog (two-step OTP) ────────────────────────────── */}
      {phoneDialogOpen && (
        <ProviderDialog
          open={phoneDialogOpen}
          onOpenChange={(open) => (open ? setPhoneDialogOpen(true) : closePhoneDialog())}
          title={t("accountProfile.phone.title")}
          description={
            phoneStep === "verify"
              ? t("accountProfile.phone.codeSentNotice", { phone: pendingNewPhone })
              : undefined
          }
          size="sm"
          footer={
            phoneStep === "request" ? (
              <>
                <button type="button" onClick={closePhoneDialog} className={btnSecondary}>
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={phoneRequestForm.handleSubmit(onSubmitPhoneRequest)}
                  disabled={changePhoneRequestMutation.isPending}
                  className={btnPrimary}
                >
                  {changePhoneRequestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  {t("accountProfile.phone.sendCode")}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setPhoneStep("request")} className={btnSecondary}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  {t("accountProfile.phone.back")}
                </button>
                <button
                  type="button"
                  onClick={phoneVerifyForm.handleSubmit(onSubmitPhoneVerify)}
                  disabled={changePhoneVerifyMutation.isPending}
                  className={btnPrimary}
                >
                  {changePhoneVerifyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  {t("accountProfile.phone.verify")}
                </button>
              </>
            )
          }
        >
          {phoneStep === "request" ? (
            <form onSubmit={phoneRequestForm.handleSubmit(onSubmitPhoneRequest)} noValidate className="space-y-4">
              <p className="text-sm text-[var(--color-muted)]">
                {t("accountProfile.phone.currentPhone", { phone: profile.phoneNumber || "—" })}
              </p>
              <ProviderInput
                id="newPhoneNumber"
                type="tel"
                label={t("accountProfile.phone.newPhoneNumber")}
                leadingIcon={<Phone className="h-4 w-4" aria-hidden />}
                error={
                  phoneRequestForm.formState.errors.newPhoneNumber?.message
                    ? t(phoneRequestForm.formState.errors.newPhoneNumber.message)
                    : undefined
                }
                {...phoneRequestForm.register("newPhoneNumber")}
              />
            </form>
          ) : (
            <form onSubmit={phoneVerifyForm.handleSubmit(onSubmitPhoneVerify)} noValidate className="space-y-4">
              <ProviderInput
                id="code"
                inputMode="numeric"
                label={t("accountProfile.phone.code")}
                error={
                  phoneVerifyForm.formState.errors.code?.message
                    ? t(phoneVerifyForm.formState.errors.code.message)
                    : undefined
                }
                {...phoneVerifyForm.register("code")}
              />
              <button
                type="button"
                onClick={handleResendCode}
                disabled={changePhoneRequestMutation.isPending}
                className="text-xs font-medium text-[var(--color-brand-orange)] hover:underline disabled:opacity-60"
              >
                {t("accountProfile.phone.resend")}
              </button>
            </form>
          )}
        </ProviderDialog>
      )}
    </form>
  );
}
