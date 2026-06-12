import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Search, Check, AlertCircle } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import { PageLoader } from "@shared/components/feedback/PageLoader";
import { Can } from "@shared/auth/Can";
import { formatCurrency } from "@shared/lib/formatCurrency";

import {
  useAdminServicesQuery,
  useAdminCategoriesQuery,
  usePackageQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
} from "@modules/admin/hooks/useAdminQueries";
import { packageSchema, type PackageFormValues } from "@modules/admin/schemas/admin.schemas";

export function AdminPackageBuilderPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const packageId = id ? parseInt(id, 10) : undefined;
  
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dir = i18n.dir();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const toast = useToast();

  const { data: categories = [] } = useAdminCategoriesQuery();
  const { data: services = [] } = useAdminServicesQuery({ isActive: true }); // Assume we only select active services or we filter later
  const { data: existingPackage, isLoading: isLoadingPackage } = usePackageQuery(packageId as number);
  
  const createMutation = useCreatePackageMutation();
  const updateMutation = useUpdatePackageMutation();

  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      price: 0,
      isActive: true,
      serviceIds: [],
    },
  });

  useEffect(() => {
    if (isEdit && existingPackage) {
      form.reset({
        nameAr: existingPackage.nameAr,
        nameEn: existingPackage.nameEn,
        descriptionAr: existingPackage.descriptionAr || "",
        descriptionEn: existingPackage.descriptionEn || "",
        price: existingPackage.price,
        isActive: existingPackage.isActive,
        serviceIds: existingPackage.serviceIds || [],
      });
    }
  }, [isEdit, existingPackage, form]);

  const selectedServiceIds = form.watch("serviceIds");
  const packagePrice = form.watch("price") || 0;

  const servicesSum = useMemo(() => {
    return selectedServiceIds.reduce((sum, sId) => {
      const service = services.find((s) => s.id === sId);
      return sum + (service ? service.basePrice : 0);
    }, 0);
  }, [selectedServiceIds, services]);

  const savings = servicesSum - packagePrice;

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(
      (s) =>
        s.nameAr.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  const groupedServices = useMemo(() => {
    const map = new Map<number, typeof services>();
    filteredServices.forEach((s) => {
      if (!map.has(s.categoryId)) map.set(s.categoryId, []);
      map.get(s.categoryId)!.push(s);
    });
    return map;
  }, [filteredServices]);

  const onSubmit = async (values: PackageFormValues) => {
    try {
      if (isEdit && packageId) {
        await updateMutation.mutateAsync({ id: packageId, payload: values });
        toast.success(t("superAdmin.packages.builder.success.updated"));
      } else {
        await createMutation.mutateAsync(values);
        toast.success(t("superAdmin.packages.builder.success.created"));
      }
      navigate("/admin/packages");
    } catch (err) {
      toast.error(t("common.errorTitle"));
    }
  };

  const toggleService = (serviceId: number) => {
    const current = form.getValues("serviceIds");
    if (current.includes(serviceId)) {
      form.setValue("serviceIds", current.filter((id) => id !== serviceId), { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("serviceIds", [...current, serviceId], { shouldValidate: true, shouldDirty: true });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingPackage) return <PageLoader />;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/packages"
          className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-ink-lighter)] hover:text-[var(--color-ink-body)] shrink-0"
        >
          <BackIcon size={20} />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-ink-title)]">
            {isEdit
              ? t("superAdmin.packages.builder.editTitle")
              : t("superAdmin.packages.builder.createTitle")}
          </h1>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Column: Services Selection */}
        <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-lg)] p-6 shadow-sm w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-[var(--color-ink-title)]">
              {t("superAdmin.packages.builder.servicesSection")}
            </h2>
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 start-0 pl-3 flex items-center pointer-events-none text-[var(--color-ink-lighter)] rtl:pr-3 rtl:pl-0">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("superAdmin.packages.builder.searchPlaceholder")}
                className="w-full bg-[var(--color-surface-2)] border-transparent rounded-[var(--radius-md)] h-10 pl-10 pr-4 text-sm text-[var(--color-ink-body)] placeholder-[var(--color-ink-lighter)] focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all rtl:pl-4 rtl:pr-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {categories.length === 0 && <div className="text-sm text-[var(--color-ink-lighter)]">{t("common.loading")}</div>}
            {Array.from(groupedServices.entries()).map(([catId, catServices]) => {
              const category = categories.find((c) => c.id === catId);
              return (
                <div key={catId} className="flex flex-col gap-3">
                  <h3 className="text-[13px] font-semibold text-[var(--color-ink-lighter)] uppercase tracking-wider">
                    {dir === "rtl" ? category?.nameAr : category?.nameEn}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {catServices.map((service) => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      return (
                        <label
                          key={service.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5"
                              : "border-[var(--color-divider)] hover:bg-[var(--color-surface-2)]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => toggleService(service.id)}
                            />
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white"
                                  : "bg-[var(--color-surface)] border-[var(--color-divider)]"
                              }`}
                            >
                              {isSelected && <Check size={14} strokeWidth={3} />}
                            </div>
                            <span className="text-sm font-medium text-[var(--color-ink-title)] select-none">
                              {dir === "rtl" ? service.nameAr : service.nameEn}
                            </span>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-[var(--color-ink-body)] shrink-0">
                            {formatCurrency(service.basePrice, i18n.language)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {groupedServices.size === 0 && (
              <div className="text-center py-10 text-[var(--color-ink-lighter)]">
                {t("discovery.empty.title")}
              </div>
            )}
          </div>
          {form.formState.errors.serviceIds && (
            <p className="text-sm text-[var(--color-semantic-danger)] mt-4">
              {(t as any)(form.formState.errors.serviceIds.message)}
            </p>
          )}
        </div>

        {/* Side Column: Details & Summary */}
        <div className="flex flex-col gap-6 w-full lg:w-[340px] shrink-0 sticky top-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-lg)] p-6 shadow-sm flex flex-col gap-5">
            {/* Inputs */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-title)] mb-1.5">
                {t("superAdmin.packages.builder.nameAr")}
              </label>
              <input
                {...form.register("nameAr")}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-[var(--radius-md)] h-10 px-3 text-sm focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
              />
              {form.formState.errors.nameAr && (
                <p className="text-xs text-[var(--color-semantic-danger)] mt-1">{(t as any)(form.formState.errors.nameAr.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-title)] mb-1.5">
                {t("superAdmin.packages.builder.nameEn")}
              </label>
              <input
                {...form.register("nameEn")}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-[var(--radius-md)] h-10 px-3 text-sm focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
              />
              {form.formState.errors.nameEn && (
                <p className="text-xs text-[var(--color-semantic-danger)] mt-1">{(t as any)(form.formState.errors.nameEn.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-ink-title)] mb-1.5">
                {t("superAdmin.packages.builder.price")}
              </label>
              <input
                type="number"
                {...form.register("price", { valueAsNumber: true })}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-[var(--radius-md)] h-10 px-3 text-sm tabular-nums focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all"
              />
              {form.formState.errors.price && (
                <p className="text-xs text-[var(--color-semantic-danger)] mt-1">{(t as any)(form.formState.errors.price.message)}</p>
              )}
            </div>
            
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0" style={{ backgroundColor: field.value ? 'var(--color-brand-primary)' : 'var(--color-surface-3)' }}>
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${field.value ? (dir === 'rtl' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-ink-title)] select-none">
                    {t("superAdmin.packages.builder.isActive")}
                  </span>
                </label>
              )}
            />

            {/* Live Summary */}
            <div className="bg-[var(--color-surface-2)] rounded-lg p-4 flex flex-col gap-3 mt-2 border border-[var(--color-divider)]">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-ink-lighter)]">{t("superAdmin.packages.builder.summary.servicesSum")}</span>
                <span className="font-semibold tabular-nums">{formatCurrency(servicesSum, i18n.language)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-ink-lighter)]">{t("superAdmin.packages.builder.summary.packagePrice")}</span>
                <span className="font-semibold tabular-nums">{formatCurrency(packagePrice, i18n.language)}</span>
              </div>
              <div className="h-px bg-[var(--color-divider)] w-full" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--color-ink-title)]">{t("superAdmin.packages.builder.summary.savings")}</span>
                <span className={`font-bold tabular-nums ${savings >= 0 ? 'text-[var(--color-semantic-success)]' : 'text-[var(--color-semantic-danger)]'}`}>
                  {savings > 0 ? "+" : ""}{formatCurrency(savings, i18n.language)}
                </span>
              </div>
              {savings < 0 && (
                <div className="flex items-start gap-2 mt-1 text-xs text-[var(--color-semantic-warning)] bg-[var(--color-semantic-warning)]/10 p-2 rounded">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{t("superAdmin.packages.builder.summary.priceAboveSumWarning")}</span>
                </div>
              )}
            </div>

            <div className="text-sm text-center font-medium text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 py-2 rounded-md">
              {t("superAdmin.packages.builder.selectedCount", { count: selectedServiceIds.length })}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-2">
              <Can permission={isEdit ? "packages.edit" : "packages.create"}>
                <Button
                  type="submit"
                  disabled={isPending || !form.formState.isValid}
                  className="w-full h-11 text-base bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 text-white"
                >
                  {isPending ? t("common.loading") : t("superAdmin.packages.builder.save")}
                </Button>
              </Can>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/packages")}
                className="w-full h-11"
              >
                {t("superAdmin.packages.builder.cancel")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
