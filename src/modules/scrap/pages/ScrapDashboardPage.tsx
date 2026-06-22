/**
 * @file ScrapDashboardPage.tsx
 *
 * Scrap provider dashboard — placeholder pending full implementation.
 */

import { useTranslation } from "react-i18next";
import { LayoutDashboard } from "lucide-react";
import { ProviderEmptyState } from "@shared/provider-ui/ProviderEmptyState";

export function ScrapDashboardPage() {
  const { t } = useTranslation();
  return (
    <ProviderEmptyState
      icon={<LayoutDashboard className="h-8 w-8" />}
      title={t("scrap.dashboard.title")}
      description={t("scrap.comingSoon")}
    />
  );
}
