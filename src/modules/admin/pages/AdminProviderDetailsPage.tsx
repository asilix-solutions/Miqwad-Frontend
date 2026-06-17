import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileText, MapPin, Phone, Mail, Calendar, Clock, Star, Package, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useProviderProfileQuery } from "@modules/providers/hooks/useProviderQueries";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import {
  useApproveProviderMutation,
  useRejectProviderMutation,
  useUpdateProviderCommissionMutation,
  useSubscriptionsQuery,
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
import type { ProviderSubscription } from "@modules/subscriptions/types";
import { formatDate } from "@shared/lib/formatDate";
import { formatCurrency } from "@shared/lib/formatCurrency";

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
  const updateCommissionMutation = useUpdateProviderCommissionMutation();
  const subscriptionsQ = useSubscriptionsQuery({ page: 1, pageSize: 50 });
  const [showReject, setShowReject] = useState<AdminProvider | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [viewDocument, setViewDocument] = useState<ProviderDocument | null>(null);
  const [editingCommission, setEditingCommission] = useState(false);
  const [tempCommission, setTempCommission] = useState("");

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
            <BackIcon className="w-4 h-4 me-2" />
            {t("superAdmin.providers.detail.backToProviders")}
          </Link>
        </Button>
      </div>
    );
  }

  const provider = q.data;
  const subscription = subscriptionsQ.data?.items.find((s) => s.providerId === providerId);

  const handleSaveCommission = async () => {
    const rate = Number(tempCommission);
    if (!isNaN(rate) && rate >= 0) {
      try {
        await updateCommissionMutation.mutateAsync({ providerId, rate });
        toast.success(t("superAdmin.providers.detail.commission.save"));
        setEditingCommission(false);
      } catch {
        toast.error(t("common.errorTitle"));
      }
    }
  };

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
      {/* HEADER */}
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
              {provider.type && (
                <Badge variant="outline" className="bg-white">
                  {t(`superAdmin.providers.types.${provider.type}`)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOP ROW */}
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
                  icon={<Calendar className="h-4 w-4" />}
                  label={t("common.status")}
                  value={formatDate(provider.createdAt, i18n.language)}
                />
              </dl>

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
              <Can permission="providers.approve" fallback={null}>
                <></>
              </Can>
            </CardContent>
          </Card>
          
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

      {/* TYPE-SPECIFIC BODY */}
      {provider.type === "dealer" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-neutral-500" />
                    {t("superAdmin.providers.detail.dealer.storeSpecTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {provider.productCategories && provider.productCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {provider.productCategories.map((cat, i) => (
                        <Badge key={i} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-neutral-500">—</span>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                    <Package className="h-5 w-5 text-neutral-500" />
                    {t("superAdmin.providers.detail.dealer.productsTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-neutral-500">{t("superAdmin.providers.detail.dealer.productsCount")}</dt>
                      <dd className="text-sm font-medium">{provider.productsCount ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-neutral-500">{t("superAdmin.providers.detail.dealer.inventoryCount")}</dt>
                      <dd className="text-sm font-medium">{provider.inventoryCount ?? "—"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-neutral-800">
                  {t("superAdmin.providers.detail.commission.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">{t("superAdmin.providers.detail.commission.rate")}</p>
                    {editingCommission ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={tempCommission}
                          onChange={(e) => setTempCommission(e.target.value)}
                          className="w-24 h-9"
                        />
                        <Button size="sm" onClick={handleSaveCommission} disabled={updateCommissionMutation.isPending}>
                          {t("superAdmin.providers.detail.commission.save")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCommission(false)}>
                          {t("common.cancel")}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-semibold">{provider.commissionRate ?? 0}%</span>
                        <Can permission="providers.approve">
                          <Button variant="link" size="sm" onClick={() => {
                            setTempCommission(String(provider.commissionRate ?? 0));
                            setEditingCommission(true);
                          }}>
                            {t("superAdmin.providers.detail.commission.edit")}
                          </Button>
                        </Can>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500">{t("superAdmin.providers.detail.commission.estimatedDues")}</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency((provider.commissionRate ?? 0) / 100 * (provider.monthlySales ?? 0), i18n.language)}
                  </p>
                  {((provider.commissionRate ?? 0) / 100 * (provider.monthlySales ?? 0)) > 500 && (
                    <div className="mt-2 rounded-[var(--radius-md)] bg-danger-50 text-danger-600 p-2 text-sm font-medium border border-danger-200">
                      {t("superAdmin.providers.detail.commission.debtAlert")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {provider.type === "workshop" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-800">
                {t("superAdmin.providers.detail.workshop.profileTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-1 gap-y-4">
                <Field
                  icon={<FileText className="h-4 w-4" />}
                  label={t("superAdmin.providers.detail.workshop.specialization")}
                  value={provider.specialization || t("common.none")}
                />
                <Field
                  icon={<Clock className="h-4 w-4" />}
                  label={t("providers.fields.workingHours")}
                  value={provider.workingHours ?? t("common.none")}
                />
                <Field
                  icon={<Star className="h-4 w-4 text-warning-500" />}
                  label={t("superAdmin.providers.detail.workshop.rating")}
                  value={`${provider.rating ?? 0} (${provider.totalRatings ?? 0})`}
                />
                <div className="space-y-1">
                  <dt className="text-sm text-neutral-500 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    {t("superAdmin.providers.detail.workshop.location")}
                  </dt>
                  <dd className="text-sm font-medium text-neutral-900">
                    {provider.lat && provider.lng ? (
                      <a
                        href={`https://maps.google.com/?q=${provider.lat},${provider.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {t("superAdmin.providers.detail.workshop.viewMap")}
                      </a>
                    ) : (
                      t("common.none")
                    )}
                  </dd>
                </div>
              </dl>

              {provider.categoryIds && provider.categoryIds.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-neutral-100">
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

              {provider.photos && provider.photos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500 mb-2">{t("superAdmin.providers.detail.workshop.photos")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {provider.photos.map((photo, i) => (
                      <img key={i} src={photo} alt="" className="rounded-md object-cover w-full h-24 border" />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <SubscriptionCard subscription={subscription} />
        </div>
      )}

      {provider.type === "scrap" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-800">
                {t("superAdmin.providers.detail.scrap.specializationTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-1 gap-y-4">
                <div className="space-y-1">
                  <dt className="text-sm text-neutral-500 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-neutral-400" />
                    {t("superAdmin.providers.detail.scrap.brands")}
                  </dt>
                  <dd className="flex flex-wrap gap-2 mt-1">
                    {provider.brandSpecialization && provider.brandSpecialization.length > 0 ? (
                      provider.brandSpecialization.map((brand, i) => (
                        <Badge key={i} variant="outline" className="bg-neutral-50">{brand}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-neutral-500">{t("common.none")}</span>
                    )}
                  </dd>
                </div>
                <Field
                  icon={<Star className="h-4 w-4 text-warning-500" />}
                  label={t("superAdmin.providers.detail.workshop.rating")}
                  value={`${provider.rating ?? 0} (${provider.totalRatings ?? 0})`}
                />
                <div className="space-y-1">
                  <dt className="text-sm text-neutral-500 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    {t("superAdmin.providers.detail.workshop.location")}
                  </dt>
                  <dd className="text-sm font-medium text-neutral-900">
                    {provider.lat && provider.lng ? (
                      <a
                        href={`https://maps.google.com/?q=${provider.lat},${provider.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {t("superAdmin.providers.detail.workshop.viewMap")}
                      </a>
                    ) : (
                      t("common.none")
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <SubscriptionCard subscription={subscription} />
        </div>
      )}

      {/* DIALOGS */}
      {showReject != null && (
        <RejectProviderDialog
          open={showReject != null}
          provider={showReject}
          onCancel={() => setShowReject(null)}
          onConfirm={handleReject}
          submitting={rejectMutation.isPending}
        />
      )}
      
      {showApprove && (
        <ApproveProviderDialog
          providerName={provider.companyName}
          open={showApprove}
          onOpenChange={setShowApprove}
          onConfirm={handleApprove}
          submitting={approveMutation.isPending}
        />
      )}

      {viewDocument != null && (
        <DocumentViewerDialog
          document={viewDocument}
          open={viewDocument != null}
          onOpenChange={(open) => !open && setViewDocument(null)}
        />
      )}
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

function SubscriptionCard({ subscription }: { subscription?: ProviderSubscription }) {
  const { t, i18n } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-800">
          {t("superAdmin.providers.detail.subscription.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <dl className="grid grid-cols-1 gap-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-neutral-500">{t("superAdmin.providers.detail.subscription.plan")}</dt>
              <dd className="text-sm font-medium">{subscription.planName}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-neutral-500">{t("superAdmin.providers.detail.subscription.cycle")}</dt>
              <dd className="text-sm font-medium">{t(`admin.plans.billingCycles.${subscription.billingCycle}`)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-neutral-500">{t("superAdmin.providers.detail.subscription.status")}</dt>
              <dd>
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                  {t(`superAdmin.subscriptions.status.${subscription.status}`)}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-neutral-500">{t("superAdmin.providers.detail.subscription.start")}</dt>
              <dd className="text-sm font-medium">{formatDate(subscription.startDate, i18n.language)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-neutral-500">{t("superAdmin.providers.detail.subscription.end")}</dt>
              <dd className="text-sm font-medium">{formatDate(subscription.endDate, i18n.language)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-neutral-500">{t("superAdmin.providers.detail.subscription.none")}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminProviderDetailsPage;
