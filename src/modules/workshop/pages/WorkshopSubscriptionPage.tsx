/**
 * @file WorkshopSubscriptionPage.tsx
 *
 * Subscription management for the workshop provider.
 * Placeholder — full subscription UI arrives in the next phase.
 */

import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import { ProviderPageHeader, ProviderEmptyState } from "@shared/provider-ui";

export function WorkshopSubscriptionPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 provider-fade-up">
      <ProviderPageHeader
        icon={<CreditCard className="h-5 w-5" aria-hidden />}
        title={t("workshop.subscription.title")}
        subtitle={t("workshop.subscription.subtitle")}
      />

      <ProviderEmptyState
        icon={<CreditCard className="h-10 w-10" aria-hidden />}
        title={t("workshop.subscription.emptyTitle")}
        description={t("workshop.subscription.comingSoon")}
      />
    </div>
  );
}
