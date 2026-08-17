/**
 * @file ProviderServiceImagesPicker.tsx
 *
 * Multi-image picker for the provider-service form, shared by every
 * provider type. Shows existing image thumbnails (read-only — the backend
 * has no confirmed image-removal path, so there is no remove control on
 * them) alongside newly picked files, which CAN be removed before submit.
 * Selecting more files always appends (additive on PUT, matches the
 * confirmed backend contract).
 */

import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@shared/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp";

interface Props {
  existingImages: string[];
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function ProviderServiceImagesPicker({ existingImages, files, onFilesChange, disabled }: Props) {
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

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-[var(--color-ink-body)]">
        {t("providerService.imagesPicker.images")}
      </p>

      <div className="flex flex-wrap gap-3">
        {existingImages.map((url) => (
          <div
            key={url}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface-2)]"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}

        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface-2)]"
          >
            <img src={previews[index]} alt="" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={t("common.delete")}
                className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-divider)] text-[var(--color-muted)] transition-colors duration-[var(--dur-fast)]",
            !disabled && "hover:border-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange)]",
          )}
        >
          <ImagePlus className="h-5 w-5" aria-hidden />
          <span className="text-[10px]">{t("providerService.imagesPicker.addImage")}</span>
        </button>

        {existingImages.length === 0 && files.length === 0 && (
          <div className="flex h-20 items-center gap-2 px-2 text-xs text-[var(--color-muted)]">
            <ImageIcon className="h-4 w-4 shrink-0" aria-hidden />
            {t("providerService.imagesPicker.imagesEmpty")}
          </div>
        )}
      </div>

      {existingImages.length > 0 && (
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          {t("providerService.imagesPicker.imagesAddOnlyNote")}
        </p>
      )}

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
