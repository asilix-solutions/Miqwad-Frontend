import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type StatCardTone = "brand" | "success" | "warning" | "danger" | "neutral";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatCardTone;
  isLoading?: boolean;
}

const toneMap: Record<StatCardTone, { bgStyle: string; color: string }> = {
  brand: { bgStyle: "color-mix(in srgb, var(--color-brand-orange) 12%, transparent)", color: "var(--color-brand-orange)" },
  success: { bgStyle: "color-mix(in srgb, var(--color-success-500) 12%, transparent)", color: "var(--color-success-500)" },
  warning: { bgStyle: "color-mix(in srgb, var(--color-warning-500) 12%, transparent)", color: "var(--color-warning-500)" },
  danger: { bgStyle: "color-mix(in srgb, var(--color-danger-500) 12%, transparent)", color: "var(--color-danger-500)" },
  neutral: { bgStyle: "var(--color-surface-2)", color: "var(--color-ink-secondary)" },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  tone = "neutral",
  isLoading = false,
}: StatCardProps) {
  const { bgStyle, color } = toneMap[tone];

  return (
    <Card className="relative flex flex-row items-start justify-between overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)] transition-shadow duration-200 hover:shadow-[var(--shadow-2)]">
      {/* Accent Detail */}
      <div
        className="absolute inset-y-0 start-0 w-[3px] opacity-60"
        style={{ backgroundColor: color }}
      />

      <div className="flex flex-col text-start">
        <span className="mb-2 text-[13px] font-medium text-[var(--color-muted)]">
          {title}
        </span>
        {isLoading ? (
          <Skeleton className="h-[28px] w-[80px]" />
        ) : (
          <span className="tabular-nums text-[28px] font-bold leading-[1.1] text-[var(--color-ink-body)]">
            {value}
          </span>
        )}
      </div>

      <div
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: isLoading ? "var(--color-surface-2)" : bgStyle,
          color: color,
        }}
      >
        <Icon className="h-[22px] w-[22px]" />
      </div>
    </Card>
  );
}
