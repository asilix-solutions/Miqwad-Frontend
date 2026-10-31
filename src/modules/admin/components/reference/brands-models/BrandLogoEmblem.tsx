/**
 * @file BrandLogoEmblem.tsx
 * @description Accessible logo display for vehicle brands with graceful error fallback,
 * aspect-ratio containment, and elegant typography/emblem fallback.
 */
import { useState } from "react";
import { Car } from "lucide-react";

interface Props {
  image?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 min-w-8 text-xs rounded-md",
  md: "h-11 w-11 min-w-11 text-sm rounded-lg",
  lg: "h-14 w-14 min-w-14 text-base rounded-xl",
};

const ICON_SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function BrandLogoEmblem({ image, name, size = "md", className = "" }: Props) {
  // Store the URL that failed so we don't trigger cascading renders in an effect
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasError = Boolean(image && failedUrl === image);

  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const initial = name ? name.trim().charAt(0) : "";

  if (image && !hasError) {
    return (
      <div
        className={`relative flex items-center justify-center bg-white border border-[var(--color-divider)] overflow-hidden shadow-2xs ${sizeClass} ${className}`}
      >
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-contain p-1 select-none"
          onError={() => setFailedUrl(image)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center font-bold bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-brand-blue)] select-none shadow-2xs ${sizeClass} ${className}`}
      aria-label={name}
      title={name}
    >
      {initial ? (
        <span className="leading-none text-[var(--color-brand-orange)] font-semibold">
          {initial}
        </span>
      ) : (
        <Car className={`${ICON_SIZES[size]} text-[var(--color-muted)]`} aria-hidden="true" />
      )}
    </div>
  );
}
