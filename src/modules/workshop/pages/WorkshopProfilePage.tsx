/**
 * @file WorkshopProfilePage.tsx
 *
 * Workshop provider profile — two-mode page.
 * VIEW (default): polished read-only display of all profile sections.
 * EDIT: a single "تعديل الملف" button flips the whole page into an inline
 * react-hook-form, with Save + Cancel at the top. No dialogs.
 *
 * Sections (top → bottom):
 *   1. Banner + Gallery   — image upload / thumbnail display
 *   2. Basic Info         — name, email, rating (rating read-only in edit)
 *   3. Specializations    — toggle chips for service types + vehicle brands
 *   4. Working Hours      — 7-day structured schedule with Apply-to-all
 *   5. Location           — address, city, lat/lng + static map placeholder
 *   6. Contact            — phone + WhatsApp with tel:/wa.me links in view
 */

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Pencil,
  X,
  MapPin,
  Star,
  Phone,
  MessageCircle,
  ExternalLink,
  Clock,
  Wrench,
  BadgeCheck,
  Image,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@shared/lib/utils";
import { useToast } from "@shared/components/ui/toastContext";
import {
  ProviderCard,
  ProviderPageHeader,
  ProviderSkeleton,
  ProviderInput,
  ProviderImageUpload,
  ProviderStatusPill,
} from "@shared/provider-ui";
import {
  workshopProfileSchema,
  type WorkshopProfileFormValues,
} from "../schemas/workshop.schemas";
import {
  useWorkshopProfileQuery,
  useUpdateWorkshopProfileMutation,
} from "../hooks/useWorkshopQueries";
import type {
  DayOfWeek,
  WeeklyHours,
  WorkshopServiceType,
  WorkshopVehicleBrand,
  WorkshopProfile,
} from "../types";
import { ProfileImageUpload } from "@modules/profile/components/ProfileImageUpload";
import { ProviderAddressesSection } from "@modules/profile/components/ProviderAddressesSection";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

const SERVICE_TYPES: WorkshopServiceType[] = [
  "mechanical",
  "bodywork",
  "electrical",
  "tires",
  "periodicMaintenance",
];

const VEHICLE_BRANDS: WorkshopVehicleBrand[] = [
  "toyota",
  "hyundai",
  "mercedes",
  "ford",
  "chevrolet",
  "nissan",
  "bmw",
  "other",
];

const DEFAULT_WORKING_HOURS: WeeklyHours = {
  sat: { isClosed: false, open: "09:00", close: "21:00" },
  sun: { isClosed: false, open: "09:00", close: "21:00" },
  mon: { isClosed: false, open: "09:00", close: "21:00" },
  tue: { isClosed: false, open: "09:00", close: "21:00" },
  wed: { isClosed: false, open: "09:00", close: "21:00" },
  thu: { isClosed: false, open: "09:00", close: "21:00" },
  fri: { isClosed: true },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDefaults(profile: WorkshopProfile | undefined): WorkshopProfileFormValues {
  return {
    companyName: profile?.companyName ?? "",
    email: profile?.email ?? "",
    bannerUrl: profile?.bannerUrl ?? undefined,
    photos: profile?.photos ?? [],
    workingHours: profile?.workingHours ?? DEFAULT_WORKING_HOURS,
    specializations: profile?.specializations ?? {
      serviceTypes: [],
      vehicleBrands: [],
    },
    contact: {
      phone: profile?.contact?.phone ?? "",
      whatsapp: profile?.contact?.whatsapp ?? "",
    },
    location: profile?.location
      ? {
          lat: profile.location.lat,
          lng: profile.location.lng,
          address: profile.location.address,
          city: profile.location.city,
        }
      : undefined,
  };
}

// ── SafeImage ─────────────────────────────────────────────────────────────────

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
  ariaHidden?: boolean;
}

function SafeImage({ src, alt, className, fallback, ariaHidden }: SafeImageProps) {
  const [errored, setErrored] = useState(false);
  if (errored) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      aria-hidden={ariaHidden}
      onError={() => setErrored(true)}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkshopProfilePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const initializedRef = useRef(false);

  const profileQuery = useWorkshopProfileQuery();
  const mutation = useUpdateWorkshopProfileMutation();
  const profile = profileQuery.data;

  // Custom resolver: strip location when address is blank so `location?.` in
  // the schema is truly optional (Zod would fail if we pass { address: "" }).
  const form = useForm<WorkshopProfileFormValues>({
    resolver: async (values, ctx, options) => {
      const cleaned: WorkshopProfileFormValues = {
        ...values,
        bannerUrl: values.bannerUrl === "" ? undefined : values.bannerUrl,
        location:
          values.location?.address?.trim()
            ? values.location
            : undefined,
      };
      return zodResolver(workshopProfileSchema)(cleaned, ctx, options);
    },
    defaultValues: buildDefaults(undefined),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = form;

  // Populate the form once profile data arrives (not on every re-render).
  useEffect(() => {
    if (profile && !initializedRef.current) {
      reset(buildDefaults(profile));
      initializedRef.current = true;
    }
  }, [profile, reset]);

  // Watch reactive slices needed for chip toggles and working-hours toggles.
  const serviceTypes = watch("specializations.serviceTypes");
  const vehicleBrands = watch("specializations.vehicleBrands");
  const workingHoursValues = watch("workingHours");

  const toggleService = useCallback(
    (svc: WorkshopServiceType) => {
      const current = getValues("specializations.serviceTypes");
      setValue(
        "specializations.serviceTypes",
        current.includes(svc) ? current.filter((s) => s !== svc) : [...current, svc],
        { shouldDirty: true },
      );
    },
    [getValues, setValue],
  );

  const toggleBrand = useCallback(
    (brand: WorkshopVehicleBrand) => {
      const current = getValues("specializations.vehicleBrands");
      setValue(
        "specializations.vehicleBrands",
        current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand],
        { shouldDirty: true },
      );
    },
    [getValues, setValue],
  );

  // Copy first open day's times to all other open days.
  const applyHoursToAll = () => {
    const firstOpen = DAYS.find((d) => {
      const day = getValues(`workingHours.${d}`);
      return !day.isClosed && day.open && day.close;
    });
    if (!firstOpen) return;
    const { open, close } = getValues(`workingHours.${firstOpen}`);
    DAYS.forEach((d) => {
      if (!getValues(`workingHours.${d}.isClosed`)) {
        setValue(`workingHours.${d}.open`, open, { shouldDirty: true });
        setValue(`workingHours.${d}.close`, close, { shouldDirty: true });
      }
    });
  };

  const handleEdit = () => {
    reset(buildDefaults(profile));
    setIsEditing(true);
  };

  const handleCancel = () => {
    reset(buildDefaults(profile));
    setIsEditing(false);
  };

  const onSubmit = (data: WorkshopProfileFormValues) => {
    const payload: Partial<WorkshopProfile> = {
      companyName: data.companyName,
      email: data.email,
      bannerUrl: data.bannerUrl,
      photos: data.photos,
      workingHours: data.workingHours,
      specializations: data.specializations,
      contact: {
        phone: data.contact.phone,
        whatsapp: data.contact.whatsapp || undefined,
      },
      location: data.location,
      // Mirror contact.phone → legacy flat field so dashboard hero stays in sync.
      phone: data.contact.phone,
      address: data.location?.address ?? profile?.address ?? null,
      city: data.location?.city ?? profile?.city ?? null,
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(t("workshop.profile.saveSuccess"));
        setIsEditing(false);
      },
      onError: () => {
        toast.error(t("workshop.profile.saveFailed"));
      },
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6 provider-fade-up">
        <ProviderSkeleton variant="block" height={48} />
        <ProviderSkeleton variant="block" height={200} />
        <ProviderSkeleton variant="block" height={120} />
        <ProviderSkeleton variant="block" height={280} />
        <ProviderSkeleton variant="block" height={160} />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (profileQuery.isError || !profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-[var(--color-muted)]">{t("common.errorTitle")}</p>
        <button
          type="button"
          onClick={() => void profileQuery.refetch()}
          className="text-sm text-[var(--color-brand-orange)] underline"
        >
          {t("common.errorRetry")}
        </button>
      </div>
    );
  }

  const mapsUrl = profile.location
    ? `https://www.google.com/maps/search/?api=1&query=${profile.location.lat},${profile.location.lng}`
    : null;

  // ── Shared button styles ──────────────────────────────────────────────────────

  const btnPrimary = cn(
    "flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)]",
    "bg-[var(--color-brand-orange)] px-5 text-sm font-semibold text-white",
    "transition-colors duration-[var(--dur-fast)]",
    "hover:bg-[#E3460F]",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "@media (prefers-reduced-motion: reduce) { transition: none }",
  );

  const btnSecondary = cn(
    "flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)]",
    "border border-[var(--color-divider)] bg-[var(--color-surface)]",
    "px-4 text-sm font-medium text-[var(--color-ink-body)]",
    "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)]",
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6 provider-fade-up">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <ProviderPageHeader
          icon={<Wrench className="h-5 w-5" aria-hidden />}
          title={t("workshop.profile.title")}
          subtitle={t("workshop.profile.subtitle")}
          actions={
            isEditing ? (
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleCancel} className={btnSecondary}>
                  <X className="h-4 w-4" aria-hidden />
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className={btnPrimary}
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden />
                  )}
                  {t("common.save")}
                </button>
              </div>
            ) : (
              <button type="button" onClick={handleEdit} className={btnPrimary}>
                <Pencil className="h-4 w-4" aria-hidden />
                {t("workshop.profile.editBtn")}
              </button>
            )
          }
        />

        {/* ── 1. Banner + Gallery ─────────────────────────────────────────── */}
        <ProviderCard padded={false} className="overflow-hidden" style={{ animationDelay: "40ms" }}>
          <div className="border-b border-[var(--color-divider)] px-6 py-4">
            <h2 className="text-sm font-semibold text-[var(--color-ink-body)]">
              {t("workshop.profile.bannerSection")}
            </h2>
          </div>

          {isEditing ? (
            <div className="space-y-5 p-6">
              <Controller
                control={control}
                name="bannerUrl"
                render={({ field }) => (
                  <ProviderImageUpload
                    label={t("workshop.profile.bannerSection")}
                    dropLabel={t("workshop.profile.dropBanner")}
                    hint={t("workshop.profile.bannerUploadHint")}
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v === "" ? undefined : v)}
                    error={
                      errors.bannerUrl?.message
                        ? t(errors.bannerUrl.message)
                        : undefined
                    }
                    maxSizeMB={8}
                    widePreview
                  />
                )}
              />
              <div className="border-t border-[var(--color-divider)] pt-5">
                <Controller
                  control={control}
                  name="photos"
                  render={({ field }) => (
                    <ProviderImageUpload
                      label={t("workshop.profile.gallerySection")}
                      dropLabel={t("workshop.profile.dropGallery")}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      multiple
                      maxSizeMB={8}
                    />
                  )}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Banner */}
              <div
                className="relative w-full overflow-hidden"
                style={{ height: "clamp(150px, 20vw, 200px)" }}
              >
                {profile.bannerUrl ? (
                  <SafeImage
                    src={profile.bannerUrl}
                    alt={profile.companyName}
                    className="h-full w-full object-cover"
                    fallback={
                      <div
                        className="flex h-full w-full flex-col items-center justify-center gap-2"
                        style={{ backgroundColor: "#043168" }}
                      >
                        <Image className="h-10 w-10 text-white/30" aria-hidden />
                        <span className="text-sm text-white/40">{profile.companyName}</span>
                      </div>
                    }
                  />
                ) : (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center gap-2"
                    style={{ backgroundColor: "#043168" }}
                  >
                    <Image className="h-10 w-10 text-white/30" aria-hidden />
                    <span className="text-sm text-white/40">
                      {t("workshop.profile.noBanner")}
                    </span>
                  </div>
                )}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(4,49,104,0) 55%, rgba(4,49,104,0.45) 100%)",
                  }}
                />
              </div>

              {/* Gallery thumbnails */}
              {profile.photos.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto p-4">
                  {profile.photos.map((src, i) => (
                    <div
                      key={i}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-provider-sm)]"
                    >
                      <SafeImage
                        src={src}
                        alt=""
                        ariaHidden
                        className="h-full w-full object-cover"
                        fallback={
                          <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-2)]">
                            <Image className="h-6 w-6 text-[var(--color-muted)]" aria-hidden />
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-5 text-[var(--color-muted)]">
                  <Image className="h-4 w-4" aria-hidden />
                  <span className="text-sm">{t("workshop.profile.noPhotos")}</span>
                </div>
              )}
            </>
          )}
        </ProviderCard>

        {/* ── 2. Basic Info ───────────────────────────────────────────────── */}
        <ProviderCard style={{ animationDelay: "70ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-ink-body)]">
              {t("workshop.profile.basicInfoSection")}
            </h2>
            {!isEditing && profile.isVerified && (
              <ProviderStatusPill tone="success" label={t("providers.profile.verified")} />
            )}
          </div>

          <div className="mb-4">
            <ProfileImageUpload
              fallbackInitial={profile.companyName?.trim().charAt(0) || "م"}
            />
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <ProviderInput
                id="companyName"
                label={t("workshop.profile.companyName")}
                error={
                  errors.companyName?.message
                    ? t(errors.companyName.message)
                    : undefined
                }
                {...register("companyName")}
              />
              <ProviderInput
                id="email"
                type="email"
                label={t("workshop.profile.email")}
                error={
                  errors.email?.message ? t(errors.email.message) : undefined
                }
                {...register("email")}
              />
              {/* Rating is admin-controlled — display only */}
              <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface-2)] px-3 py-2.5">
                <Star
                  className="h-4 w-4 fill-[var(--color-warning-500)] text-[var(--color-warning-500)] shrink-0"
                  aria-hidden
                />
                <span className="text-sm font-semibold text-[var(--color-ink-body)]">
                  {profile.rating.toFixed(1)}
                </span>
                {profile.totalRatings > 0 && (
                  <span className="text-xs text-[var(--color-muted)]">
                    ({t("workshop.profile.totalRatings", { count: profile.totalRatings })})
                  </span>
                )}
                <span className="ms-auto text-xs text-[var(--color-muted)]">
                  {t("workshop.profile.rating")} — للقراءة فقط
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-[var(--font-display)] text-xl font-bold text-[var(--color-ink-body)]">
                  {profile.companyName}
                </h3>
                {profile.isVerified && (
                  <BadgeCheck
                    className="h-5 w-5 shrink-0 text-[var(--color-success-500)]"
                    aria-hidden
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Star
                  className="h-4 w-4 fill-[var(--color-warning-500)] text-[var(--color-warning-500)]"
                  aria-hidden
                />
                <span className="text-sm font-semibold text-[var(--color-ink-body)]">
                  {profile.rating.toFixed(1)}
                </span>
                {profile.totalRatings > 0 && (
                  <span className="ms-1 text-xs text-[var(--color-muted)]">
                    ({t("workshop.profile.totalRatings", { count: profile.totalRatings })})
                  </span>
                )}
              </div>
              {profile.email && (
                <p className="text-sm text-[var(--color-muted)]">{profile.email}</p>
              )}
            </div>
          )}
        </ProviderCard>

        {/* ── 3. Specializations ──────────────────────────────────────────── */}
        <ProviderCard style={{ animationDelay: "100ms" }}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-body)]">
            {t("workshop.profile.specializationsSection")}
          </h2>

          {isEditing ? (
            <div className="space-y-5">
              {/* Service types */}
              <div>
                <p className="mb-2.5 text-sm font-medium text-[var(--color-ink-body)]">
                  {t("workshop.profile.serviceTypesLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TYPES.map((svc) => {
                    const active = serviceTypes?.includes(svc) ?? false;
                    return (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => toggleService(svc)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-sm font-medium",
                          "transition-colors duration-[var(--dur-fast)]",
                          active
                            ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange)] text-white"
                            : "border-[var(--color-divider)] bg-[var(--color-surface)] text-[var(--color-ink-body)] hover:border-[var(--color-brand-orange)]/50",
                        )}
                      >
                        {t(`workshop.profile.specializations.service.${svc}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle brands */}
              <div>
                <p className="mb-2.5 text-sm font-medium text-[var(--color-ink-body)]">
                  {t("workshop.profile.vehicleBrandsLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_BRANDS.map((brand) => {
                    const active = vehicleBrands?.includes(brand) ?? false;
                    return (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleBrand(brand)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-sm font-medium",
                          "transition-colors duration-[var(--dur-fast)]",
                          active
                            ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange)] text-white"
                            : "border-[var(--color-divider)] bg-[var(--color-surface)] text-[var(--color-ink-body)] hover:border-[var(--color-brand-orange)]/50",
                        )}
                      >
                        {t(`workshop.profile.specializations.brand.${brand}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.specializations.serviceTypes.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                    {t("workshop.profile.serviceTypesLabel")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.serviceTypes.map((svc) => (
                      <span
                        key={svc}
                        className="rounded-full border border-[var(--color-brand-orange)]/30 bg-[var(--color-brand-50)] px-3 py-1 text-sm text-[var(--color-brand-orange)]"
                      >
                        {t(`workshop.profile.specializations.service.${svc}`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.specializations.vehicleBrands.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                    {t("workshop.profile.vehicleBrandsLabel")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.vehicleBrands.map((brand) => (
                      <span
                        key={brand}
                        className="rounded-full border border-[var(--color-divider)] bg-[var(--color-surface-2)] px-3 py-1 text-sm text-[var(--color-ink-body)]"
                      >
                        {t(`workshop.profile.specializations.brand.${brand}`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.specializations.serviceTypes.length === 0 &&
                profile.specializations.vehicleBrands.length === 0 && (
                  <p className="text-sm text-[var(--color-muted)]">{t("common.none")}</p>
                )}
            </div>
          )}
        </ProviderCard>

        {/* ── 4. Working Hours ────────────────────────────────────────────── */}
        <ProviderCard style={{ animationDelay: "130ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-ink-body)]">
              {t("workshop.profile.workingHoursSection")}
            </h2>
            {isEditing && (
              <button
                type="button"
                onClick={applyHoursToAll}
                className="text-xs font-medium text-[var(--color-brand-orange)] hover:underline"
              >
                {t("workshop.profile.applyToAll")}
              </button>
            )}
          </div>

          <div className="divide-y divide-[var(--color-divider)]">
            {DAYS.map((day) => {
              if (isEditing) {
                const isClosed = workingHoursValues?.[day]?.isClosed ?? true;
                const dayErrors = errors.workingHours?.[day];
                return (
                  <div key={day} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="w-24 shrink-0 text-sm text-[var(--color-ink-body)]">
                      {t(`workshop.profile.days.${day}`)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setValue(`workingHours.${day}.isClosed`, !isClosed, {
                          shouldDirty: true,
                        })
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        "transition-colors duration-[var(--dur-fast)]",
                        isClosed
                          ? "border-[var(--color-divider)] bg-[var(--color-surface-2)] text-[var(--color-muted)]"
                          : "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange)] text-white",
                      )}
                    >
                      {isClosed
                        ? t("workshop.profile.isClosed")
                        : t("workshop.profile.isOpen")}
                    </button>
                    {!isClosed && (
                      <>
                        <input
                          type="time"
                          {...register(`workingHours.${day}.open`)}
                          aria-label={t("workshop.profile.openTime")}
                          className={cn(
                            "h-9 w-28 rounded-[var(--radius-md)] border px-2 text-sm",
                            "bg-[var(--color-surface)] text-[var(--color-ink-body)]",
                            "focus:outline-none focus:ring-2",
                            "focus:border-[var(--color-brand-orange)]",
                            "focus:ring-[var(--color-brand-orange)]/20",
                            dayErrors
                              ? "border-[var(--color-danger-500)]"
                              : "border-[var(--color-divider)]",
                          )}
                        />
                        <span className="text-xs text-[var(--color-muted)]" aria-hidden>
                          —
                        </span>
                        <input
                          type="time"
                          {...register(`workingHours.${day}.close`)}
                          aria-label={t("workshop.profile.closeTime")}
                          className={cn(
                            "h-9 w-28 rounded-[var(--radius-md)] border px-2 text-sm",
                            "bg-[var(--color-surface)] text-[var(--color-ink-body)]",
                            "focus:outline-none focus:ring-2",
                            "focus:border-[var(--color-brand-orange)]",
                            "focus:ring-[var(--color-brand-orange)]/20",
                            dayErrors
                              ? "border-[var(--color-danger-500)]"
                              : "border-[var(--color-divider)]",
                          )}
                        />
                        {dayErrors && (
                          <p
                            role="alert"
                            className="w-full text-xs text-[var(--color-danger-500)]"
                          >
                            {t("workshop.profile.validation.openCloseRequired")}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              }

              const dayData = profile.workingHours[day];
              return (
                <div key={day} className="flex items-center gap-3 py-3">
                  <span className="w-24 shrink-0 text-sm font-medium text-[var(--color-ink-body)]">
                    {t(`workshop.profile.days.${day}`)}
                  </span>
                  {dayData.isClosed ? (
                    <span className="text-sm text-[var(--color-muted)]">
                      {t("workshop.profile.isClosed")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-[var(--color-ink-body)]">
                      <Clock
                        className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]"
                        aria-hidden
                      />
                      {dayData.open} — {dayData.close}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ProviderCard>

        {/* ── 5. Location ─────────────────────────────────────────────────── */}
        <ProviderCard style={{ animationDelay: "160ms" }}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-body)]">
            {t("workshop.profile.locationSection")}
          </h2>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ProviderInput
                  id="location.address"
                  label={t("workshop.profile.address")}
                  error={
                    errors.location?.address?.message
                      ? t(errors.location.address.message)
                      : undefined
                  }
                  {...register("location.address")}
                />
                <ProviderInput
                  id="location.city"
                  label={t("workshop.profile.city")}
                  error={
                    errors.location?.city?.message
                      ? t(errors.location.city.message)
                      : undefined
                  }
                  {...register("location.city")}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProviderInput
                  id="location.lat"
                  type="number"
                  step="any"
                  label={t("workshop.profile.lat")}
                  error={
                    errors.location?.lat?.message
                      ? t(errors.location.lat.message)
                      : undefined
                  }
                  {...register("location.lat", { valueAsNumber: true })}
                />
                <ProviderInput
                  id="location.lng"
                  type="number"
                  step="any"
                  label={t("workshop.profile.lng")}
                  error={
                    errors.location?.lng?.message
                      ? t(errors.location.lng.message)
                      : undefined
                  }
                  {...register("location.lng", { valueAsNumber: true })}
                />
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                {t("workshop.profile.mapPlaceholder")}
              </p>
            </div>
          ) : profile.location ? (
            <div className="space-y-4">
              {/* Static map placeholder */}
              <div
                className="flex items-center justify-center gap-4 rounded-[var(--radius-lg)] py-10"
                style={{ backgroundColor: "#EFF4FB" }}
              >
                <MapPin
                  className="h-7 w-7 shrink-0 text-[var(--color-brand-blue)]"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-ink-body)]">
                    {profile.location.address}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {profile.location.city}
                  </p>
                </div>
              </div>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-[var(--radius-md)]",
                    "border border-[var(--color-divider)] bg-[var(--color-surface)]",
                    "px-4 py-2 text-sm font-medium text-[var(--color-ink-body)]",
                    "transition-colors hover:bg-[var(--color-surface-2)]",
                  )}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  {t("workshop.profile.openInMaps")}
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Placeholder map box */}
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] py-10"
                style={{ backgroundColor: "#EFF4FB" }}
              >
                <MapPin className="h-8 w-8 text-[var(--color-brand-blue)]/30" aria-hidden />
                <p className="text-sm text-[var(--color-muted)]">
                  {t("workshop.profile.mapPlaceholder")}
                </p>
              </div>
              {/* Fallback to legacy flat address if available */}
              {(profile.address ?? profile.city) && (
                <div className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    {[profile.address, profile.city].filter(Boolean).join("، ")}
                  </span>
                </div>
              )}
            </div>
          )}
        </ProviderCard>

        {/* ── 6. Contact ──────────────────────────────────────────────────── */}
        <ProviderCard style={{ animationDelay: "190ms" }}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-body)]">
            {t("workshop.profile.contactSection")}
          </h2>

          {isEditing ? (
            <div className="space-y-4">
              <ProviderInput
                id="contact.phone"
                type="tel"
                label={t("workshop.profile.phone")}
                leadingIcon={<Phone className="h-4 w-4" aria-hidden />}
                error={
                  errors.contact?.phone?.message
                    ? t(errors.contact.phone.message)
                    : undefined
                }
                {...register("contact.phone")}
              />
              <ProviderInput
                id="contact.whatsapp"
                type="tel"
                label={`${t("workshop.profile.whatsapp")} (${t("common.optional")})`}
                leadingIcon={<MessageCircle className="h-4 w-4" aria-hidden />}
                {...register("contact.whatsapp")}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <a
                href={`tel:${profile.contact.phone}`}
                className="flex items-center gap-3 rounded-[var(--radius-md)] p-3 transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(244,94,43,0.1)" }}
                >
                  <Phone className="h-4 w-4 text-[var(--color-brand-orange)]" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">
                    {t("workshop.profile.phone")}
                  </p>
                  <p className="text-sm font-medium text-[var(--color-ink-body)]">
                    {profile.contact.phone}
                  </p>
                </div>
              </a>

              {profile.contact.whatsapp && (
                <a
                  href={`https://wa.me/${profile.contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-[var(--radius-md)] p-3 transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-muted)]">
                      {t("workshop.profile.whatsapp")}
                    </p>
                    <p className="text-sm font-medium text-[var(--color-ink-body)]">
                      {profile.contact.whatsapp}
                    </p>
                  </div>
                </a>
              )}
            </div>
          )}
        </ProviderCard>

        {/* ── 7. Addresses ─────────────────────────────────────────────────── */}
        <ProviderAddressesSection style={{ animationDelay: "220ms" }} />

      </div>
    </form>
  );
}
