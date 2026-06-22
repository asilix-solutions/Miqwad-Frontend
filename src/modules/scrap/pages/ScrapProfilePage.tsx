/**
 * @file ScrapProfilePage.tsx
 *
 * Scrap provider profile — placeholder pending full implementation.
 */

import { useTranslation } from "react-i18next";
import { UserCircle } from "lucide-react";
import { ProviderEmptyState } from "@shared/provider-ui/ProviderEmptyState";

export function ScrapProfilePage() {
  const { t } = useTranslation();
  return (
    <ProviderEmptyState
      icon={<UserCircle className="h-8 w-8" />}
      title={t("scrap.profile.title")}
      description={t("scrap.comingSoon")}
    />
  );
}
