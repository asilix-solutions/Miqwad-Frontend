/**
 * @file OnboardingDocumentsPage.tsx
 *
 * Provider onboarding "Documents" screen (step 2).
 *
 * Layout (matching screenshot 3):
 *  - Title "المستندات المطلوبة" + subtitle.
 *  - Completed doc: commercial register, PDF, done state.
 *  - In-progress doc: tax certificate, PNG, uploading ~75%.
 *  - DocumentDropzone for the owner-identity document.
 *  - "إضافة مستندات اختيارية" dashed row with + icon.
 *  - Footer: primary "إرسال المراجعة", outline "حفظ ومتابعة لاحقاً",
 *    text link "← الرجوع لمعلومات الحساب".
 *
 * Uses useDocumentUpload() hook for the document list and simulated progress.
 *
 * States handled:
 *  - **Loading**: Skeleton cards with pulse animation.
 *  - **Error**: Retry-friendly error fallback.
 *  - **Empty/Success**: Full document list with interaction.
 *
 * Route handle: `{ onboardingStep: "documents" }` — consumed by
 * `OnboardingLayout` to set the stepper to step 2.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, AlertTriangle, RotateCcw, ArrowRight } from "lucide-react";
import { useDocumentUpload } from "../hooks/useDocumentUpload";
import { DocumentRow } from "../components/DocumentRow";
import { DocumentDropzone } from "../components/DocumentDropzone";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@app/store";
import { defaultHomeFor } from "@shared/guards/RoleGuard";
import type { OnboardingStepKey, UploadDoc } from "../types";

// ---------------------------------------------------------------------------
// Route handle
// ---------------------------------------------------------------------------

export const handle: { onboardingStep: OnboardingStepKey } = {
  onboardingStep: "documents",
};

// ---------------------------------------------------------------------------
// Initial mock documents (matching the screenshot)
// ---------------------------------------------------------------------------

const INITIAL_DOCS: UploadDoc[] = [
  {
    id: "commercial-register",
    label: "السجل التجاري",
    fileName: "commercial-register.pdf",
    sizeMb: 1.2,
    progress: 100,
    status: "done",
    kind: "commercial",
    fileExt: "PDF",
  },
  {
    id: "tax-certificate",
    label: "الشهادة الضريبية",
    fileName: "tax-certificate.png",
    sizeMb: 0.8,
    progress: 75,
    status: "uploading",
    kind: "tax",
    fileExt: "PNG",
  },
];

// ---------------------------------------------------------------------------
// Skeleton (loading state)
// ---------------------------------------------------------------------------

const SKELETON_STYLES = `
@keyframes docSkeletonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

function SkeletonRow() {
  return (
    <div
      style={{
        border: "1.5px solid var(--color-divider)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-surface)",
        padding: "var(--space-5) var(--space-6)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div
            style={{
              width: "40%",
              height: 14,
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--color-divider)",
              animation: "docSkeletonPulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "65%",
              height: 10,
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--color-divider)",
              animation: "docSkeletonPulse 1.5s ease-in-out infinite",
              animationDelay: "0.15s",
            }}
          />
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-xs)",
            backgroundColor: "var(--color-divider)",
            animation: "docSkeletonPulse 1.5s ease-in-out infinite",
            animationDelay: "0.3s",
          }}
        />
      </div>
      <div
        style={{
          width: "100%",
          height: 6,
          borderRadius: "var(--radius-pill)",
          backgroundColor: "var(--color-divider)",
          animation: "docSkeletonPulse 1.5s ease-in-out infinite",
          animationDelay: "0.2s",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error fallback
// ---------------------------------------------------------------------------

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-10)",
        textAlign: "center",
        fontFamily: "var(--font-main)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "var(--color-danger-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertTriangle
          size={28}
          style={{ color: "var(--color-danger-500)" }}
          aria-hidden="true"
        />
      </div>
      <p
        className="txt-body"
        style={{ color: "var(--color-ink-body)", fontWeight: 600 }}
      >
        {t("common.errorTitle")}
      </p>
      <p
        className="txt-caption"
        style={{ color: "var(--color-muted)" }}
      >
        {t("errors.networkSubtitle")}
      </p>
      <Button variant="primary" size="md" onClick={onRetry}>
        <RotateCcw size={16} aria-hidden="true" />
        {t("common.retry")}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OnboardingDocumentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  // Simulated async loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const {
    documents,
    addDocument,
    removeDocument,
    cancelUpload,
    setProgress,
    setStatus,
    setFile,
  } = useDocumentUpload();

  // Upload simulation timer ref
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Simulate initial load ───────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Add initial mock documents after "loading"
      for (const doc of INITIAL_DOCS) {
        addDocument(doc);
      }
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Simulate uploading progress for in-progress docs ────────────────────
  useEffect(() => {
    const uploadingDoc = documents.find((d) => d.status === "uploading");
    if (!uploadingDoc) {
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }
      return;
    }

    if (uploadTimerRef.current) return; // already running

    uploadTimerRef.current = setInterval(() => {
      const current = documents.find((d) => d.status === "uploading");
      if (!current) {
        if (uploadTimerRef.current) {
          clearInterval(uploadTimerRef.current);
          uploadTimerRef.current = null;
        }
        return;
      }
      if (current.progress >= 100) {
        setStatus(current.id, "done");
        if (uploadTimerRef.current) {
          clearInterval(uploadTimerRef.current);
          uploadTimerRef.current = null;
        }
      } else {
        setProgress(current.id, Math.min(current.progress + 2, 100));
      }
    }, 300);

    return () => {
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }
    };
  }, [documents, setProgress, setStatus]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    (id: string) => {
      removeDocument(id);
    },
    [removeDocument],
  );

  const handleCancel = useCallback(
    (id: string) => {
      cancelUpload(id);
    },
    [cancelUpload],
  );

  const handlePreview = useCallback((_id: string) => {
    // In a real app this would open a modal/viewer
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const ext = file.name.split(".").pop()?.toUpperCase() as
        | "PDF"
        | "PNG"
        | "JPG"
        | undefined;

      const newDoc: UploadDoc = {
        id: `identity-${Date.now()}`,
        label: t("providers.kyc.identity"),
        fileName: file.name,
        sizeMb: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        progress: 0,
        status: "uploading",
        kind: "identity",
        fileExt: ext ?? "PDF",
      };
      addDocument(newDoc);
      const safeExt: UploadDoc["fileExt"] = ext ?? "PDF";
      setFile(newDoc.id, file.name, newDoc.sizeMb ?? 0, safeExt);
      setStatus(newDoc.id, "uploading");
    },
    [addDocument, setFile, setStatus, t],
  );

  const handleDropzoneError = useCallback(
    (errorKey: string) => {
      // Show a simple alert for now — in production use a toast
      alert(t(errorKey));
    },
    [t],
  );

  const handleSubmitForReview = useCallback(() => {
    void navigate("/provider/onboarding/review");
  }, [navigate]);

  const handleSaveLater = useCallback(() => {
    void navigate(defaultHomeFor(user?.role ?? "customer"));
  }, [navigate, user]);

  const handleBackToAccount = useCallback(() => {
    void navigate("/provider/onboarding/account");
  }, [navigate]);

  const handleRetry = useCallback(() => {
    setIsError(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      for (const doc of INITIAL_DOCS) {
        addDocument(doc);
      }
    }, 600);
  }, [addDocument]);

  // ── Error state ─────────────────────────────────────────────────────────
  if (isError) {
    return <ErrorFallback onRetry={handleRetry} />;
  }

  // ── Check if identity doc already exists ────────────────────────────────
  const hasIdentityDoc = documents.some((d) => d.kind === "identity");

  return (
    <>
      <style>{SKELETON_STYLES}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBlockStart: "var(--space-10)",
          paddingBlockEnd: "var(--space-16)",
          paddingInline: "var(--space-6)",
          maxWidth: 680,
          marginInline: "auto",
          fontFamily: "var(--font-main)",
          gap: "var(--space-6)",
        }}
      >
        {/* ── Title + Subtitle ──────────────────────────────────────────── */}
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
            marginBlockEnd: "var(--space-2)",
          }}
        >
          <h1
            className="txt-display-m"
            style={{
              fontWeight: 700,
              color: "var(--color-ink-body)",
              margin: 0,
            }}
          >
            {t("providers.onboarding.documents.title")}
          </h1>
          <p
            className="txt-body"
            style={{
              color: "var(--color-muted)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {t("providers.onboarding.documents.subtitle")}
          </p>
        </div>

        {/* ── Document list ──────────────────────────────────────────── */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : (
            <>
              {/* Rendered document rows */}
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onRemove={handleRemove}
                  onCancel={handleCancel}
                  onPreview={handlePreview}
                />
              ))}

              {/* Dropzone for identity doc (only if not yet added) */}
              {!hasIdentityDoc && (
                <DocumentDropzone
                  docLabel={t("providers.kyc.identity")}
                  onFileSelect={handleFileSelect}
                  onError={handleDropzoneError}
                />
              )}

              {/* ── Optional docs row ──────────────────────────────────── */}
              <button
                type="button"
                onClick={() => {
                  // In a real app this would expand an optional docs section
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--space-3)",
                  border: "1.5px dashed var(--color-ink-300)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "transparent",
                  padding: "var(--space-5) var(--space-6)",
                  cursor: "pointer",
                  fontFamily: "var(--font-main)",
                  fontSize: "var(--txt-body)",
                  color: "var(--color-ink-body)",
                  width: "100%",
                  transition: "border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-brand-orange)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-ink-300)";
                }}
              >
                <Plus
                  size={18}
                  style={{ color: "var(--color-muted)", flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span>{t("providers.onboarding.documents.addOptional")}</span>
              </button>
            </>
          )}
        </div>

        {/* ── Footer actions ─────────────────────────────────────────── */}
        {!isLoading && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
              marginBlockStart: "var(--space-4)",
            }}
          >
            {/* Button row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmitForReview}
              >
                {t("providers.onboarding.documents.submit")}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleSaveLater}
              >
                {t("providers.onboarding.documents.saveLater")}
              </Button>
            </div>

            {/* Back to account link */}
            <button
              type="button"
              onClick={handleBackToAccount}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-muted)",
                fontFamily: "var(--font-main)",
                fontSize: "var(--txt-body)",
                padding: 0,
                alignSelf: "flex-end",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-ink-body)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-muted)";
              }}
            >
              <ArrowRight
                size={16}
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              />
              {t("providers.onboarding.documents.backToInfo")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
