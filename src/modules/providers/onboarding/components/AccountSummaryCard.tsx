/**
 * @file AccountSummaryCard.tsx
 *
 * Small white surface card displaying a muted label above a bold value.
 * Used in the Account Summary step of the provider onboarding flow to
 * show account details (type, owner, email, phone) in a 2×2 grid.
 *
 * Design tokens:
 *  - Background: var(--color-surface)
 *  - Border radius: var(--radius-md)
 *  - Shadow: var(--shadow-card)
 *  - Font: var(--font-main)
 */

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AccountSummaryCardProps {
  /** Muted top label (e.g. "نوع الحساب"). */
  label: string;
  /** Bold value displayed below the label (e.g. "مزود خدمة"). */
  value: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccountSummaryCard({ label, value }: AccountSummaryCardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-card)",
        padding: "var(--space-5) var(--space-6)",
        fontFamily: "var(--font-main)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
      }}
    >
      <span
        className="txt-caption"
        style={{
          color: "var(--color-muted)",
          fontWeight: 400,
        }}
      >
        {label}
      </span>

      <span
        className="txt-body"
        style={{
          color: "var(--color-ink-body)",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}
