/**
 * @file LoginPage.tsx
 * @description Sprint 1 login page. Default mode is phone/OTP (unchanged,
 * visually identical to the original). A local toggle switches to an
 * email/password mode that authenticates via the PROVISIONAL `/auth/login`
 * contract (see `useLoginMutation` — pending backend OQ1,
 * BACKEND_API_REQUIREMENTS.md:1049). Both modes funnel into the same
 * `setCredentials` session wiring and reuse `defaultHomeFor()` for role
 * routing.
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import {
  emailLoginSchema,
  phoneSchema,
  type EmailLoginFormValues,
  type PhoneFormValues,
} from "../schemas/auth.schemas";
import { useLoginMutation, useRegisterMutation } from "../hooks/useAuthMutations";
import { useAppSelector } from "@app/store";
import { defaultHomeFor } from "@shared/guards/RoleGuard";

type LoginMode = "phone" | "email";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const pending = useAppSelector((s) => s.auth.pendingVerification);

  const [mode, setMode] = useState<LoginMode>("phone");

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
    mode: "onSubmit",
  });

  const emailForm = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { identifier: "", password: "" },
    mode: "onSubmit",
  });

  const registerMutation = useRegisterMutation();
  const loginMutation = useLoginMutation();

  const [showPassword, setShowPassword] = useState(false);

  // If a verification is already in progress (e.g. user reloaded the OTP page
  // and came back) skip back into the flow.
  useEffect(() => {
    if (pending) {
      navigate("/verify-otp", { replace: true });
    }
  }, [pending, navigate]);

  const onPhoneSubmit = phoneForm.handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync({ phoneNumber: values.phoneNumber });
      navigate("/verify-otp");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.unknown");
      toast.error(t("auth.invalidPhone"), message);
    }
  });

  const onEmailSubmit = emailForm.handleSubmit(async (values) => {
    try {
      const res = await loginMutation.mutateAsync(values);
      navigate(defaultHomeFor(res.user.role));
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(t("auth.login.invalidCredentials"), message);
    }
  });

  const toggleMode = () => {
    setMode((m) => (m === "phone" ? "email" : "phone"));
    setShowPassword(false);
  };

  const phoneFieldError = phoneForm.formState.errors.phoneNumber?.message;
  const identifierError = emailForm.formState.errors.identifier?.message;
  const passwordError = emailForm.formState.errors.password?.message;

  return (
    <AuthLayout>
      {/* Title + subtitle */}
      <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-right">
        {t("auth.login.title")}
      </h2>
      <p className="txt-subtitle font-main text-[#7A7E95] text-right mt-[var(--space-2)]">
        {mode === "phone" ? t("auth.login.subtitle") : t("auth.login.emailSubtitle")}
      </p>

      {/* Phone/OTP mode (default, visually unchanged) */}
      <div
        className={`transition-all duration-200 ${
          mode === "phone" ? "opacity-100" : "hidden opacity-0"
        }`}
      >
        <form onSubmit={onPhoneSubmit} className="mt-[var(--space-8)]" noValidate>
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
              {...phoneForm.register("phoneNumber")}
            />
          </div>

          {/* Field error */}
          {phoneFieldError && (
            <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
              {phoneFieldError}
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
      </div>

      {/* Email/password mode */}
      <div
        className={`transition-all duration-200 ${
          mode === "email" ? "opacity-100" : "hidden opacity-0"
        }`}
      >
        <form onSubmit={onEmailSubmit} className="mt-[var(--space-8)]" noValidate>
          {/* Email label */}
          <label
            htmlFor="identifier"
            className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]"
          >
            {t("auth.login.emailLabel")}
          </label>
          <div className="flex items-center bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] gap-3 focus-within:ring-2 focus-within:ring-[var(--color-brand-orange)]/20 transition-all duration-200">
            <input
              id="identifier"
              type="email"
              autoComplete="email"
              placeholder={t("auth.login.emailPlaceholder")}
              className="flex-1 txt-body font-main placeholder:text-[#7A7E95] border-0 outline-none bg-transparent text-[#0F1222]"
              {...emailForm.register("identifier")}
            />
          </div>
          {identifierError && (
            <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
              {identifierError}
            </p>
          )}

          {/* Password label */}
          <label
            htmlFor="password"
            className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)] mt-[var(--space-4)]"
          >
            {t("auth.login.passwordLabel")}
          </label>
          <div className="flex items-center bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] gap-3 focus-within:ring-2 focus-within:ring-[var(--color-brand-orange)]/20 transition-all duration-200">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("auth.login.passwordPlaceholder")}
              className="flex-1 txt-body font-main placeholder:text-[#7A7E95] border-0 outline-none bg-transparent text-[#0F1222]"
              {...emailForm.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={
                showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")
              }
              className="shrink-0 text-[#7A7E95] hover:text-[#0F1222] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && (
            <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
              {passwordError}
            </p>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            block
            className="mt-[var(--space-6)]"
          >
            {loginMutation.isPending && <Loader2 size={18} className="animate-spin" />}
            {t("auth.login.button")}
          </Button>
        </form>
      </div>

      {/* Mode toggle */}
      <p className="text-center txt-caption font-main mt-[var(--space-4)]">
        <button
          type="button"
          onClick={toggleMode}
          className="text-[var(--color-brand-orange)] font-[var(--fw-ibm-semibold)] hover:underline"
        >
          {mode === "phone" ? t("auth.login.switchToEmail") : t("auth.login.switchToPhone")}
        </button>
      </p>

      {/* Bottom link */}
      <p className="text-center txt-caption font-main mt-[var(--space-2)]">
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
