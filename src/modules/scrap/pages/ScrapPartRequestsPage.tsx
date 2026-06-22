/**
 * @file ScrapPartRequestsPage.tsx
 *
 * Scrap provider part-requests list — placeholder pending full implementation.
 */

import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import { ProviderEmptyState } from "@shared/provider-ui/ProviderEmptyState";

export function ScrapPartRequestsPage() {
  const { t } = useTranslation();
  return (
    <ProviderEmptyState
      icon={<ClipboardList className="h-8 w-8" />}
      title={t("scrap.partRequests.title")}
      description={t("scrap.comingSoon")}
    />
  );
}
