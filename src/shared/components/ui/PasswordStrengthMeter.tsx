/**
 * @file PasswordStrengthMeter.tsx
 * @description Presentational password strength indicator (4-segment bar +
 * label). Reused by any auth flow that collects a new password. Exposes
 * `passwordStrengthScore` so form schemas (zod `.refine`) can share the same
 * scoring logic instead of re-implementing it.
 */
import { useTranslation } from "react-i18next";

interface PasswordStrengthMeterProps {
  password: string;
}

/** Scores a password 0-4 based on length, case mix, digits, and symbols. */
export function passwordStrengthScore(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  return score as 0 | 1 | 2 | 3 | 4;
}

const SEGMENT_COLORS = [
  "var(--color-danger-500)",
  "var(--color-warning-500)",
  "var(--color-info-500)",
  "var(--color-success-500)",
];

const LABEL_KEYS = [
  "auth.passwordStrength.weak",
  "auth.passwordStrength.weak",
  "auth.passwordStrength.fair",
  "auth.passwordStrength.good",
  "auth.passwordStrength.strong",
] as const;

/** Segmented strength bar + label for a live-typed password. */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t } = useTranslation();
  const score = passwordStrengthScore(password);
  const activeColor = SEGMENT_COLORS[Math.max(score - 1, 0)];

  if (!password) return null;

  return (
    <div className="mt-[var(--space-2)]">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((segment) => (
          <span
            key={segment}
            className="h-1.5 flex-1 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: segment < score ? activeColor : "var(--color-divider)",
            }}
          />
        ))}
      </div>
      <p
        className="txt-caption font-main text-end mt-[var(--space-1)]"
        style={{ color: activeColor }}
      >
        {t(LABEL_KEYS[score])}
      </p>
    </div>
  );
}
