/**
 * @file ForgotPasswordPage.tsx
 * @description Requests a password reset link by email. Always shows the
 * same "check your inbox" confirmation regardless of whether the email
 * exists (security requirement — the backend never reveals existence).
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, MailCheck } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas/auth.schemas";
import { useForgotPasswordMutation } from "../hooks/useAuthMutations";

type ViewState = "form" | "sent";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [view, setView] = useState<ViewState>("form");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const forgotPasswordMutation = useForgotPasswordMutation();

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await forgotPasswordMutation.mutateAsync(values);
      setView("sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.unknown");
      toast.error(t("auth.forgotPassword.title"), message);
    }
  });

  const onResend = async () => {
    const email = form.getValues("email");
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      toast.info(t("auth.forgotPassword.sentTitle"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.unknown");
      toast.error(t("auth.forgotPassword.title"), message);
    }
  };

  const emailError = form.formState.errors.email?.message;

  return (
    <AuthLayout>
      <div
        className={`transition-all duration-200 ${
          view === "form" ? "opacity-100" : "hidden opacity-0"
        }`}
      >
        {/* Title + subtitle */}
        <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-right">
          {t("auth.forgotPassword.title")}
        </h2>
        <p className="txt-subtitle font-main text-[#7A7E95] text-right mt-[var(--space-2)]">
          {t("auth.forgotPassword.subtitle")}
        </p>

        <form onSubmit={onSubmit} className="mt-[var(--space-8)]" noValidate>
          {/* Email label */}
          <label
            htmlFor="forgot-email"
            className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]"
          >
            {t("auth.forgotPassword.emailLabel")}
          </label>
          <div className="flex items-center bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] gap-3 focus-within:ring-2 focus-within:ring-[var(--color-brand-orange)]/20 transition-all duration-200">
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder={t("auth.forgotPassword.emailPlaceholder")}
              className="flex-1 txt-body font-main placeholder:text-[#7A7E95] border-0 outline-none bg-transparent text-[#0F1222]"
              {...form.register("email")}
            />
          </div>
          {emailError && (
            <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
              {t(emailError)}
            </p>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            block
            className="mt-[var(--space-6)]"
          >
            {forgotPasswordMutation.isPending && (
              <Loader2 size={18} className="animate-spin" />
            )}
            {t("auth.forgotPassword.submitButton")}
          </Button>
        </form>

        {/* Back to login */}
        <p className="text-center txt-caption font-main mt-[var(--space-4)]">
          <Link
            to="/login"
            className="text-[var(--color-brand-orange)] font-[var(--fw-ibm-semibold)] hover:underline"
          >
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </p>
      </div>

      <div
        className={`transition-all duration-200 text-center ${
          view === "sent" ? "opacity-100" : "hidden opacity-0"
        }`}
      >
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-success-50)]">
          <MailCheck size={28} className="text-[var(--color-success-500)]" />
        </div>
        <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-center mt-[var(--space-4)]">
          {t("auth.forgotPassword.sentTitle")}
        </h2>
        <p className="txt-subtitle font-main text-[#7A7E95] text-center mt-[var(--space-2)]">
          {t("auth.forgotPassword.sentBody")}
        </p>

        <Button
          type="button"
          variant="outline"
          disabled={forgotPasswordMutation.isPending}
          onClick={() => void onResend()}
          block
          className="mt-[var(--space-6)]"
        >
          {forgotPasswordMutation.isPending && (
            <Loader2 size={18} className="animate-spin" />
          )}
          {t("auth.forgotPassword.resendButton")}
        </Button>

        <p className="text-center txt-caption font-main mt-[var(--space-4)]">
          <Link
            to="/login"
            className="text-[var(--color-brand-orange)] font-[var(--fw-ibm-semibold)] hover:underline"
          >
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
