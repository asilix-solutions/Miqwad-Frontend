/**
 * @file ScrapConversationsPage.tsx
 *
 * Scrap provider conversations — deferred entry point for the external chat system.
 * No chat logic here; wired externally later.
 */

import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { ProviderEmptyState } from "@shared/provider-ui/ProviderEmptyState";

export function ScrapConversationsPage() {
  const { t } = useTranslation();
  return (
    <ProviderEmptyState
      icon={<MessageSquare className="h-8 w-8" />}
      title={t("scrap.conversations.title")}
      description={t("scrap.conversations.comingSoonNote")}
    />
  );
}
