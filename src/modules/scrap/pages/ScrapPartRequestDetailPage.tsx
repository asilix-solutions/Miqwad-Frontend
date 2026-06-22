/**
 * @file ScrapPartRequestDetailPage.tsx
 *
 * Scrap provider part-request detail — placeholder pending full implementation.
 */

import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import { ProviderEmptyState } from "@shared/provider-ui/ProviderEmptyState";

export function ScrapPartRequestDetailPage() {
  const { t } = useTranslation();
  return (
    <ProviderEmptyState
      icon={<ClipboardList className="h-8 w-8" />}
      title={t("scrap.partRequests.detailTitle")}
      description={t("scrap.comingSoon")}
    />
  );
}
