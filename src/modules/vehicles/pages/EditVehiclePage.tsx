import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { useToast } from "@shared/components/ui/toastContext";
import { VehicleForm } from "../components/VehicleForm";
import { useVehicleQuery } from "../hooks/useVehiclesQuery";
import { useUpdateVehicleMutation } from "../hooks/useVehicleMutations";
import type { VehicleFormValues } from "../schemas/vehicles.schemas";
import type { UpdateVehicleRequest } from "../types";

export function EditVehiclePage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const id = Number(params.id);

  const vehicleQuery = useVehicleQuery(Number.isFinite(id) && id > 0 ? id : null);
  const mutation = useUpdateVehicleMutation(id);

  const handleSubmit = async (values: VehicleFormValues) => {
    try {
      const payload: UpdateVehicleRequest = {
        brandId: values.brandId,
        modelId: values.modelId,
        year: values.year,
        plateNumber: values.plateNumber,
        color: values.color || undefined,
        mileage: values.mileage,
        vin: values.vin || undefined,
        registrationDate: values.registrationDate || undefined,
        fuelType: values.fuelType,
        nickname: values.nickname || undefined,
        imageUrl: values.imageUrl || undefined,
      };
      await mutation.mutateAsync(payload);
      toast.success(t("vehicles.updatedToast"));
      // Per spec: post-edit goes to Details.
      navigate(`/app/vehicles/${id}`);
    } catch (err) {
      toast.error(
        t("vehicles.updateFailed"),
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  if (vehicleQuery.isLoading) return <LoadingState />;
  if (vehicleQuery.isError || !vehicleQuery.data) {
    return <ErrorState onRetry={() => void vehicleQuery.refetch()} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link
        to={`/app/vehicles/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {t("common.back")}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{t("vehicles.editTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleForm
            defaultValues={vehicleQuery.data}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/app/vehicles/${id}`)}
            submitting={mutation.isPending}
            submitLabel={t("common.save")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
