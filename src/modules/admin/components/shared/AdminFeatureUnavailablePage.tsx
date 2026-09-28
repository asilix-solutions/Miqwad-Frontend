import { Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

/** Deliberate product availability state, not a request failure or loading state. */
export function AdminFeatureUnavailablePage() {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="admin-feature-unavailable-title"
      className="flex flex-col items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] px-6 py-12 text-center sm:py-16"
    >
      <Clock3 className="h-8 w-8 text-[var(--color-muted)]" aria-hidden="true" />
      <Badge variant="neutral">{t("admin.featureUnavailable.badge")}</Badge>
      <h1
        id="admin-feature-unavailable-title"
        className="text-xl font-semibold text-[var(--color-ink-body)]"
      >
        {t("admin.featureUnavailable.title")}
      </h1>
      <p className="max-w-lg text-sm leading-7 text-[var(--color-muted)]">
        {t("admin.featureUnavailable.description")}
      </p>
    </section>
  );
}
