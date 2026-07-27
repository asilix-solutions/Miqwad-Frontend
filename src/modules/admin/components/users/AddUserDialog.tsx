/**
 * @file AddUserDialog.tsx
 * @description Type-first "Add User" flow for the admin Users page.
 * Step 1 picks the user type (client/workshop/dealer/scrapyard); step 2
 * renders the matching field set. Validation runs against the discriminated
 * `userSchema` — the single source of truth shared with the API/mock layer.
 * All three provider subtypes now share `CategoryMultiSelectTree` for their
 * "specialty" picker, each scoped to its own providerType: workshop keeps its
 * free-text specialization + workingHours alongside the tree; dealer uses the
 * tree only (no free text — a real closed taxonomy exists); scrapyard shows
 * BOTH the category tree (part categories) and the ScrapVehicleBrand
 * multi-select (vehicle makes) — orthogonal concerns that coexist.
 *
 * `UserType` uses "scrapyard" while `ProviderType` (shared/provider-ui) uses
 * "scrap" — mapped once at the tree call site via `toProviderType`.
 *
 * RHF's `Path<T>` collapses to `keyof T` for a union type, so a plain
 * `useForm<UserFormValues>()` can't `register()` variant-only fields (e.g.
 * `name` vs `companyName`). We type the form with a flat superset shape
 * instead and cast the zod resolver to match — the actual runtime
 * validation still runs the real discriminated union.
 */

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { User, Wrench, Store, Recycle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stepper } from "@shared/components/ui/stepper";
import { useToast } from "@shared/components/ui/toastContext";
import { CategoryMultiSelectTree } from "@shared/provider-ui/CategoryMultiSelectTree";
import { SCRAP_VEHICLE_BRANDS } from "@modules/scrap/schemas/scrap.schemas";
import type { ScrapVehicleBrand } from "@modules/scrap/types";
import type { ProviderType } from "@modules/providers/types";
import {
  useCreateUserMutation,
  useCitiesQuery,
  useAdminCategoriesQuery,
} from "../../hooks/useAdminQueries";
import { userSchema, type UserFormValues, type UserType } from "../../schemas/userSchema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Flat superset of every union variant's fields — see file header. */
interface AddUserFormShape {
  type: UserType;
  name?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  city?: string;
  address?: string;
  workingHours?: string;
  categoryIds?: number[];
  specialization?: string;
  brandSpecialization?: ScrapVehicleBrand[];
}

const resolver = zodResolver(userSchema) as unknown as Resolver<AddUserFormShape>;

const TYPE_OPTIONS: { value: UserType; icon: typeof User; labelKey: string }[] = [
  { value: "client", icon: User, labelKey: "superAdmin.users.create.types.client" },
  { value: "workshop", icon: Wrench, labelKey: "superAdmin.users.create.types.workshop" },
  { value: "dealer", icon: Store, labelKey: "superAdmin.users.create.types.dealer" },
  { value: "scrapyard", icon: Recycle, labelKey: "superAdmin.users.create.types.scrapyard" },
];

/** Maps the Add-User `UserType` to the shared `ProviderType` used by CategoryMultiSelectTree. */
function toProviderType(type: Exclude<UserType, "client">): ProviderType {
  return type === "scrapyard" ? "scrap" : type;
}

const CLIENT_DEFAULTS: AddUserFormShape = { type: "client", name: "", phoneNumber: "", email: "" };

function defaultValuesFor(type: UserType): AddUserFormShape {
  if (type === "client") return CLIENT_DEFAULTS;
  const base: AddUserFormShape = {
    type,
    companyName: "",
    email: "",
    phoneNumber: "",
    password: "",
    city: "",
    address: "",
    categoryIds: [],
  };
  if (type === "workshop") {
    return { ...base, specialization: "", workingHours: "" };
  }
  if (type === "dealer") {
    return base;
  }
  return { ...base, brandSpecialization: [] };
}

export function AddUserDialog({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const citiesQ = useCitiesQuery();
  const categoriesQ = useAdminCategoriesQuery();
  const createMutation = useCreateUserMutation();

  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<UserType | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddUserFormShape>({
    resolver,
    defaultValues: CLIENT_DEFAULTS,
  });

  const isPending = createMutation.isPending;
  const city = watch("city");
  const categoryIds = watch("categoryIds") ?? [];
  const brandSpecialization = watch("brandSpecialization") ?? [];

  const resetAll = () => {
    setStep(0);
    setSelectedType(null);
    reset(CLIENT_DEFAULTS);
  };

  const handleOpenChange = (val: boolean) => {
    if (isPending) return;
    if (!val) resetAll();
    onOpenChange(val);
  };

  const pickType = (type: UserType) => {
    setSelectedType(type);
    reset(defaultValuesFor(type));
    setStep(1);
  };

  const toggleBrand = (brand: ScrapVehicleBrand) => {
    if (brandSpecialization.includes(brand)) {
      setValue(
        "brandSpecialization",
        brandSpecialization.filter((b) => b !== brand),
        { shouldValidate: true },
      );
    } else {
      setValue("brandSpecialization", [...brandSpecialization, brand], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: AddUserFormShape) => {
    try {
      await createMutation.mutateAsync(data as unknown as UserFormValues);
      toast.success(t("superAdmin.users.create.success"));
      handleOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  const steps = [
    { label: t("superAdmin.users.create.steps.type") },
    { label: t("superAdmin.users.create.steps.details") },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="lg" dir={i18n.dir()}>
        <DialogHeader>
          <DialogTitle>{t("superAdmin.users.create.title")}</DialogTitle>
        </DialogHeader>

        <Stepper steps={steps} currentStep={step} onStepClick={(i) => i === 0 && setStep(0)} />

        {step === 0 && (
          <div className="grid grid-cols-2 gap-3 py-4">
            {TYPE_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => pickType(value)}
                className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-4 text-sm font-medium text-[var(--color-ink-body)] transition-colors hover:border-[var(--color-brand-orange)] hover:bg-[color-mix(in_srgb,var(--color-brand-orange)_6%,transparent)]"
              >
                <Icon className="h-6 w-6" aria-hidden />
                {t(labelKey)}
              </button>
            ))}
          </div>
        )}

        {step === 1 && selectedType && (
          <form id="add-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            {selectedType === "client" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t("superAdmin.users.form.name")} <span className="text-danger-500">*</span>
                  </Label>
                  <Input id="name" {...register("name")} disabled={isPending} />
                  {errors.name && (
                    <p className="text-sm text-danger-500">{t(errors.name.message as string)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    {t("superAdmin.users.form.phone")} <span className="text-danger-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    dir="ltr"
                    className="text-left"
                    {...register("phoneNumber")}
                    disabled={isPending}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-danger-500">{t(errors.phoneNumber.message as string)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t("superAdmin.users.form.email")} ({t("common.optional")})
                  </Label>
                  <Input
                    id="email"
                    dir="ltr"
                    className="text-left"
                    {...register("email")}
                    disabled={isPending}
                  />
                  {errors.email && (
                    <p className="text-sm text-danger-500">{t(errors.email.message as string)}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      {t("superAdmin.users.form.companyName")} <span className="text-danger-500">*</span>
                    </Label>
                    <Input id="companyName" {...register("companyName")} disabled={isPending} />
                    {errors.companyName && (
                      <p className="text-sm text-danger-500">{t(errors.companyName.message as string)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      {t("superAdmin.users.form.phone")} <span className="text-danger-500">*</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      dir="ltr"
                      className="text-left"
                      {...register("phoneNumber")}
                      disabled={isPending}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-danger-500">{t(errors.phoneNumber.message as string)}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t("superAdmin.users.form.email")} <span className="text-danger-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      dir="ltr"
                      className="text-left"
                      {...register("email")}
                      disabled={isPending}
                    />
                    {errors.email && (
                      <p className="text-sm text-danger-500">{t(errors.email.message as string)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {t("superAdmin.users.form.password")} <span className="text-danger-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      dir="ltr"
                      className="text-left"
                      {...register("password")}
                      disabled={isPending}
                    />
                    {errors.password && (
                      <p className="text-sm text-danger-500">{t(errors.password.message as string)}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      {t("superAdmin.users.form.city")} ({t("common.optional")})
                    </Label>
                    <Select
                      dir={i18n.dir()}
                      value={city || "all"}
                      onValueChange={(val) =>
                        setValue("city", val === "all" ? "" : val, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger id="city" className="w-full" disabled={isPending}>
                        <SelectValue placeholder={t("common.select")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.none")}</SelectItem>
                        {(citiesQ.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {i18n.language === "ar" ? c.nameAr : c.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {t("superAdmin.users.form.address")} ({t("common.optional")})
                    </Label>
                    <Input id="address" {...register("address")} disabled={isPending} />
                  </div>
                </div>

                {selectedType === "workshop" && (
                  <>
                    <div className="space-y-2">
                      <Label>
                        {t("superAdmin.users.form.categories")} ({t("common.optional")})
                      </Label>
                      <CategoryMultiSelectTree
                        categories={categoriesQ.data ?? []}
                        value={categoryIds}
                        onChange={(ids) => setValue("categoryIds", ids, { shouldValidate: true })}
                        providerType={toProviderType("workshop")}
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">
                        {t("superAdmin.users.form.specialization")} ({t("common.optional")})
                      </Label>
                      <Input
                        id="specialization"
                        placeholder={t("superAdmin.users.form.specializationPlaceholder")}
                        {...register("specialization")}
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workingHours">
                        {t("superAdmin.users.form.workingHours")} ({t("common.optional")})
                      </Label>
                      <Input id="workingHours" {...register("workingHours")} disabled={isPending} />
                    </div>
                  </>
                )}

                {selectedType === "dealer" && (
                  <div className="space-y-2">
                    <Label>
                      {t("superAdmin.users.form.categories")} ({t("common.optional")})
                    </Label>
                    <CategoryMultiSelectTree
                      categories={categoriesQ.data ?? []}
                      value={categoryIds}
                      onChange={(ids) => setValue("categoryIds", ids, { shouldValidate: true })}
                      providerType={toProviderType("dealer")}
                      disabled={isPending}
                    />
                  </div>
                )}

                {selectedType === "scrapyard" && (
                  <>
                    <div className="space-y-2">
                      <Label>
                        {t("superAdmin.users.form.scrapCategories")} ({t("common.optional")})
                      </Label>
                      <CategoryMultiSelectTree
                        categories={categoriesQ.data ?? []}
                        value={categoryIds}
                        onChange={(ids) => setValue("categoryIds", ids, { shouldValidate: true })}
                        providerType={toProviderType("scrapyard")}
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {t("superAdmin.users.form.brandSpecialization")} ({t("common.optional")})
                      </Label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {SCRAP_VEHICLE_BRANDS.map((brand) => (
                          <label
                            key={brand}
                            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-divider)] px-3 py-2 text-sm text-[var(--color-ink-body)]"
                          >
                            <input
                              type="checkbox"
                              checked={brandSpecialization.includes(brand)}
                              onChange={() => toggleBrand(brand)}
                              disabled={isPending}
                              className="h-4 w-4 rounded-sm"
                              style={{ accentColor: "var(--color-brand-orange)" }}
                            />
                            {t(`scrap.brands.${brand}`)}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* TODO: wire to backend — KYC docs (documents field on RegisterProviderRequest) */}
              </>
            )}
          </form>
        )}

        <DialogFooter className="pt-4">
          {step === 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(0)} disabled={isPending}>
              {t("common.back")}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          {step === 1 && (
            <Button type="submit" form="add-user-form" disabled={isPending}>
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
