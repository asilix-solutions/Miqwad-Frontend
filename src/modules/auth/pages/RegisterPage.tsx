import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, User, Mail, ChevronDown, Loader2 } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { Button } from "@shared/components/ui/button";
import { registerSchema, type RegisterFormData } from "../schemas/auth.schemas";

/**
 * Register page — new account request.
 * Fields: name, phone, email, account type.
 * On submit: placeholder (no backend endpoint yet).
 */
export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
      accountType: "provider",
    },
    mode: "onSubmit",
  });

  const isSubmitting = form.formState.isSubmitting;
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(async (values) => {
    // TODO: wire to POST /auth/register
    console.log("Register form submitted:", values);
  });

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

      {/* Title + subtitle */}
      <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-right">
        {t("auth.register.title")}
      </h2>
      <p className="txt-subtitle font-main text-[#7A7E95] text-right mt-[var(--space-2)]">
        {t("auth.register.subtitle")}
      </p>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-[var(--space-8)] space-y-[var(--space-4)]" noValidate>
        {/* ── Full Name ────────────────────────────────────────── */}
        <div>
          <label className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]">
            {t("auth.register.fullNameLabel")}
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7E95]"
            />
            <input
              type="text"
              placeholder={t("auth.register.fullNamePlaceholder")}
              className="bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] pl-10 txt-body font-main text-[#0F1222] placeholder:text-[#7A7E95] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]/20 transition-all duration-200 w-full"
              {...form.register("fullName")}
            />
          </div>
          {errors.fullName && (
            <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* ── Phone ────────────────────────────────────────────── */}
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
              {...form.register("phoneNumber")}
            />
          </div>
          {errors.phoneNumber && (
            <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        {/* ── Email ────────────────────────────────────────────── */}
        <div>
          <label className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]">
            {t("auth.register.emailLabel")}
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7E95]"
            />
            <input
              type="email"
              placeholder={t("auth.register.emailPlaceholder")}
              className="bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] pl-10 txt-body font-main text-[#0F1222] placeholder:text-[#7A7E95] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]/20 transition-all duration-200 w-full"
              {...form.register("email")}
            />
          </div>
          {errors.email && (
            <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ── Account Type ─────────────────────────────────────── */}
        <div>
          <label className="block txt-caption font-main font-[var(--fw-ibm-medium)] text-[#0F1222] text-right mb-[var(--space-1)]">
            {t("auth.register.accountTypeLabel")}
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7E95] pointer-events-none"
            />
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A7E95] pointer-events-none"
            />
            <select
              className="appearance-none w-full h-[var(--size-input-h)] rounded-[var(--radius-md)] border-0 bg-white px-[var(--space-4)] pl-10 pr-10 txt-body font-main text-[#0F1222] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]/20 transition-all duration-200"
              {...form.register("accountType")}
            >
              <option value="provider">
                {t("auth.register.providerOption")}
              </option>
              <option value="customer">
                {t("auth.register.customerOption")}
              </option>
            </select>
          </div>
          {errors.accountType && (
            <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
              {errors.accountType.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          block
          className="mt-[var(--space-10)]"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          {t("auth.register.submitButton")}
        </Button>
      </form>

      {/* Bottom link */}
      <p className="text-center txt-caption font-main mt-[var(--space-4)]">
        <span className="text-[#7A7E95]">{t("auth.register.hasAccount")} </span>
        <Link
          to="/login"
          className="text-[var(--color-brand-orange)] font-[var(--fw-ibm-semibold)] hover:underline"
        >
          {t("auth.register.signInLink")}
        </Link>
      </p>
    </AuthLayout>
  );
}
