import { Check } from "lucide-react";
import { cn } from "@shared/lib/utils";

/**
 * Generic horizontal stepper.
 *
 * Responsive behaviour:
 *  - lg+: full step labels next to each circle.
 *  - sm:  step circles only; the currently active step's label
 *         is shown below the bar.
 *  - xs:  numbered pill summary "Step n of m — label".
 *
 * RTL: the connecting line uses `inset-inline-*` so it flips
 * automatically based on `<html dir>`.
 */
export interface StepperStep {
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  /** Allow non-linear navigation: e.g. clicking an earlier step. */
  onStepClick?: (index: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Compact pill — visible on the smallest screens only. */}
      <div className="sm:hidden text-center mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-600 px-3 py-1 text-xs font-semibold">
          {currentStep + 1} / {steps.length}
        </span>
        <p className="mt-2 font-display text-sm font-semibold text-ink-900">
          {steps[currentStep]?.label}
        </p>
      </div>

      {/* Full bar on sm+. */}
      <ol className="hidden sm:flex items-center w-full">
        {steps.map((step, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          const isLast = i === steps.length - 1;
          const canJump = onStepClick && i <= currentStep;
          return (
            <li key={step.label} className="flex-1 flex items-center min-w-0">
              <button
                type="button"
                onClick={() => canJump && onStepClick?.(i)}
                disabled={!canJump}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex flex-col items-center gap-2 group min-w-0",
                  canJump && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isComplete && "bg-brand-500 border-brand-500 text-white",
                    isCurrent && "border-brand-500 text-brand-500 bg-white",
                    !isComplete && !isCurrent && "border-ink-200 text-ink-400 bg-white",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden lg:block text-xs font-medium whitespace-nowrap truncate max-w-[120px]",
                    isCurrent ? "text-brand-600" : isComplete ? "text-ink-700" : "text-ink-400",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {!isLast && (
                <span
                  className={cn(
                    "flex-1 h-0.5 mx-2 lg:mx-3 transition-colors",
                    i < currentStep ? "bg-brand-500" : "bg-ink-200",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
