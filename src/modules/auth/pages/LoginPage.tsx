import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import { phoneSchema, type PhoneFormValues } from "../schemas/auth.schemas";
import { useRegisterMutation } from "../hooks/useAuthMutations";
import { useAppSelector } from "@app/store";

/**
 * Sprint 1 — Login page.
 * Single phone field (+966) → POST /auth/register → navigate to OTP.
 */
export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const pending = useAppSelector((s) => s.auth.pendingVerification);

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
    mode: "onSubmit",
  });

  const registerMutation = useRegisterMutation();

  // If a verification is already in progress (e.g. user reloaded the OTP page
  // and came back) skip back into the flow.
  useEffect(() => {
    if (pending) {
      navigate("/verify-otp", { replace: true });
    }
  }, [pending, navigate]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync({ phoneNumber: values.phoneNumber });
      navigate("/verify-otp");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.unknown");
      toast.error(t("auth.invalidPhone"), message);
    }
  });

  const fieldError = form.formState.errors.phoneNumber?.message;

  return (
    <AuthLayout>
      {/* Title + subtitle */}
      <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-right">
        {t("auth.login.title")}
      </h2>
      <p className="txt-subtitle font-main text-[#7A7E95] text-right mt-[var(--space-2)]">
        {t("auth.login.subtitle")}
      </p>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-[var(--space-8)]" noValidate>
        {/* Phone label */}
        <label
          htmlFor="phone"
          className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]"
        >
          {t("auth.phoneLabel")}
        </label>

        {/* Phone split-field */}
        <div className="flex items-center bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] gap-3 focus-within:ring-2 focus-within:ring-[var(--color-brand-orange)]/20 transition-all duration-200">
          <span className="txt-body font-main font-[var(--fw-ibm-medium)] text-[#0F1222] shrink-0">
            {t("auth.countryCode")}
          </span>
          <span className="w-px h-6 bg-[#ECECF1] shrink-0" />
          <input
            id="phone"
            type="text"
            inputMode="numeric"
            autoComplete="tel"
            placeholder={t("auth.phonePlaceholder")}
            className="flex-1 txt-body font-main placeholder:text-[#7A7E95] border-0 outline-none bg-transparent text-[#0F1222]"
            {...form.register("phoneNumber")}
          />
        </div>

        {/* Field error */}
        {fieldError && (
          <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
            {fieldError}
          </p>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={registerMutation.isPending}
          block
          className="mt-[var(--space-6)]"
        >
          {registerMutation.isPending && (
            <Loader2 size={18} className="animate-spin" />
          )}
          {t("auth.login.button")}
        </Button>
      </form>

      {/* Bottom link */}
      <p className="text-center txt-caption font-main mt-[var(--space-4)]">
        <span className="text-[#7A7E95]">{t("auth.login.noAccount")} </span>
        <Link
          to="/register"
          className="text-[var(--color-brand-orange)] font-[var(--fw-ibm-semibold)] hover:underline"
        >
          {t("auth.login.createAccount")}
        </Link>
      </p>
    </AuthLayout>
  );
}
