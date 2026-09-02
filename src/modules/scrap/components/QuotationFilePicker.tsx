/**
 * @file QuotationFilePicker.tsx
 *
 * Controlled multi-file picker for the salvage quotation form. Drag-and-drop
 * or click-to-browse; shows selected filenames with a remove affordance.
 * Storage-agnostic — emits `File[]` to the parent, which hands them to the
 * multipart POST/PUT in `requestQuotationsApi`.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { UploadCloud, X, Paperclip } from "lucide-react";
import { cn } from "@shared/lib/utils";
import type { RequestQuotationAttachment } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuotationFilePickerProps {
  /** Currently selected (new) files. */
  value: File[];
  onChange: (files: File[]) => void;
  /** Existing attachments (edit mode) — shown read-only; PUT is additive only. */
  existing?: RequestQuotationAttachment[];
  className?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Controlled drag/drop + browse multi-file picker for quotation attachments. */
export function QuotationFilePicker({
  value,
  onChange,
  existing,
  className,
}: QuotationFilePickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const merged = [...value];
    for (const file of incoming) {
      const dup = merged.some(
        (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified,
      );
      if (!dup) merged.push(file);
    }
    onChange(merged);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-medium text-[var(--color-ink-body)]">
        {t("scrap.offer.filesLabel")}
      </span>

      {/* Existing attachments (edit mode) */}
      {existing && existing.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {existing.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-muted)]"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{att.originalFileName || att.filePath}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed",
          "px-4 py-6 text-center transition-colors duration-[var(--dur-fast)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40",
          dragOver
            ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-50,#fff4f0)]"
            : "border-[var(--color-divider)] hover:border-[var(--color-brand-orange)]/60",
        )}
      >
        <UploadCloud className="h-6 w-6 text-[var(--color-muted)]" aria-hidden />
        <span className="text-sm font-medium text-[var(--color-ink-body)]">
          {t("scrap.offer.filesDropHint")}
        </span>
        <span className="text-xs text-[var(--color-muted)]">
          {t("scrap.offer.filesBrowseHint")}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={onInputChange}
        className="hidden"
      />

      {/* Selected files */}
      {value.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {value.map((file, i) => (
            <li
              key={`${file.name}-${file.lastModified}-${i}`}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-divider)] px-3 py-2 text-xs"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[var(--color-ink-body)]">
                {file.name}
              </span>
              <span className="shrink-0 text-[var(--color-muted)]">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={t("common.delete")}
                className="shrink-0 rounded-[var(--radius-xs)] p-0.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger-500)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
