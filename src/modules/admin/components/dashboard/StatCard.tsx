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

const toneMap: Record<StatCardTone, { bg: string; text: string }> = {
  brand: { bg: "bg-[var(--color-brand-100)]", text: "text-[var(--color-brand-orange)]" },
  success: { bg: "bg-[var(--color-success-50)]", text: "text-[var(--color-success-500)]" },
  warning: { bg: "bg-[var(--color-warning-50)]", text: "text-[var(--color-warning-500)]" },
  danger: { bg: "bg-[var(--color-danger-50)]", text: "text-[var(--color-danger-500)]" },
  neutral: { bg: "bg-[var(--color-ink-100)]", text: "text-[var(--color-ink-500)]" },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  tone = "neutral",
  isLoading = false,
}: StatCardProps) {
  const { bg, text } = toneMap[tone];

  return (
    <Card className="flex flex-col items-center justify-center text-center gap-3 p-6 transition-shadow hover:shadow-md">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg} ${text}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-[var(--color-muted)]">{title}</span>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className="text-2xl font-bold text-[var(--color-ink-body)]">{value}</span>
        )}
      </div>
    </Card>
  );
}
