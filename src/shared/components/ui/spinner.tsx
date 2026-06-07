import { cn } from "@shared/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export function Spinner({ className, size = "sm" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={cn(
        "inline-block animate-spin rounded-full border-ink-200 border-t-brand-500",
        sizeMap[size],
        className,
      )}
    />
  );
}
