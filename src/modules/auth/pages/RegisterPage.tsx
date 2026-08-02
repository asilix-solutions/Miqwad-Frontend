import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Wrench, Store, Recycle, type LucideIcon } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { cn } from "@shared/lib/utils";
import type { ProviderType } from "@modules/providers/types";

/**
 * /register — provider-type chooser. Web signup is providers-only (customers
 * are app-only); this page just routes to /register/{type}, which renders
 * the actual per-type signup form (see @modules/auth/register/).
 */
export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const options: Array<{
    type: ProviderType;
    icon: LucideIcon;
    accentClass: string;
    accentBgClass: string;
    labelKey: string;
    descKey: string;
  }> = [
    {
      type: "workshop",
      icon: Wrench,
      accentClass: "text-[var(--color-brand-blue)]",
      accentBgClass: "bg-[var(--color-brand-blue)]/10",
      labelKey: "providers.choose.workshopLabel",
      descKey: "providers.choose.workshopDesc",
    },
    {
      type: "dealer",
      icon: Store,
      accentClass: "text-[var(--color-brand-orange)]",
      accentBgClass: "bg-[var(--color-brand-orange)]/10",
      labelKey: "providers.choose.dealerLabel",
      descKey: "providers.choose.dealerDesc",
    },
    {
      type: "scrap",
      icon: Recycle,
      accentClass: "text-emerald-600",
      accentBgClass: "bg-emerald-600/10",
      labelKey: "providers.choose.scrapLabel",
      descKey: "providers.choose.scrapDesc",
    },
  ];

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
        {t("providers.choose.title")}
      </h2>
      <p className="txt-subtitle font-main text-[#7A7E95] text-right mt-[var(--space-2)]">
        {t("providers.choose.subtitle")}
      </p>

      {/* Type options */}
      <div className="mt-[var(--space-8)] space-y-[var(--space-3)]">
        {options.map(({ type, icon: Icon, accentClass, accentBgClass, labelKey, descKey }) => (
          <Link
            key={type}
            to={`/register/${type}`}
            className="flex items-center gap-4 rounded-[var(--radius-md)] bg-white p-[var(--space-4)] shadow-[var(--shadow-card)] hover:shadow-md transition-shadow duration-200"
          >
            <span
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] shrink-0",
                accentBgClass,
              )}
            >
              <Icon size={22} className={accentClass} />
            </span>
            <span className="flex-1 text-right">
              <span className="block txt-body font-main font-[var(--fw-ibm-semibold)] text-[#0F1222]">
                {t(labelKey)}
              </span>
              <span className="block txt-caption font-main text-[#7A7E95] mt-0.5">
                {t(descKey)}
              </span>
            </span>
            <ChevronRight size={18} className="text-[#7A7E95] rotate-180 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Bottom link */}
      <p className="text-center txt-caption font-main mt-[var(--space-6)]">
        <span className="text-[#7A7E95]">{t("providers.choose.hasAccount")} </span>
        <Link
          to="/login"
          className="text-[var(--color-brand-orange)] font-[var(--fw-ibm-semibold)] hover:underline"
        >
          {t("providers.choose.signInLink")}
        </Link>
      </p>
    </AuthLayout>
  );
}
