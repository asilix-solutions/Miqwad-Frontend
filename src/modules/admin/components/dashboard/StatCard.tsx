import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

type StatCardTone = "brand" | "success" | "warning" | "danger" | "neutral";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatCardTone;
  isLoading?: boolean;
  trend?: number;
  invertTrendColor?: boolean;
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
  trend,
  invertTrendColor = false,
}: StatCardProps) {
  const { bgStyle, color } = toneMap[tone];
  const { i18n } = useTranslation();
  const nf = new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US");

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
          <div className="flex flex-col gap-1">
            <span className="tabular-nums text-[28px] font-bold leading-[1.1] text-[var(--color-ink-body)]">
              {value}
            </span>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {trend >= 0 ? (
                  <TrendingUp
                    className="h-3.5 w-3.5"
                    style={{ color: invertTrendColor ? "var(--color-danger-500)" : "var(--color-success-500)" }}
                  />
                ) : (
                  <TrendingDown
                    className="h-3.5 w-3.5"
                    style={{ color: invertTrendColor ? "var(--color-success-500)" : "var(--color-danger-500)" }}
                  />
                )}
                <span
                  className="text-xs font-medium"
                  style={{
                    color: trend === 0 
                      ? "var(--color-muted)" 
                      : (trend > 0 ? (invertTrendColor ? "var(--color-danger-500)" : "var(--color-success-500)") : (invertTrendColor ? "var(--color-success-500)" : "var(--color-danger-500)"))
                  }}
                >
                  {nf.format(Math.abs(trend))}%
                </span>
              </div>
            )}
          </div>
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
