/**
 * @file ComingSoonSection.tsx
 * @description A labeled, visually-muted frame for a detail section the backend
 * does not populate yet. Renders a "قريباً / Coming soon" chip and dimmed
 * placeholder content — NEVER fabricated values. When the matching optional
 * field on the Invoice view-model becomes present, the parent passes `ready`
 * and real content renders at full opacity instead.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";

interface ComingSoonSectionProps {
  icon: LucideIcon;
  title: string;
  /** When true, the backend now provides this data — render children normally. */
  ready?: boolean;
  children: ReactNode;
}

export function ComingSoonSection({ icon: Icon, title, ready = false, children }: ComingSoonSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)]"
      aria-disabled={!ready}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-body)]">
          <Icon className="h-4 w-4 text-[var(--color-muted)]" aria-hidden />
          {title}
        </h3>
        {!ready && (
          <span className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-muted)]">
            {t("invoices.comingSoonLabel")}
          </span>
        )}
      </header>
      <div className={ready ? undefined : "pointer-events-none select-none opacity-40"}>
        {children}
      </div>
    </section>
  );
}
