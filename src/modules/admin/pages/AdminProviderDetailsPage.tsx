import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileText, MapPin, Phone, Mail, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProviderProfileQuery } from "@modules/providers/hooks/useProviderQueries";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import {
  useApproveProviderMutation,
  useRejectProviderMutation,
} from "../hooks/useAdminQueries";
import { useToast } from "@shared/components/ui/toastContext";
import { RejectProviderDialog } from "../components/RejectProviderDialog";
import { Can } from "@shared/auth/Can";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "../components/shared/StatusBadge";
import { DocumentViewerDialog } from "../components/DocumentViewerDialog";
import { ApproveProviderDialog } from "../components/ApproveProviderDialog";
import type { AdminProvider } from "../types";
import type { ProviderDocument } from "@modules/providers/types";
/**
 * /admin/providers/:id — single-provider review with approve/reject.
 *
 * Responsive layout:
 *  - xs / sm: single column.
 *  - lg+: two columns — left = profile, right = documents + actions.
 */
export function AdminProviderDetailsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const providerId = Number(id);
  const q = useProviderProfileQuery(providerId);
  const categoriesQ = useServiceCategoriesQuery();
  const approveMutation = useApproveProviderMutation();
  const rejectMutation = useRejectProviderMutation();
  const [showReject, setShowReject] = useState<AdminProvider | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [viewDocument, setViewDocument] = useState<ProviderDocument | null>(null);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  if (q.isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 max-w-4xl">
        <h2 className="text-2xl font-bold text-neutral-800">
          {q.isError ? t("superAdmin.providers.detail.error") : t("superAdmin.providers.detail.notFound")}
        </h2>
        <Button asChild variant="outline">
          <Link to="/admin/providers">
            <BackIcon className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t("superAdmin.providers.detail.backToProviders")}
          </Link>
        </Button>
      </div>
    );
  }

  const provider = q.data;

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(providerId);
      toast.success(t("superAdmin.providers.detail.approveConfirm.success"));
      setShowApprove(false);
      navigate("/admin/providers");
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  const handleReject = async (reason: string) => {
    try {
      await rejectMutation.mutateAsync({ providerId, reason });
      toast.success(t("admin.rejected"));
      setShowReject(null);
      navigate("/admin/providers");
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-full">
            <Link to="/admin/providers">
              <BackIcon className="w-5 h-5 text-neutral-500" />
            </Link>
          </Button>
          <Avatar className="h-16 w-16 border bg-neutral-100 text-neutral-600 font-medium text-lg">
            <AvatarFallback>{getInitials(provider.companyName)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{provider.companyName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={provider.status} kind="provider" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Profile column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-800">
                {t("superAdmin.providers.detail.info")}
              </CardTitle>
            </CardHeader>
            <CardContent>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Field icon={<Mail className="h-4 w-4" />} label={t("providers.fields.email")} value={provider.email} />
                <Field icon={<Phone className="h-4 w-4" />} label={t("providers.fields.phone")} value={provider.phone} />
                <Field
                  icon={<MapPin className="h-4 w-4" />}
                  label={t("providers.fields.city")}
                  value={provider.city ?? t("common.none")}
                />
                <Field
                  icon={<MapPin className="h-4 w-4" />}
                  label={t("providers.fields.address")}
                  value={provider.address ?? t("common.none")}
                />
                <Field
                  icon={<Clock className="h-4 w-4" />}
                  label={t("providers.fields.workingHours")}
                  value={provider.workingHours ?? t("common.none")}
                />
                <Field
                  icon={<Calendar className="h-4 w-4" />}
                  label={t("common.status")}
                  value={new Date(provider.createdAt).toLocaleDateString(i18n.language)}
                />
              </dl>

          {/* Categories */}
          {provider.categoryIds.length > 0 && (
            <div className="space-y-2 mt-6">
              <p className="text-sm font-semibold text-ink-900">
                {t("providers.fields.categories")}
              </p>
              <div className="flex flex-wrap gap-2">
                {provider.categoryIds.map((cid) => {
                  const c = categoriesQ.data?.find((x) => x.id === cid);
                  return (
                    <Badge key={cid} tone="brand" size="sm">
                      {c ? (isRtl ? c.nameAr : c.nameEn) : `#${cid}`}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {provider.rejectionReason && (
            <div className="rounded-[var(--radius-md)] bg-danger-50 border border-danger-500/30 p-3 mt-6 text-sm text-ink-700">
              <span className="font-semibold">{t("providers.rejectedReason")}: </span>
              {provider.rejectionReason}
            </div>
          )}
          </CardContent>
        </Card>
        </div>

        {/* Actions + documents column */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-800">
                {t("superAdmin.providers.detail.actions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(provider.status === "pending" || provider.status === "rejected") && (
                <Can permission="providers.approve">
                  <Button
                    className="w-full justify-start"
                    onClick={() => setShowApprove(true)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? t("common.loading") : t("admin.approve")}
                  </Button>
                </Can>
              )}
              {(provider.status === "pending" || provider.status === "approved") && (
                <Can permission="providers.reject">
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => setShowReject(provider)}
                    disabled={rejectMutation.isPending}
                  >
                    {t("admin.reject")}
                  </Button>
                </Can>
              )}

              {/* Fallback if user doesn't have permissions or status is unknown */}
              <Can permission="providers.approve" fallback={null}>
                <></>
              </Can>
            </CardContent>
          </Card>
          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-800">
                {t("superAdmin.providers.detail.documents")}
              </CardTitle>
            </CardHeader>
            <CardContent>

            {provider.documents.length === 0 ? (
              <p className="text-sm text-neutral-500">{t("superAdmin.providers.detail.noDocuments")}</p>
            ) : (
              <ul className="space-y-2">
                {provider.documents.map((d) => (
                  <li
                    key={d.type}
                    className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-neutral-200 p-3"
                  >
                    <FileText className="h-4 w-4 text-brand-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">
                        {t(`providers.kyc.${d.type}` as const)}
                      </p>
                      <p className="text-xs text-neutral-500 truncate mb-2">{d.fileName}</p>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setViewDocument(d)}>
                        {t("superAdmin.providers.detail.documentViewer.view")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RejectProviderDialog
        open={showReject != null}
        provider={showReject}
        onCancel={() => setShowReject(null)}
        onConfirm={handleReject}
        submitting={rejectMutation.isPending}
      />
      
      <ApproveProviderDialog
        providerName={provider.companyName}
        open={showApprove}
        onOpenChange={setShowApprove}
        onConfirm={handleApprove}
        submitting={approveMutation.isPending}
      />

      <DocumentViewerDialog
        document={viewDocument}
        open={viewDocument != null}
        onOpenChange={(open) => !open && setViewDocument(null)}
      />
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))] flex items-center gap-1.5">
        <span className="text-neutral-400">{icon}</span>
        {label}
      </dt>
      <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))] break-words">{value}</dd>
    </div>
  );
}



export default AdminProviderDetailsPage;
