/**
 * @file ResetPasswordPage.tsx
 * @description Sets a new password from a token emailed by
 * ForgotPasswordPage. The token is read from the query string
 * (`?token=xxx`), never a route param. A missing token or a backend
 * "invalid or expired" response both land on the same INVALID-TOKEN state.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import { PasswordStrengthMeter } from "@shared/components/ui/PasswordStrengthMeter";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas/auth.schemas";
import { useResetPasswordMutation } from "../hooks/useAuthMutations";
import { isInvalidResetTokenError } from "../api/auth.adapter";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [invalidToken, setInvalidToken] = useState(!token);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const resetPasswordMutation = useResetPasswordMutation();
  const watchedNewPassword = form.watch("newPassword");

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await resetPasswordMutation.mutateAsync({ token, ...values });
      toast.success(t("auth.resetPassword.successToast"));
      navigate("/login");
    } catch (err) {
      if (isInvalidResetTokenError(err)) {
        setInvalidToken(true);
      } else {
        const message = err instanceof Error ? err.message : t("errors.unknown");
        toast.error(t("auth.resetPassword.title"), message);
      }
    }
  });

  const newPasswordError = form.formState.errors.newPassword?.message;
  const confirmPasswordError = form.formState.errors.confirmPassword?.message;

  if (invalidToken) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-danger-50)]">
            <ShieldAlert size={28} className="text-[var(--color-danger-500)]" />
          </div>
          <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-center mt-[var(--space-4)]">
            {t("auth.resetPassword.invalidTokenTitle")}
          </h2>
          <p className="txt-subtitle font-main text-[#7A7E95] text-center mt-[var(--space-2)]">
            {t("auth.resetPassword.invalidTokenBody")}
          </p>

          <Link to="/forgot-password" className="block mt-[var(--space-6)]">
            <Button type="button" block>
              {t("auth.resetPassword.requestNewLink")}
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Title + subtitle */}
      <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-right">
        {t("auth.resetPassword.title")}
      </h2>
      <p className="txt-subtitle font-main text-[#7A7E95] text-right mt-[var(--space-2)]">
        {t("auth.resetPassword.subtitle")}
      </p>

      <form onSubmit={onSubmit} className="mt-[var(--space-8)]" noValidate>
        {/* New password */}
        <label
          htmlFor="new-password"
          className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]"
        >
          {t("auth.resetPassword.newPasswordLabel")}
        </label>
        <div className="flex items-center bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] gap-3 focus-within:ring-2 focus-within:ring-[var(--color-brand-orange)]/20 transition-all duration-200">
          <input
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
            className="flex-1 txt-body font-main placeholder:text-[#7A7E95] border-0 outline-none bg-transparent text-[#0F1222]"
            {...form.register("newPassword")}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((s) => !s)}
            aria-label={
              showNewPassword
                ? t("auth.resetPassword.hidePassword")
                : t("auth.resetPassword.showPassword")
            }
            className="shrink-0 text-[#7A7E95] hover:text-[#0F1222] transition-colors"
          >
            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <PasswordStrengthMeter password={watchedNewPassword} />
        {newPasswordError && (
          <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
            {t(newPasswordError)}
          </p>
        )}

        {/* Confirm password */}
        <label
          htmlFor="confirm-password"
          className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)] mt-[var(--space-4)]"
        >
          {t("auth.resetPassword.confirmPasswordLabel")}
        </label>
        <div className="flex items-center bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] gap-3 focus-within:ring-2 focus-within:ring-[var(--color-brand-orange)]/20 transition-all duration-200">
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
            className="flex-1 txt-body font-main placeholder:text-[#7A7E95] border-0 outline-none bg-transparent text-[#0F1222]"
            {...form.register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((s) => !s)}
            aria-label={
              showConfirmPassword
                ? t("auth.resetPassword.hidePassword")
                : t("auth.resetPassword.showPassword")
            }
            className="shrink-0 text-[#7A7E95] hover:text-[#0F1222] transition-colors"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {confirmPasswordError && (
          <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
            {t(confirmPasswordError)}
          </p>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={resetPasswordMutation.isPending}
          block
          className="mt-[var(--space-6)]"
        >
          {resetPasswordMutation.isPending && (
            <Loader2 size={18} className="animate-spin" />
          )}
          {t("auth.resetPassword.submitButton")}
        </Button>
      </form>
    </AuthLayout>
  );
}
