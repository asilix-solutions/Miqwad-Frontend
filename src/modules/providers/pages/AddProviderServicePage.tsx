import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { defaultHomeFor } from "@shared/guards/RoleGuard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAppSelector } from "@app/store";
import { useToast } from "@shared/components/ui/toastContext";
import { ProviderServiceForm } from "../components/ProviderServiceForm";
import { useAddProviderServiceMutation } from "../hooks/useProviderMutations";

/**
 * /provider/services/add — add a new service to the catalog.
 *
 * After a successful add we redirect back to /provider/services.
 */
export function AddProviderServicePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);

  const providerId = user?.providerId ?? 0;
  const mutation = useAddProviderServiceMutation(providerId);

  if (!user || user.role !== "provider") {
    return <Navigate to={defaultHomeFor(user?.role ?? "customer")} replace />;
  }
  if (user.providerStatus !== "approved") {
    return <Navigate to="/provider/pending" replace />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/provider/services")}>
          <ArrowLeft className="h-4 w-4" />
          {t("vehicles.backToList")}
        </Button>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
          {t("providers.services.addTitle")}
        </h1>
      </header>

      <div className="rounded-[var(--radius-lg)] bg-white border border-ink-200 p-4 sm:p-6">
        <ProviderServiceForm
          submitLabel={t("common.add")}
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
              toast.success(t("providers.services.addedToast"));
              navigate("/provider/services");
            } catch {
              toast.error(t("providers.services.addFailed"));
            }
          }}
        />
      </div>
    </div>
  );
}

export default AddProviderServicePage;
