/**
 * @file Layer 1 engine (visual half) — renders one on-brand signup form
 * for a given per-type config (icon, accent, copy) inside <AuthLayout/>.
 * Fields are shared across all provider types this round (companyName,
 * email, phone, password, confirmPassword, termsOfServiceAccepted);
 * per-type field divergence is a config-file change, not a shell change.
 *
 * After a successful register, the shell switches (no route change) to an
 * inline email-OTP verify phase — the backend issues no token on register,
 * so the account must be verified before the user can log in.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@shared/lib/utils";
import { PasswordStrengthMeter } from "@shared/components/ui/PasswordStrengthMeter";
import { useToast } from "@shared/components/ui/toastContext";
import { OtpInput } from "../components/OtpInput";
import { isInvalidOtpError } from "../api/auth.adapter";
import { useVerifyEmailOtpMutation } from "../hooks/useAuthMutations";
import { useRegisterProviderForm } from "./useRegisterProviderForm";
import type { ProviderRegisterConfig } from "./config/types";

const fieldInputClass =
  "bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] txt-body font-main text-[#0F1222] placeholder:text-[#7A7E95] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]/20 transition-all duration-200 w-full";

export function RegisterProviderShell({ config }: { config: ProviderRegisterConfig }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { form, onSubmit, isSubmitting, registeredEmail } = useRegisterProviderForm(config);
  const errors = form.formState.errors;
  const watchedPassword = form.watch("password");
  const Icon = config.icon;

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const verifyEmailOtpMutation = useVerifyEmailOtpMutation();

  const onVerifySubmit = async (code: string) => {
    if (!registeredEmail || code.length !== 6) return;
    setOtpError(false);
    try {
      await verifyEmailOtpMutation.mutateAsync({ email: registeredEmail, otp: code });
      toast.success(t("auth.verifyEmail.successToast"));
      navigate("/login", { replace: true, state: { registeredEmail } });
    } catch (err) {
      if (isInvalidOtpError(err)) {
        setOtpError(true);
      } else {
        toast.error(
          t("auth.verifyEmail.title"),
          err instanceof Error ? err.message : undefined,
        );
      }
    }
  };

  const phase = registeredEmail ? "verify" : "form";

  return (
    <AuthLayout>
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute top-0 right-0 w-[var(--space-10)] h-[var(--space-10)] rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-card)] flex items-center justify-center"
      >
        <ChevronRight size={20} className="text-[#0F1222]" />
      </button>

      {/* Per-type icon badge */}
      <div
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-[var(--radius-lg)] mb-[var(--space-4)]",
          config.accentBgClass,
        )}
      >
        <Icon size={28} className={config.accentClass} />
      </div>

      <div
        className={cn(
          "transition-all duration-200",
          phase === "form" ? "opacity-100" : "hidden opacity-0",
        )}
      >
        {/* Title + subtitle */}
        <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-right">
          {t(config.titleKey)}
        </h2>
        <p className="txt-subtitle font-main text-[#7A7E95] text-right mt-[var(--space-2)]">
          {t(config.subtitleKey)}
        </p>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-[var(--space-8)] space-y-[var(--space-4)]" noValidate>
          {/* Company/business name */}
          <div>
            <label className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]">
              {t(config.companyNameLabelKey)}
            </label>
            <input
              type="text"
              placeholder={t(config.companyNamePlaceholderKey)}
              className={fieldInputClass}
              {...form.register("companyName")}
            />
            {errors.companyName && (
              <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
                {t(errors.companyName.message ?? "")}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]">
              {t("auth.providerSignup.emailLabel")}
            </label>
            <input
              type="email"
              placeholder={t("auth.providerSignup.emailPlaceholder")}
              className={fieldInputClass}
              {...form.register("email")}
            />
            {errors.email && (
              <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
                {t(errors.email.message ?? "")}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]">
              {t("auth.phoneLabel")}
            </label>
            <div className="flex items-center bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] gap-3 focus-within:ring-2 focus-within:ring-[var(--color-brand-orange)]/20 transition-all duration-200">
              <span className="txt-body font-main font-[var(--fw-ibm-medium)] text-[#0F1222] shrink-0">
                {t("auth.countryCode")}
              </span>
              <span className="w-px h-6 bg-[#ECECF1] shrink-0" />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="tel"
                placeholder={t("auth.phonePlaceholder")}
                className="flex-1 txt-body font-main placeholder:text-[#7A7E95] border-0 outline-none bg-transparent text-[#0F1222]"
                {...form.register("phone")}
              />
            </div>
            {errors.phone && (
              <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
                {t(errors.phone.message ?? "")}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]">
              {t("auth.providerSignup.passwordLabel")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.providerSignup.passwordPlaceholder")}
                autoComplete="new-password"
                className={cn(fieldInputClass, "pl-11")}
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={t(showPassword ? "auth.login.hidePassword" : "auth.login.showPassword")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7E95] hover:text-[#0F1222] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrengthMeter password={watchedPassword} />
            {errors.password && (
              <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
                {t(errors.password.message ?? "")}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]">
              {t("auth.register.confirmPasswordLabel")}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                autoComplete="new-password"
                className={cn(fieldInputClass, "pl-11")}
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={t(showConfirmPassword ? "auth.login.hidePassword" : "auth.login.showPassword")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7E95] hover:text-[#0F1222] transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
                {t(errors.confirmPassword.message ?? "")}
              </p>
            )}
          </div>

          {/* Terms of service */}
          <div>
            <label className="flex items-center justify-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-[var(--radius-xs)] border-[#ECECF1] accent-[var(--color-brand-orange)]"
                {...form.register("termsOfServiceAccepted")}
              />
              <span className="txt-caption font-main text-[#0F1222]">
                {t("auth.register.termsLabel")}{" "}
                <span className="text-[var(--color-brand-orange)] font-[var(--fw-ibm-semibold)] underline">
                  {t("auth.register.termsLink")}
                </span>
              </span>
            </label>
            {errors.termsOfServiceAccepted && (
              <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
                {t(errors.termsOfServiceAccepted.message ?? "")}
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" disabled={isSubmitting} block className="mt-[var(--space-6)]">
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {t(isSubmitting ? "auth.providerSignup.submitting" : "auth.providerSignup.submitButton")}
          </Button>
        </form>

        {/* Bottom links */}
        <p className="text-center txt-caption font-main mt-[var(--space-4)]">
          <Link to="/register" className="text-[#7A7E95] hover:underline">
            {t("auth.providerSignup.backToChoose")}
          </Link>
        </p>
        <p className="text-center txt-caption font-main mt-[var(--space-2)]">
          <span className="text-[#7A7E95]">{t("auth.providerSignup.hasAccount")} </span>
          <Link
            to="/login"
            className="text-[var(--color-brand-orange)] font-[var(--fw-ibm-semibold)] hover:underline"
          >
            {t("auth.providerSignup.signInLink")}
          </Link>
        </p>
      </div>

      <div
        className={cn(
          "transition-all duration-200 text-center",
          phase === "verify" ? "opacity-100" : "hidden opacity-0",
        )}
      >
        {/* Title + subtitle (email shown read-only for confirmation) */}
        <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-center">
          {t("auth.verifyEmail.title")}
        </h2>
        <p className="txt-subtitle font-main text-[#7A7E95] text-center mt-[var(--space-2)]">
          {t("auth.verifyEmail.subtitle", { email: registeredEmail ?? "" })}
        </p>

        <div className="mt-[var(--space-8)]">
          <label className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-center mb-[var(--space-2)]">
            {t("auth.verifyEmail.otpLabel")}
          </label>
          <OtpInput
            length={6}
            value={otp}
            onChange={(next) => {
              setOtp(next);
              setOtpError(false);
            }}
            onComplete={onVerifySubmit}
            disabled={verifyEmailOtpMutation.isPending}
            invalid={otpError}
            autoFocus
          />
          {otpError && (
            <p className="txt-caption font-main text-[#E3460F] text-center mt-[var(--space-2)]">
              {t("auth.verifyEmail.errors.invalidOtp")}
            </p>
          )}
        </div>

        <Button
          type="button"
          disabled={verifyEmailOtpMutation.isPending || otp.length !== 6}
          onClick={() => void onVerifySubmit(otp)}
          block
          className="mt-[var(--space-6)]"
        >
          {verifyEmailOtpMutation.isPending && <Loader2 size={18} className="animate-spin" />}
          {t("auth.verifyEmail.submitButton")}
        </Button>

        {/* Resend — rendered but disabled until the backend adds a resend endpoint. */}
        {/* TODO: wire to backend resend-verification endpoint when it exists. */}
        <Button type="button" variant="outline" disabled block className="mt-[var(--space-3)]">
          {t("auth.verifyEmail.resendButton")}
        </Button>
        <p className="txt-caption font-main text-[#7A7E95] text-center mt-[var(--space-2)]">
          {t("auth.verifyEmail.resendDisabledHint")}
        </p>
      </div>
    </AuthLayout>
  );
}
