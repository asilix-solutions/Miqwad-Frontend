import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import type { ProviderRegisterDraft } from "../store/providersSlice";

interface Props {
  draft: ProviderRegisterDraft;
  onBack: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}

/**
 * Final review step — summarises everything captured so far and
 * fires the registration mutation.
 */
export function RegisterStepReview({ draft, onBack, onSubmit, submitting }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const categoriesQ = useServiceCategoriesQuery();
  const categoryName = (id: number): string => {
    const c = categoriesQ.data?.find((x) => x.id === id);
    if (!c) return String(id);
    return isAr ? c.nameAr : c.nameEn;
  };

  return (
    <div className="space-y-4">
      <header>
        <h3 className="font-display text-base font-semibold text-ink-900">
          {t("providers.review.title")}
        </h3>
      </header>

      <section className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-4 space-y-3">
        <h4 className="font-display text-sm font-semibold text-ink-900">
          {t("providers.steps.company")}
        </h4>
        <KV label={t("providers.fields.companyName")} value={draft.company.companyName ?? "—"} />
        <KV label={t("providers.fields.email")} value={draft.company.email ?? "—"} />
        <KV label={t("providers.fields.phone")} value={draft.company.phone ?? "—"} />
      </section>

      <section className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-4 space-y-3">
        <h4 className="font-display text-sm font-semibold text-ink-900">
          {t("providers.steps.location")}
        </h4>
        <KV
          label={t("providers.fields.address")}
          value={draft.location.address || t("common.none")}
        />
        <KV
          label={t("providers.fields.city")}
          value={draft.location.city || t("common.none")}
        />
        <KV
          label={t("providers.fields.workingHours")}
          value={draft.location.workingHours || t("common.none")}
        />
      </section>

      <section className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-4 space-y-3">
        <h4 className="font-display text-sm font-semibold text-ink-900">
          {t("providers.steps.services")}
        </h4>
        {draft.categoryIds.length === 0 ? (
          <p className="text-sm text-ink-500">{t("providers.review.noServices")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {draft.categoryIds.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-600 px-3 py-1 text-xs font-medium"
              >
                {categoryName(id)}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-4 space-y-3">
        <h4 className="font-display text-sm font-semibold text-ink-900">
          {t("providers.steps.documents")}
        </h4>
        {draft.documents.length === 0 ? (
          <p className="text-sm text-ink-500">{t("providers.review.noDocuments")}</p>
        ) : (
          <ul className="text-sm text-ink-700 space-y-1">
            {draft.documents.map((d) => (
              <li key={d.type} className="flex items-center justify-between gap-2">
                <span>{t(`providers.kyc.${d.type}` as const)}</span>
                <span className="text-xs text-ink-400 truncate max-w-[60%]">{d.fileName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col-reverse gap-2 pt-4 border-t border-ink-100 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          {t("common.back")}
        </Button>
        <Button type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? t("common.loading") : t("providers.review.submit")}
        </Button>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-100 pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-ink-500">{label}</span>
      <span className="text-sm font-medium text-ink-900 text-end break-words">{value}</span>
    </div>
  );
}
