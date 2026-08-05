/**
 * @file ServicesTabStub.tsx
 * @description Placeholder for the "الخدمات" tab — Service-tree management
 * is a later phase; this tab currently only backs the assign picker via
 * `useServicesTreeQuery`.
 */

import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";

export function ServicesTabStub() {
  const { t } = useTranslation();

  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] bg-[var(--color-surface)] py-16 px-6 text-center space-y-3">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-orange)]/10">
        <Layers className="h-6 w-6 text-[var(--color-brand-orange)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-ink-body)]">
        {t("superAdmin.taxonomy.servicesTab.title")} — {t("superAdmin.taxonomy.servicesTab.comingSoon")}
      </h3>
      <p className="text-sm text-[var(--color-muted)] max-w-sm mx-auto">
        {t("superAdmin.taxonomy.servicesTab.comingSoonDescription")}
      </p>
    </div>
  );
}
