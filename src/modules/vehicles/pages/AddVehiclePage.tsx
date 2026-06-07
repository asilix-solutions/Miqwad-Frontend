import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/components/ui/card";
import { useToast } from "@shared/components/ui/toastContext";
import { VehicleForm } from "../components/VehicleForm";
import { useCreateVehicleMutation } from "../hooks/useVehicleMutations";
import type { VehicleFormValues } from "../schemas/vehicles.schemas";
import type { CreateVehicleRequest } from "../types";

/**
 * Add Vehicle page.
 * Submits a new vehicle and routes to its Details page on success.
 */
export function AddVehiclePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const mutation = useCreateVehicleMutation();

  const handleSubmit = async (values: VehicleFormValues) => {
    try {
      const payload = toApiPayload(values);
      const created = await mutation.mutateAsync(payload);
      toast.success(t("vehicles.addedToast"));
      navigate(`/app/vehicles/${created.id}`);
    } catch (err) {
      toast.error(
        t("vehicles.addFailed"),
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link
        to="/app/vehicles"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {t("vehicles.backToList")}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{t("vehicles.addTitle")}</CardTitle>
          <CardDescription>{t("vehicles.addSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/vehicles")}
            submitting={mutation.isPending}
            submitLabel={t("common.save")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/** Strip empty strings and convert the form's shape to the API contract. */
function toApiPayload(values: VehicleFormValues): CreateVehicleRequest {
  return {
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
}
