/**
 * @file DocumentDropzone.tsx
 *
 * Dashed-border drop area for uploading a document.
 *
 * Features:
 *  - Circular upload icon (lucide Upload).
 *  - Prompt text: "اسحب ملف هوية صاحب المنشأة هنا" + "أو تصفّح من جهازك" link.
 *  - Formats line: "PDF · JPG · PNG — حتى 5 MB".
 *  - Real `<input type="file">` (hidden, triggered by area click / link click).
 *  - Drag-over visual state (border colour changes to brand-orange).
 *  - Client-side validation: max 5 MB, allowed types PDF/JPG/PNG.
 *  - On invalid: calls onError with appropriate i18n key.
 *
 * No `<form>` wrapper — uses onChange handlers as per project convention.
 */

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DocumentDropzoneProps {
  /** Human-readable label for which document this dropzone is for. */
  docLabel: string;
  /** Called with a validated File when the user selects / drops one. */
  onFileSelect: (file: File) => void;
  /** Called when a file fails client-side validation. */
  onError?: (errorKey: string) => void;
  /** Whether the dropzone is disabled. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentDropzone({
  docLabel,
  onFileSelect,
  onError,
  disabled = false,
}: DocumentDropzoneProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = useCallback(
    (file: File): boolean => {
      if (file.size > MAX_SIZE_BYTES) {
        onError?.("providers.kyc.tooLarge");
        return false;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        onError?.("providers.kyc.invalidType");
        return false;
      }
      return true;
    },
    [onError],
  );

  // ── File handler ────────────────────────────────────────────────────────
  const handleFile = useCallback(
    (file: File) => {
      if (validate(file)) {
        onFileSelect(file);
      }
    },
    [validate, onFileSelect],
  );

  // ── onChange (hidden input) ─────────────────────────────────────────────
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [handleFile],
  );

  // ── Drag events ─────────────────────────────────────────────────────────
  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile],
  );

  // ── Click to open file picker ───────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  // ── Browse link click (prevent bubbling so we don't double-trigger) ────
  const handleBrowseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) inputRef.current?.click();
    },
    [disabled],
  );

  const borderColor = isDragOver
    ? "var(--color-brand-orange)"
    : "var(--color-ink-300)";

  const bgColor = isDragOver
    ? "rgba(244, 94, 43, 0.03)"
    : "var(--color-surface)";

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`${t("providers.onboarding.documents.dropPrefix")} ${docLabel} ${t("providers.onboarding.documents.dropSuffix")}`}
      style={{
        border: `2px dashed ${borderColor}`,
        borderRadius: "var(--radius-md)",
        backgroundColor: bgColor,
        padding: "var(--space-10) var(--space-6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "border-color 0.2s ease, background-color 0.2s ease",
        fontFamily: "var(--font-main)",
      }}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleChange}
        style={{ display: "none" }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Upload icon circle */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "2px solid var(--color-divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-surface)",
        }}
        aria-hidden="true"
      >
        <Upload
          size={22}
          style={{ color: "var(--color-muted)" }}
        />
      </div>

      {/* Drop prompt text */}
      <p
        className="txt-body"
        style={{
          color: "var(--color-ink-body)",
          margin: 0,
          textAlign: "center",
          fontWeight: 500,
        }}
      >
        {t("providers.onboarding.documents.dropPrefix")}{" "}
        <strong>{docLabel}</strong>{" "}
        {t("providers.onboarding.documents.dropSuffix")}
      </p>

      {/* Browse link */}
      <button
        type="button"
        onClick={handleBrowseClick}
        style={{
          background: "none",
          border: "none",
          color: "var(--color-brand-orange)",
          fontFamily: "var(--font-main)",
          fontSize: "var(--txt-caption)",
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          padding: 0,
        }}
      >
        {t("providers.onboarding.documents.browse")}
      </button>

      {/* Formats line */}
      <p
        className="txt-caption"
        style={{
          color: "var(--color-muted)",
          margin: 0,
          textAlign: "center",
        }}
      >
        {t("providers.onboarding.documents.formats")}
      </p>
    </div>
  );
}
