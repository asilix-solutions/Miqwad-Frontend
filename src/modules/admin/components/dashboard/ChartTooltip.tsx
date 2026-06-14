
export interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  formatter?: (value: number | string) => string;
}

/**
 * A reusable, theme-consistent tooltip for recharts.
 */
export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-1)] text-sm">
      <p className="mb-2 font-medium text-[var(--color-ink-body)]">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => {
          const val = formatter ? formatter(entry.value) : entry.value;
          return (
            <div key={`item-${index}`} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[var(--color-muted)]">{entry.name}:</span>
              <span className="font-semibold text-[var(--color-ink-body)]">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
