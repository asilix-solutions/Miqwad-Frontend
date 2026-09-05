/**
 * @file AdvertisementsEmptyState.tsx
 * @description Friendly empty state for the admin Advertisements list, with
 * a create CTA — shown when the live list has zero items.
 */
import { useTranslation } from "react-i18next";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdvertisementsEmptyStateProps {
  onCreate: () => void;
}

export function AdvertisementsEmptyState({ onCreate }: AdvertisementsEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] bg-[var(--color-surface)] px-6 py-16 text-center shadow-[var(--shadow-1)]"
      role="status"
    >
      <div className="relative mb-6 h-20 w-20" aria-hidden>
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)]">
          <Megaphone className="h-9 w-9 text-[var(--color-muted)]" />
        </div>
      </div>

      <h2 className="text-base font-semibold text-[var(--color-ink-body)]">
        {t("superAdmin.ads.empty.title")}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--color-muted)]">
        {t("superAdmin.ads.empty.description")}
      </p>

      <Button type="button" className="mt-5" onClick={onCreate}>
        <Plus className="size-4" />
        {t("superAdmin.ads.create")}
      </Button>
    </div>
  );
}
