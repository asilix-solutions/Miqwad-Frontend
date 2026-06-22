/**
 * @file WorkshopConversationsPage.tsx
 *
 * Deferred chat entry point for the workshop provider.
 * Client conversations are handled by Maqwad's external chat system.
 * This page is a clean placeholder — no chat UI, no message data.
 * Wire-in: replace the disabled button handler once the chat module is integrated.
 */

import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { ProviderPageHeader, ProviderEmptyState } from "@shared/provider-ui";

export function WorkshopConversationsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 provider-fade-up">
      <ProviderPageHeader
        icon={<MessageSquare className="h-5 w-5" aria-hidden />}
        title={t("workshop.conversations.title")}
        subtitle={t("workshop.conversations.subtitle")}
      />

      <ProviderEmptyState
        icon={<MessageSquare className="h-10 w-10" aria-hidden />}
        title={t("workshop.conversations.title")}
        description={t("workshop.conversations.comingSoonNote")}
        action={
          // TODO: wire to chat system (external module) — no chat logic implemented here
          <button
            type="button"
            disabled
            className={[
              "inline-flex items-center gap-2 px-5 py-2.5",
              "rounded-[var(--radius-md)] text-sm font-semibold",
              "bg-[var(--color-brand-orange)] text-white",
              "opacity-50 cursor-not-allowed",
            ].join(" ")}
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            {t("workshop.conversations.openChat")}
          </button>
        }
      />
    </div>
  );
}
