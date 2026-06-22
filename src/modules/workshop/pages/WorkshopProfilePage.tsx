/**
 * @file WorkshopProfilePage.tsx
 *
 * Workshop profile / company info page.
 * Placeholder — full edit form arrives in the next phase.
 */

import { useTranslation } from "react-i18next";
import { UserCircle } from "lucide-react";
import { ProviderPageHeader, ProviderEmptyState } from "@shared/provider-ui";

export function WorkshopProfilePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 provider-fade-up">
      <ProviderPageHeader
        icon={<UserCircle className="h-5 w-5" aria-hidden />}
        title={t("workshop.profile.title")}
        subtitle={t("workshop.profile.subtitle")}
      />

      <ProviderEmptyState
        icon={<UserCircle className="h-10 w-10" aria-hidden />}
        title={t("workshop.profile.title")}
        description={t("workshop.profile.comingSoon")}
      />
    </div>
  );
}
