/**
 * @file Layer 1 engine (visual half) — renders one on-brand signup form
 * for a given per-type config (icon, accent, copy) inside <AuthLayout/>.
 * Fields are shared across all provider types this round (companyName,
 * email, phone, password); per-type field divergence is a config-file
 * change, not a shell change.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@shared/lib/utils";
import { useRegisterProviderForm } from "./useRegisterProviderForm";
import type { ProviderRegisterConfig } from "./config/types";

const fieldInputClass =
  "bg-white border-0 rounded-[var(--radius-md)] h-[var(--size-input-h)] px-[var(--space-4)] txt-body font-main text-[#0F1222] placeholder:text-[#7A7E95] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]/20 transition-all duration-200 w-full";

export function RegisterProviderShell({ config }: { config: ProviderRegisterConfig }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { form, onSubmit, isSubmitting } = useRegisterProviderForm(config);
  const errors = form.formState.errors;
  const Icon = config.icon;

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
          {errors.password && (
            <p className="txt-caption font-main text-[#E3460F] text-right mt-[var(--space-1)]">
              {t(errors.password.message ?? "")}
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
    </AuthLayout>
  );
}
