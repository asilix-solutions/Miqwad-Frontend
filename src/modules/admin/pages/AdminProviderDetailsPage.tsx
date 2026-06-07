import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, MapPin, Phone, Mail, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { useProviderProfileQuery } from "@modules/providers/hooks/useProviderQueries";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import {
  useApproveProviderMutation,
  useRejectProviderMutation,
} from "../hooks/useAdminQueries";
import { useToast } from "@shared/components/ui/toastContext";
import { RejectProviderDialog } from "../components/RejectProviderDialog";
import type { AdminProvider } from "../types";

/**
 * /admin/providers/:id — single-provider review with approve/reject.
 *
 * Responsive layout:
 *  - xs / sm: single column.
 *  - lg+: two columns — left = profile, right = documents + actions.
 */
export function AdminProviderDetailsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const providerId = Number(id);
  const q = useProviderProfileQuery(providerId);
  const categoriesQ = useServiceCategoriesQuery();
  const approveMutation = useApproveProviderMutation();
  const rejectMutation = useRejectProviderMutation();
  const [showReject, setShowReject] = useState<AdminProvider | null>(null);

  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if (!q.data) return null;

  const provider = q.data;

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(providerId);
      toast.success(t("admin.approved"));
      navigate("/admin/providers");
    } catch {
      toast.error(t("admin.actionFailed"));
    }
  };

  const handleReject = async (reason: string) => {
    try {
      await rejectMutation.mutateAsync({ providerId, reason });
      toast.success(t("admin.rejected"));
      setShowReject(null);
      navigate("/admin/providers");
    } catch {
      toast.error(t("admin.actionFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/providers">
            <ArrowLeft className="h-4 w-4" />
            {t("vehicles.backToList")}
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900 truncate">
            {provider.companyName}
          </h1>
        </div>
        <Badge tone={toneFor(provider.status)} size="sm" className="ms-auto">
          {t(`admin.status${cap(provider.status)}` as const)}
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Profile column */}
        <section className="lg:col-span-7 rounded-[var(--radius-lg)] bg-white border border-ink-200 p-4 sm:p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {t("admin.providerDetailsTitle")}
          </h2>

          <dl className="grid gap-4 sm:grid-cols-2">
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
              value={new Date(provider.createdAt).toLocaleDateString()}
            />
          </dl>

          {/* Categories */}
          {provider.categoryIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink-900">
                {t("providers.fields.categories")}
              </p>
              <div className="flex flex-wrap gap-2">
                {provider.categoryIds.map((cid) => {
                  const c = categoriesQ.data?.find((x) => x.id === cid);
                  return (
                    <Badge key={cid} tone="brand" size="sm">
                      {c ? (isAr ? c.nameAr : c.nameEn) : `#${cid}`}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {provider.rejectionReason && (
            <div className="rounded-[var(--radius-md)] bg-danger-50 border border-danger-500/30 p-3 text-sm text-ink-700">
              <span className="font-semibold">{t("providers.rejectedReason")}: </span>
              {provider.rejectionReason}
            </div>
          )}
        </section>

        {/* Actions + documents column */}
        <aside className="lg:col-span-5 space-y-4">
          {/* Actions */}
          {provider.status === "pending" && (
            <div className="rounded-[var(--radius-lg)] bg-white border border-ink-200 p-4 sm:p-6 space-y-3">
              <p className="font-display text-sm font-semibold text-ink-900">
                {t("common.actions")}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                  {approveMutation.isPending ? t("common.loading") : t("admin.approve")}
                </Button>
                <Button
                  variant="outline"
                  className="text-danger-500 hover:bg-danger-50 border-danger-500/30"
                  onClick={() => setShowReject(provider)}
                  disabled={rejectMutation.isPending}
                >
                  {t("admin.reject")}
                </Button>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="rounded-[var(--radius-lg)] bg-white border border-ink-200 p-4 sm:p-6 space-y-3">
            <p className="font-display text-sm font-semibold text-ink-900">
              {t("admin.documents")}
            </p>
            {provider.documents.length === 0 ? (
              <p className="text-sm text-ink-500">{t("empty.noData")}</p>
            ) : (
              <ul className="space-y-2">
                {provider.documents.map((d) => (
                  <li
                    key={d.type}
                    className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-ink-200 p-3"
                  >
                    <FileText className="h-4 w-4 text-brand-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900">
                        {t(`providers.kyc.${d.type}` as const)}
                      </p>
                      <p className="text-xs text-ink-500 truncate">{d.fileName}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <RejectProviderDialog
        open={showReject != null}
        provider={showReject}
        onCancel={() => setShowReject(null)}
        onConfirm={handleReject}
        submitting={rejectMutation.isPending}
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
    <div>
      <dt className="text-xs text-ink-500 flex items-center gap-1.5">
        <span className="text-ink-400">{icon}</span>
        {label}
      </dt>
      <dd className="text-sm text-ink-900 mt-1 break-words">{value}</dd>
    </div>
  );
}

function toneFor(status: AdminProvider["status"]) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "rejected":
      return "danger" as const;
    case "pending":
    default:
      return "warning" as const;
  }
}

function cap<T extends string>(s: T) {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
}

export default AdminProviderDetailsPage;
