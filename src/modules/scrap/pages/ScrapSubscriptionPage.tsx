/**
 * @file ScrapSubscriptionPage.tsx
 *
 * Scrap provider subscription — placeholder pending full implementation.
 */

import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import { ProviderEmptyState } from "@shared/provider-ui/ProviderEmptyState";

export function ScrapSubscriptionPage() {
  const { t } = useTranslation();
  return (
    <ProviderEmptyState
      icon={<CreditCard className="h-8 w-8" />}
      title={t("scrap.subscription.title")}
      description={t("scrap.comingSoon")}
    />
  );
}
