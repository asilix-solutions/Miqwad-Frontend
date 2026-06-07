import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@shared/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}

/**
 * Accessible OTP input (default 6-digit).
 * - Auto-advances when typing, retreats on Backspace.
 * - Supports paste of full code.
 * - Always renders LTR even in an RTL document because OTPs read L→R.
 * - Styled per the Maqwad brand design system.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  autoFocus,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setDigit = (index: number, char: string) => {
    const sanitized = char.replace(/\D/g, "").slice(0, 1);
    if (!sanitized && char) return; // ignore non-digits
    const next = digits.map((d, i) => (i === index ? sanitized : d)).join("");
    onChange(next);
    if (sanitized && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
    if (next.length === length && !next.includes("") && onComplete) {
      onComplete(next);
    }
  };

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text.padEnd(length, "").slice(0, length).replace(/ /g, ""));
    if (text.length === length && onComplete) onComplete(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div dir="ltr" className="flex justify-center gap-3">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-invalid={invalid}
          aria-label={`digit ${idx + 1}`}
          className={cn(
            "w-[var(--space-12)] h-[var(--size-input-h)] rounded-[var(--radius-md)] border-0 bg-white txt-display-m font-[var(--fw-ibm-bold)] text-[#0F1222] text-center",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]/20",
            "transition-all duration-200",
            invalid && "ring-2 ring-danger-500/20",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onChange={(e) => setDigit(idx, e.target.value)}
          onKeyDown={handleKeyDown(idx)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
