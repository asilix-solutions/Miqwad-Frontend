import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { FileText, UploadCloud, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@shared/lib/utils";

/**
 * Local file upload control used by the provider KYC step.
 *
 * Behaviour:
 *  - Accepts a single file via click *or* drag-and-drop.
 *  - Enforces a max size and an `accept` mime-type allow-list.
 *  - Emits validated metadata (name + size) to the parent so the
 *    parent can persist the file or hand it off to the backend.
 *
 * The component is intentionally storage-agnostic: in the demo we
 * keep the file metadata only; once the backend exposes a real
 * upload endpoint, replace `onPick` with a multipart upload.
 */

export interface PickedFile {
  file: File;
  name: string;
  size: number;
}

interface FileUploadProps {
  label: string;
  description?: string;
  acceptedFormatsHint?: string;
  accept?: string;
  /** Max size in bytes (default 5 MB). */
  maxSizeBytes?: number;
  /** Currently picked file metadata (for the "replace" state). */
  picked?: { name: string; size: number; uploadedAt?: string } | null;
  onPick: (picked: PickedFile) => void;
  onRemove?: () => void;
  className?: string;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const DEFAULT_ACCEPT = "application/pdf,image/jpeg,image/png";

export function FileUpload({
  label,
  description,
  acceptedFormatsHint,
  accept = DEFAULT_ACCEPT,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  picked,
  onPick,
  onRemove,
  className,
}: FileUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    setError(null);

    const acceptList = accept.split(",").map((s) => s.trim());
    if (acceptList.length > 0 && !acceptList.includes(file.type)) {
      setError(t("providers.kyc.invalidType"));
      return;
    }
    if (file.size > maxSizeBytes) {
      setError(t("providers.kyc.tooLarge"));
      return;
    }

    onPick({ file, name: file.name, size: file.size });
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  if (picked) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-ink-200 bg-white p-4 flex items-start gap-3",
          className,
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-brand-50 text-brand-600 shrink-0">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-900">{label}</p>
          <p className="text-xs text-ink-500 truncate">{picked.name}</p>
          <p className="text-xs text-ink-400">{formatSize(picked.size)}</p>
          {picked.uploadedAt && (
            <p className="text-xs text-ink-400">
              {t("providers.kyc.uploadedAt", {
                date: new Date(picked.uploadedAt).toLocaleString(),
              })}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {t("providers.kyc.replace")}
          </Button>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label={t("providers.kyc.remove")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <label
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={() => setDragOver(false)}
      className={cn(
        "block cursor-pointer rounded-[var(--radius-md)] border-2 border-dashed bg-white p-5 transition-colors",
        dragOver ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-brand-300",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="font-semibold text-sm text-ink-900">{label}</p>
        {description && <p className="text-xs text-ink-500 max-w-xs">{description}</p>}
        <p className="text-xs text-brand-600 font-medium">
          {t("providers.kyc.browseFile")}
        </p>
        <p className="text-[11px] text-ink-400">
          {acceptedFormatsHint ?? t("providers.kyc.acceptedFormats")}
        </p>
        {error && <p className="text-xs text-danger-500 mt-1">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
    </label>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
