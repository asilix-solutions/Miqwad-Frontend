import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { useAppSelector } from "@app/store";
import { useToast } from "@shared/components/ui/toastContext";
import { ProviderServiceForm } from "../components/ProviderServiceForm";
import { useProviderServicesQuery } from "../hooks/useProviderQueries";
import { useUpdateProviderServiceMutation } from "../hooks/useProviderMutations";

/**
 * /provider/services/:id/edit — edit a single service.
 *
 * After a successful save we redirect back to /provider/services so
 * the provider sees their updated card immediately.
 */
export function EditProviderServicePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const serviceId = Number(params.id);
  const user = useAppSelector((s) => s.auth.user);

  const providerId = user?.providerId ?? 0;
  // The Sprint 3 backend exposes a list endpoint only. We derive the
  // edited record from there until the BE adds GET /providers/{p}/services/{id}.
  const listQ = useProviderServicesQuery(providerId);
  const service = listQ.data?.find((s) => s.id === serviceId) ?? null;
  const mutation = useUpdateProviderServiceMutation(providerId, serviceId);

  if (!user || user.role !== "provider") {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (user.providerStatus !== "approved") {
    return <Navigate to="/provider/pending" replace />;
  }

  if (listQ.isLoading) return <LoadingState />;
  if (listQ.isError) return <ErrorState onRetry={() => listQ.refetch()} />;
  if (!service) {
    return (
      <ErrorState
        title={t("common.none")}
        description={t("empty.noData")}
        onRetry={() => navigate("/provider/services")}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/provider/services")}>
          <ArrowLeft className="h-4 w-4" />
          {t("vehicles.backToList")}
        </Button>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
          {t("providers.services.editTitle")}
        </h1>
      </header>

      <div className="rounded-[var(--radius-lg)] bg-white border border-ink-200 p-4 sm:p-6">
        <ProviderServiceForm
          defaultValues={service}
          submitLabel={t("common.save")}
          submitting={mutation.isPending}
          onCancel={() => navigate("/provider/services")}
          onSubmit={async (values) => {
            try {
              await mutation.mutateAsync({
                name: values.name,
                description: values.description || null,
                price: values.price,
                estimatedDuration: values.estimatedDuration,
                categoryId: values.categoryId,
                subcategoryId: values.subcategoryId,
              });
              toast.success(t("providers.services.updatedToast"));
              navigate("/provider/services");
            } catch {
              toast.error(t("providers.services.updateFailed"));
            }
          }}
        />
      </div>
    </div>
  );
}

export default EditProviderServicePage;
