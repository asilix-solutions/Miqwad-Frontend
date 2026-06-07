/**
 * @file DocumentRow.tsx
 *
 * Renders a single document upload slot showing its current lifecycle status.
 *
 * States:
 *  - **done** → green-tinted card, green "تم الرفع" badge, file ext badge,
 *    fileName · size · "رُفع منذ…", full green progress bar,
 *    actions: معاينة (preview) + إزالة (remove).
 *  - **uploading** → orange-tinted card, "جارٍ الرفع" badge, partial orange
 *    progress bar, "X.X من Y.Y MB · NN%", action: إلغاء (cancel).
 *  - **idle** → neutral border card, no progress bar, prompt state.
 *  - **error** → red-tinted border card, error badge.
 *
 * Design tokens:
 *  - var(--color-brand-orange) for uploading progress
 *  - var(--color-success-500) for done progress
 *  - var(--font-main) for all text
 *  - RTL logical properties used throughout
 */

import { useTranslation } from "react-i18next";
import { Eye, Trash2, X } from "lucide-react";
import type { UploadDoc } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DocumentRowProps {
  /** The document data to display. */
  doc: UploadDoc;
  /** Called when user clicks "إزالة" (remove). */
  onRemove?: (id: string) => void;
  /** Called when user clicks "إلغاء" (cancel upload). */
  onCancel?: (id: string) => void;
  /** Called when user clicks "معاينة" (preview). */
  onPreview?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Ext Badge (PDF / PNG / JPG)
// ---------------------------------------------------------------------------

function ExtBadge({ ext }: { ext: UploadDoc["fileExt"] }) {
  if (!ext) return null;

  const isGreen = ext === "PDF";
  const bg = isGreen ? "#1f9d55" : "#e88c1c";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: "var(--radius-xs)",
        backgroundColor: bg,
        color: "#fff",
        fontFamily: "var(--font-main)",
        fontWeight: 700,
        fontSize: "var(--txt-caption)",
        letterSpacing: "0.03em",
        flexShrink: 0,
      }}
      aria-label={ext}
    >
      {ext}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: UploadDoc["status"] }) {
  const { t } = useTranslation();

  const config: Record<
    UploadDoc["status"],
    { bg: string; color: string; label: string }
  > = {
    done: {
      bg: "var(--color-success-500)",
      color: "#fff",
      label: t("providers.onboarding.documents.uploaded"),
    },
    uploading: {
      bg: "var(--color-brand-orange)",
      color: "#fff",
      label: t("providers.onboarding.documents.uploading"),
    },
    idle: { bg: "var(--color-ink-100)", color: "var(--color-muted)", label: "" },
    error: {
      bg: "var(--color-danger-500)",
      color: "#fff",
      label: t("common.errorTitle"),
    },
  };

  const c = config[status];
  if (!c.label) return null;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "var(--radius-pill)",
        backgroundColor: c.bg,
        color: c.color,
        fontFamily: "var(--font-main)",
        fontSize: "var(--txt-micro)",
        fontWeight: 600,
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({
  value,
  status,
}: {
  value: number;
  status: UploadDoc["status"];
}) {
  const barColor =
    status === "done" ? "var(--color-success-500)" : "var(--color-brand-orange)";
  const trackColor =
    status === "done"
      ? "rgba(31, 157, 85, 0.15)"
      : "rgba(244, 94, 43, 0.15)";

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        width: "100%",
        height: 6,
        borderRadius: "var(--radius-pill)",
        backgroundColor: trackColor,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(value, 100)}%`,
          height: "100%",
          borderRadius: "var(--radius-pill)",
          backgroundColor: barColor,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DocumentRow({
  doc,
  onRemove,
  onCancel,
  onPreview,
}: DocumentRowProps) {
  const { t } = useTranslation();

  // ── Border + tint styles per status ──────────────────────────────────────
  const borderColor: Record<UploadDoc["status"], string> = {
    done: "rgba(31, 157, 85, 0.35)",
    uploading: "rgba(244, 94, 43, 0.35)",
    idle: "var(--color-divider)",
    error: "rgba(217, 45, 32, 0.4)",
  };

  const bgTint: Record<UploadDoc["status"], string> = {
    done: "rgba(31, 157, 85, 0.04)",
    uploading: "rgba(244, 94, 43, 0.03)",
    idle: "var(--color-surface)",
    error: "rgba(217, 45, 32, 0.03)",
  };

  // ── Meta line ────────────────────────────────────────────────────────────
  const renderMeta = () => {
    if (doc.status === "done" && doc.fileName && doc.sizeMb != null) {
      return (
        <span
          className="txt-caption"
          style={{ color: "var(--color-muted)", direction: "ltr" }}
        >
          {doc.fileName} · {doc.sizeMb.toFixed(1)} MB · رُفع منذ دقيقتين
        </span>
      );
    }
    if (doc.status === "uploading" && doc.fileName && doc.sizeMb != null) {
      const uploadedMb = (doc.sizeMb * doc.progress) / 100;
      return (
        <span
          className="txt-caption"
          style={{ color: "var(--color-muted)", direction: "ltr" }}
        >
          {doc.fileName} · {uploadedMb.toFixed(1)} من {doc.sizeMb.toFixed(1)} MB
          · %{doc.progress}
        </span>
      );
    }
    return null;
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const renderActions = () => {
    if (doc.status === "done") {
      return (
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button
            type="button"
            onClick={() => onPreview?.(doc.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-muted)",
              fontFamily: "var(--font-main)",
              fontSize: "var(--txt-caption)",
              padding: 0,
            }}
          >
            <Eye size={14} aria-hidden="true" />
            {t("providers.onboarding.documents.preview")}
          </button>
          <button
            type="button"
            onClick={() => onRemove?.(doc.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-danger-500)",
              fontFamily: "var(--font-main)",
              fontSize: "var(--txt-caption)",
              fontWeight: 600,
              padding: 0,
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            {t("providers.onboarding.documents.remove")}
          </button>
        </div>
      );
    }

    if (doc.status === "uploading") {
      return (
        <button
          type="button"
          onClick={() => onCancel?.(doc.id)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-muted)",
            fontFamily: "var(--font-main)",
            fontSize: "var(--txt-caption)",
            padding: 0,
          }}
        >
          <X size={14} aria-hidden="true" />
          {t("providers.onboarding.documents.cancel")}
        </button>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        border: `1.5px solid ${borderColor[doc.status]}`,
        borderRadius: "var(--radius-md)",
        backgroundColor: bgTint[doc.status],
        padding: "var(--space-5) var(--space-6)",
        fontFamily: "var(--font-main)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        transition: "border-color 0.2s ease, background-color 0.2s ease",
      }}
    >
      {/* ── Header row: label + badge + ext badge ─────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        {/* Label + status badge */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <span
              className="txt-body"
              style={{
                fontWeight: 600,
                color: "var(--color-ink-body)",
              }}
            >
              {doc.label}
            </span>
            <StatusBadge status={doc.status} />
          </div>

          {/* Meta line */}
          {renderMeta()}
        </div>

        {/* Ext badge (right / end side) */}
        <ExtBadge ext={doc.fileExt} />
      </div>

      {/* ── Progress bar ────────────────────────────────────────────── */}
      {(doc.status === "done" || doc.status === "uploading") && (
        <ProgressBar value={doc.progress} status={doc.status} />
      )}

      {/* ── Actions row ─────────────────────────────────────────────── */}
      {renderActions()}
    </div>
  );
}
