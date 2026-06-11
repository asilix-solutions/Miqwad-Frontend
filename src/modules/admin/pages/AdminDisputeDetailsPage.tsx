import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, FileText } from "lucide-react";
import { useDisputeQuery } from "@modules/admin/hooks/useAdminQueries";
import { StatusBadge } from "@modules/admin/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { DisputeDocumentViewerDialog } from "@modules/admin/components/escrow/DisputeDocumentViewerDialog";
import { Can } from "@shared/auth/Can";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { ResolveDisputeDialog } from "@modules/admin/components/escrow/ResolveDisputeDialog";

export function AdminDisputeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { data: dispute, isLoading, isError } = useDisputeQuery(id!);

  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{ url: string; title: string } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--color-surface-2)] rounded animate-pulse" />
        <div className="h-64 bg-[var(--color-surface-2)] rounded animate-pulse" />
      </div>
    );
  }

  if (isError || !dispute) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-[var(--color-ink-body)] mb-2">
          {t("superAdmin.escrow.detail.notFound")}
        </h2>
        <Button variant="outline" onClick={() => navigate("/admin/escrow")}>
          {t("superAdmin.escrow.detail.backToDisputes")}
        </Button>
      </div>
    );
  }

  const isResolvable = dispute.status === "open" || dispute.status === "under_review";

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/escrow")}
            className="text-[var(--color-muted)] hover:text-[var(--color-ink-body)]"
          >
            <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-[var(--color-ink-body)] tracking-tight">
                {t("superAdmin.escrow.detail.title", { orderId: dispute.orderId })}
              </h1>
              <StatusBadge status={dispute.status} kind="dispute" />
            </div>
          </div>
        </div>
        {isResolvable && (
          <Can permission="escrow.resolve">
            <Button
              onClick={() => setIsResolveDialogOpen(true)}
              className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-dark)]"
            >
              {t("superAdmin.escrow.resolve.button")}
            </Button>
          </Can>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-body)] border-b border-[var(--color-border)] pb-2">
            {t("superAdmin.escrow.detail.info")}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--color-muted)]">{t("superAdmin.escrow.detail.openedBy")}</p>
              <p className="font-medium text-[var(--color-ink-body)]">
                {dispute.openedByName} <span className="text-xs text-[var(--color-muted)]">({t(`superAdmin.escrow.roles.${dispute.openedByRole}`)})</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">{t("superAdmin.escrow.detail.amount")}</p>
              <p className="font-semibold text-[16px] text-[var(--color-ink-body)]">
                {formatCurrency(dispute.amount, i18n.language)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">{t("superAdmin.escrow.detail.createdAt")}</p>
              <p className="text-[var(--color-ink-body)]">
                {new Intl.DateTimeFormat(i18n.language, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }).format(new Date(dispute.createdAt))}
              </p>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-sm text-[var(--color-muted)] mb-1">{t("superAdmin.escrow.detail.reason")}</p>
            <p className="text-[14px] text-[var(--color-ink-body)] leading-relaxed p-3 bg-[var(--color-surface-2)] rounded-md border border-[var(--color-border)]">
              {dispute.reason}
            </p>
          </div>
        </div>

        {/* Resolution Card */}
        {dispute.status === "resolved" && dispute.resolution && (
          <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-ink-body)] border-b border-[var(--color-border)] pb-2">
              {t("superAdmin.escrow.detail.resolution")}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-muted)]">{t("superAdmin.escrow.detail.decision")}</p>
                <p className="font-medium text-[var(--color-ink-body)]">
                  {t(`superAdmin.escrow.resolve.decision.${dispute.resolution.decision}`)}
                </p>
              </div>
              {dispute.resolution.partialAmount !== undefined && (
                <div>
                  <p className="text-sm text-[var(--color-muted)]">{t("superAdmin.escrow.detail.partialAmount")}</p>
                  <p className="font-medium text-[var(--color-ink-body)]">
                    {formatCurrency(dispute.resolution.partialAmount, i18n.language)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-[var(--color-muted)] mb-1">{t("superAdmin.escrow.detail.note")}</p>
                <p className="text-[14px] text-[var(--color-ink-body)] leading-relaxed p-3 bg-[var(--color-surface-2)] rounded-md border border-[var(--color-border)]">
                  {dispute.resolution.note}
                </p>
              </div>
              {dispute.resolvedAt && (
                <div>
                  <p className="text-sm text-[var(--color-muted)]">{t("superAdmin.escrow.detail.resolvedAt")}</p>
                  <p className="text-[var(--color-ink-body)]">
                    {new Intl.DateTimeFormat(i18n.language, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(dispute.resolvedAt))}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Evidence Card */}
      <div className="p-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-ink-body)] border-b border-[var(--color-border)] pb-2">
          {t("superAdmin.escrow.detail.evidence")}
        </h2>
        {dispute.evidence.length === 0 ? (
          <p className="text-[var(--color-muted)] py-4 text-center">
            {t("superAdmin.escrow.detail.noEvidence")}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dispute.evidence.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-md">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[var(--color-muted)]" />
                  <div>
                    <p className="font-medium text-[14px] text-[var(--color-ink-body)]">{doc.fileName}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {t(`superAdmin.escrow.roles.${doc.uploadedByRole}`)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDoc({ url: doc.fileUrl, title: doc.fileName })}
                >
                  {t("superAdmin.escrow.detail.viewEvidence")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResolveDisputeDialog
        disputeId={dispute.id}
        orderId={dispute.orderId}
        amount={dispute.amount}
        openedByName={dispute.openedByName}
        open={isResolveDialogOpen}
        onOpenChange={setIsResolveDialogOpen}
      />

      {selectedDoc && (
        <DisputeDocumentViewerDialog
          document={{ url: selectedDoc.url, title: selectedDoc.title }}
          open={true}
          onOpenChange={(v) => { if (!v) setSelectedDoc(null); }}
        />
      )}
    </div>
  );
}
