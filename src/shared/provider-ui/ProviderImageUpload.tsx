/**
 * @file ProviderImageUpload.tsx
 *
 * Image upload with drag-and-drop zone and live preview thumbnails.
 * For single mode: shows the dropzone until an image is picked; then shows the
 * preview with a remove button to start over.
 * For multiple mode: dropzone is always visible alongside the accumulated previews.
 *
 * For the mock / no-backend phase, selected files are read as base64 data URLs and
 * emitted via onChange so they can be stored as strings in product state.
 * FUTURE: replace local data URL with real upload endpoint (.NET) returning a URL.
 *
 * All visible text (label, hint, error, dropLabel) comes from the caller.
 * No i18n inside this component.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import {
  useRef,
  useState,
  useCallback,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, ImageUp, X } from "lucide-react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProviderImageUpload}. */
export interface ProviderImageUploadProps {
  /**
   * Current image(s) as a data URL string (single) or array (multiple).
   * An empty string or empty array means no image selected.
   */
  value?: string | string[];
  /**
   * Called after a successful file pick or after removal.
   * Emits a `string` in single mode, `string[]` in multiple mode.
   */
  onChange: (value: string | string[]) => void;
  /** Allow selecting multiple images. @default false */
  multiple?: boolean;
  /** Maximum file size in megabytes. @default 5 */
  maxSizeMB?: number;
  /** Label rendered above the upload zone. */
  label?: string;
  /** Helper text rendered below (muted). Hidden when error is set. */
  hint?: string;
  /**
   * Error message rendered below the zone (danger colour).
   * Covers both caller-supplied validation errors and internal size/type errors.
   */
  error?: string;
  /**
   * Copy text inside the dropzone body (e.g. "Drag an image here, or click to browse").
   * Must be translated by the consumer before passing.
   */
  dropLabel?: string;
  /**
   * In single-image mode, display the selected image as a wide banner-ratio preview
   * instead of a square thumbnail. Has no effect when `multiple` is true.
   */
  widePreview?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return [v];
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider image upload — dropzone with thumbnail previews.
 *
 * @example
 * ```tsx
 * <ProviderImageUpload
 *   label={t("dealer.products.form.images")}
 *   dropLabel={t("dealer.products.form.dropImage")}
 *   hint={t("dealer.products.form.imageHint")}
 *   value={watch("images")}
 *   onChange={(urls) => setValue("images", urls as string[])}
 *   multiple
 *   maxSizeMB={8}
 *   error={errors.images?.message && t(errors.images.message)}
 * />
 * ```
 */
export function ProviderImageUpload({
  value,
  onChange,
  multiple = false,
  maxSizeMB = 5,
  label,
  hint,
  error: externalError,
  dropLabel,
  widePreview = false,
}: ProviderImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const previews = toArray(value);
  const maxBytes = maxSizeMB * 1024 * 1024;

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setInternalError(null);

      const incoming = Array.from(files);

      for (const file of incoming) {
        if (!file.type.startsWith("image/")) {
          setInternalError(`Invalid file type: ${file.name}`);
          return;
        }
        if (file.size > maxBytes) {
          setInternalError(`File exceeds ${maxSizeMB} MB limit.`);
          return;
        }
      }

      // FUTURE: replace local data URL with real upload endpoint (.NET) returning a URL.
      const dataUrls = await Promise.all(incoming.map(readAsDataURL));

      if (multiple) {
        onChange([...previews, ...dataUrls]);
      } else {
        onChange(dataUrls[0]);
      }
    },
    [maxBytes, maxSizeMB, multiple, onChange, previews],
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void processFiles(e.target.files);
    // Reset so re-selecting the same file fires onChange again
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    void processFiles(e.dataTransfer.files);
  };

  const removeAt = (index: number) => {
    setInternalError(null);
    if (multiple) {
      onChange(previews.filter((_, i) => i !== index));
    } else {
      onChange("");
    }
  };

  const displayError = externalError ?? internalError ?? undefined;
  const showDropzone = multiple || previews.length === 0;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-[var(--color-ink-body)]">
          {label}
        </span>
      )}

      {/* ── Dropzone ───────────────────────────────────────────────────────── */}
      {showDropzone && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            "cursor-pointer select-none",
            "rounded-[var(--radius-lg)] border-2 border-dashed",
            "flex flex-col items-center justify-center gap-3 p-8 text-center",
            "transition-colors duration-[var(--dur-fast)]",
            dragOver
              ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-50)]"
              : [
                  "border-[var(--color-divider)] bg-[var(--color-surface)]",
                  "hover:border-[var(--color-brand-orange)]/50 hover:bg-[var(--color-surface-2)]",
                ],
            displayError && !dragOver && "border-[var(--color-danger-500)]/60",
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              "transition-colors duration-[var(--dur-fast)]",
              dragOver
                ? "bg-[var(--color-brand-100)] text-[var(--color-brand-orange)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
            )}
          >
            <ImagePlus className="h-6 w-6" aria-hidden />
          </div>

          {dropLabel && (
            <p className="max-w-[16rem] text-sm text-[var(--color-muted)]">
              {dropLabel}
            </p>
          )}
        </div>
      )}

      {/* ── Preview thumbnails / wide banner preview ──────────────────────── */}
      {previews.length > 0 && (
        widePreview && !multiple ? (
          <div
            className="group relative w-full overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-provider-sm)]"
            style={{ aspectRatio: "16 / 4" }}
          >
            <img
              src={previews[0]}
              alt=""
              aria-hidden
              className="h-full w-full object-cover"
            />
            {/* Action overlay — always focusable, visible on hover/focus */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center gap-3",
                "bg-[var(--color-ink-body)]/40 opacity-0",
                "transition-opacity duration-[var(--dur-fast)]",
                "group-hover:opacity-100",
                "focus-within:opacity-100",
              )}
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label={t("providerUi.imageUpload.change")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5",
                  "bg-white/90 text-[var(--color-ink-body)] text-xs font-medium",
                  "hover:bg-white transition-colors duration-[var(--dur-fast)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                )}
              >
                <ImageUp className="h-3.5 w-3.5" aria-hidden />
                {t("providerUi.imageUpload.change")}
              </button>
              <button
                type="button"
                onClick={() => removeAt(0)}
                aria-label={t("providerUi.imageUpload.remove")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5",
                  "bg-white/20 text-white text-xs font-medium",
                  "hover:bg-white/30 transition-colors duration-[var(--dur-fast)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                )}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                {t("providerUi.imageUpload.remove")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {previews.map((src, i) => (
              <div
                key={i}
                className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-provider-sm)]"
              >
                <img
                  src={src}
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover"
                />
                {/* Remove overlay — appears on hover */}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Remove image"
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    "bg-[var(--color-ink-body)]/50 opacity-0",
                    "transition-opacity duration-[var(--dur-fast)]",
                    "group-hover:opacity-100",
                    "focus-visible:opacity-100 focus-visible:outline-none",
                  )}
                >
                  <X className="h-5 w-5 text-white" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      {/* Error / hint */}
      {displayError && (
        <p role="alert" className="text-xs text-[var(--color-danger-500)]">
          {displayError}
        </p>
      )}

      {!displayError && hint && (
        <p className="text-xs text-[var(--color-muted)]">{hint}</p>
      )}
    </div>
  );
}
