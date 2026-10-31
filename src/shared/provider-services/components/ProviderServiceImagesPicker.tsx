/**
 * @file ProviderServiceImagesPicker.tsx
 *
 * Multi-image picker for provider inventory forms, shared across dealer, scrap, and workshop.
 * Shows existing image thumbnails (read-only — backend contract preserves existing images)
 * alongside newly picked files with preview and removal capabilities.
 *
 * Distinctive, high-clarity UX:
 * - Empty state: inviting dashed dropcard with clear formats guidance
 * - Populated state: responsive grid of aspect-square cards with status pills (New vs Existing)
 * - Safe removal buttons for newly staged files
 * - Clear note on edit mode regarding additive upload semantics
 */

import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Info, X } from "lucide-react";
import { cn } from "@shared/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp";

interface Props {
  existingImages: string[];
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function ProviderServiceImagesPicker({
  existingImages,
  files,
  onFilesChange,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const handlePick = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    onFilesChange([...files, ...Array.from(picked)]);
  };

  const removeAt = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const totalCount = existingImages.length + files.length;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header with image count badge */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--color-ink-body)]">
          {t("providerService.imagesPicker.images")}{" "}
          <span className="font-normal text-[var(--color-muted)]">({t("common.optional")})</span>
        </label>
        {totalCount > 0 && (
          <span className="rounded-full border border-[var(--color-divider)] bg-[var(--color-surface-2)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-ink-secondary)] select-none">
            {t("providerService.imagesPicker.selectedCount", { count: totalCount })}
          </span>
        )}
      </div>

      {/* Main Upload / Preview Area */}
      {totalCount === 0 ? (
        /* Empty State: Inviting Drop Card */
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group flex w-full items-center justify-between gap-4 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 p-4 text-start transition-all",
            !disabled &&
              "cursor-pointer hover:border-[var(--color-brand-orange)] hover:bg-[var(--color-brand-50)]/30",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] text-[var(--color-brand-orange)] shadow-xs transition-transform group-hover:scale-105">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--color-ink-body)] transition-colors group-hover:text-[var(--color-brand-orange)]">
                {t("providerService.imagesPicker.uploadPrompt")}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                {t("providerService.imagesPicker.uploadFormats")}
              </span>
            </div>
          </div>
          <span className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-secondary)] shadow-xs transition-colors group-hover:border-[var(--color-brand-orange)] group-hover:text-[var(--color-brand-orange)]">
            {t("providerService.imagesPicker.addImage")}
          </span>
        </button>
      ) : (
        /* Populated State: Grid of Thumbnails with action slot */
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {/* Existing images from server */}
          {existingImages.map((url) => (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface-2)] shadow-xs"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <span className="absolute start-1.5 bottom-1.5 rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs select-none">
                {t("providerService.imagesPicker.existingBadge")}
              </span>
            </div>
          ))}

          {/* Newly staged files with remove button */}
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-brand-orange)]/40 bg-[var(--color-surface-2)] shadow-xs"
            >
              <img src={previews[index]} alt="" className="h-full w-full object-cover" />
              <span className="absolute start-1.5 bottom-1.5 rounded-sm bg-[var(--color-brand-orange)] px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs select-none">
                {t("providerService.imagesPicker.newBadge")}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={t("common.delete")}
                  className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-all hover:scale-110 hover:bg-[var(--color-danger-500)]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}

          {/* Append more images slot */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            aria-label={t("providerService.imagesPicker.addImage")}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-divider)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-all",
              !disabled &&
                "cursor-pointer hover:border-[var(--color-brand-orange)] hover:bg-[var(--color-brand-50)]/30 hover:text-[var(--color-brand-orange)]",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px] font-medium">
              {t("providerService.imagesPicker.addImage")}
            </span>
          </button>
        </div>
      )}

      {/* Backend contract note for existing images */}
      {existingImages.length > 0 && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-divider)] bg-[var(--color-surface-2)] p-2.5 text-xs text-[var(--color-muted)]">
          <Info className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
          <span>{t("providerService.imagesPicker.imagesAddOnlyNote")}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          handlePick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
