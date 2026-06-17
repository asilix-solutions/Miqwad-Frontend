/**
 * @file AdminCampaignBuilderPage.tsx
 * @description Campaign Builder page (create + edit) for the Maqwad admin ads system.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, ImageIcon } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import { PageLoader } from "@shared/components/feedback/PageLoader";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  useCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  usePlacementsQuery,
} from "@modules/admin/hooks/useAdminQueries";
import { campaignSchema, type CampaignFormValues } from "@modules/admin/schemas/admin.schemas";
import { StatusBadge } from "@modules/admin/components/shared/StatusBadge";
import type { AdCampaignStatus } from "@modules/ads/types";

// Pure helper: derives status from dates and paused flag to prevent contradictions
function deriveStatus(startsAt: string | undefined, endsAt: string | undefined, paused: boolean): AdCampaignStatus {
  if (paused) return "paused";
  if (!startsAt || !endsAt) return "draft";
  const now = Date.now();
  if (now < new Date(startsAt).getTime()) return "scheduled";
  // The endsAt day typically goes until 23:59:59, but for now we just use the raw parse
  // In a real app we might pad endsAt to the end of the day or use the strict date.
  // The schema requires them as dates.
  if (now > new Date(endsAt).getTime()) return "ended";
  return "active";
}

export function AdminCampaignBuilderPage() {
  const { id } = useParams();
  const isEdit = id !== "new";
  const campaignId = isEdit ? Number(id) : 0;

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dir = i18n.dir();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const toast = useToast();

  const { data: existingCampaign, isLoading: isLoadingCampaign } = useCampaignQuery(campaignId, isEdit);
  const { data: placements = [] } = usePlacementsQuery({ isActive: true });

  const createMutation = useCreateCampaignMutation();
  const updateMutation = useUpdateCampaignMutation();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    mode: "onChange",
    defaultValues: {
      titleAr: "",
      titleEn: "",
      descriptionAr: "",
      descriptionEn: "",
      imageUrl: "",
      targetUrl: "",
      placementId: undefined as unknown as number,
      startsAt: "",
      endsAt: "",
      status: "draft",
      priority: 0,
    },
  });

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isEdit && existingCampaign) {
      setIsPaused(existingCampaign.status === "paused");
      form.reset({
        titleAr: existingCampaign.titleAr,
        titleEn: existingCampaign.titleEn,
        descriptionAr: existingCampaign.descriptionAr || "",
        descriptionEn: existingCampaign.descriptionEn || "",
        imageUrl: existingCampaign.imageUrl || "",
        targetUrl: existingCampaign.targetUrl || "",
        placementId: existingCampaign.placementId,
        startsAt: existingCampaign.startsAt,
        endsAt: existingCampaign.endsAt,
        status: existingCampaign.status,
        priority: existingCampaign.priority,
      });
    }
  }, [isEdit, existingCampaign, form]);

  const startsAt = form.watch("startsAt");
  const endsAt = form.watch("endsAt");

  const derivedStatus = deriveStatus(startsAt, endsAt, isPaused);

  useEffect(() => {
    form.setValue("status", derivedStatus, { shouldValidate: true, shouldDirty: true });
  }, [derivedStatus, form]);

  const titleAr = form.watch("titleAr");
  const titleEn = form.watch("titleEn");
  const descriptionAr = form.watch("descriptionAr");
  const descriptionEn = form.watch("descriptionEn");
  const imageUrl = form.watch("imageUrl");
  const placementId = form.watch("placementId");

  const onSubmit = async (values: CampaignFormValues) => {
    try {
      if (isEdit && campaignId) {
        await updateMutation.mutateAsync({ id: campaignId, payload: values });
        toast.success(t("superAdmin.ads.builder.updated"));
      } else {
        await createMutation.mutateAsync(values);
        toast.success(t("superAdmin.ads.builder.created"));
      }
      navigate("/admin/ads?tab=campaigns");
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  if (isEdit && isLoadingCampaign) return <PageLoader />;

  const displayTitle = dir === "rtl" ? titleAr : titleEn;
  const displayDescription = dir === "rtl" ? descriptionAr : descriptionEn;
  const selectedPlacement = placements.find((p: any) => p.id === placementId);
  const displayPlacementName = selectedPlacement ? (dir === "rtl" ? selectedPlacement.nameAr : selectedPlacement.nameEn) : "—";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/ads?tab=campaigns"
            className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-ink-lighter)] hover:text-[var(--color-ink-body)] shrink-0"
          >
            <BackIcon size={20} />
          </Link>
          <h1 className="text-[22px] font-bold text-[var(--color-ink-title)]">
            {isEdit
              ? t("superAdmin.ads.builder.editTitle")
              : t("superAdmin.ads.builder.createTitle")}
          </h1>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={!form.formState.isValid || isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
          {t("common.save")}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Column: Form */}
        <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-lg)] p-6 shadow-sm w-full">
          <Form {...form}>
            <form id="campaign-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              {/* Bilingual title grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={form.control}
                  name="titleAr"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{t("superAdmin.ads.placements.form.nameAr")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                    </FormItem>
                  )}
                />
                <Controller
                  control={form.control}
                  name="titleEn"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{t("superAdmin.ads.placements.form.nameEn")}</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              {/* Bilingual description grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={form.control}
                  name="descriptionAr"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{t("superAdmin.ads.placements.form.descAr")} ({t("common.optional")})</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} className="resize-none" />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                    </FormItem>
                  )}
                />
                <Controller
                  control={form.control}
                  name="descriptionEn"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{t("superAdmin.ads.placements.form.descEn")} ({t("common.optional")})</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} dir="ltr" className="resize-none" />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              {/* Placement */}
              <Controller
                control={form.control}
                name="placementId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.ads.builder.placement")}</FormLabel>
                    <Select
                      dir={dir as "rtl" | "ltr"}
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("common.select")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {placements.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {dir === "rtl" ? p.nameAr : p.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              {/* imageUrl */}
              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.ads.builder.imageUrl")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} dir="ltr" placeholder={t("superAdmin.ads.builder.imageUrlHint")} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              {/* targetUrl */}
              <Controller
                control={form.control}
                name="targetUrl"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.ads.builder.targetUrl")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} dir="ltr" />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && (t as any)(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              {/* Date range grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>{t("superAdmin.ads.builder.startsAt")}</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      {...form.register("startsAt")}
                      className="w-full h-[var(--size-input-h)] rounded-[var(--radius-md)] border border-input px-3 bg-transparent"
                      dir="ltr"
                    />
                  </FormControl>
                  {form.formState.errors.startsAt && (
                    <FormMessage>{(t as any)(form.formState.errors.startsAt.message)}</FormMessage>
                  )}
                </FormItem>

                <FormItem>
                  <FormLabel>{t("superAdmin.ads.builder.endsAt")}</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      {...form.register("endsAt")}
                      className="w-full h-[var(--size-input-h)] rounded-[var(--radius-md)] border border-input px-3 bg-transparent"
                      dir="ltr"
                    />
                  </FormControl>
                  {form.formState.errors.endsAt && (
                    <FormMessage>{(t as any)(form.formState.errors.endsAt.message)}</FormMessage>
                  )}
                </FormItem>
              </div>

              {/* Paused toggle */}
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("superAdmin.ads.builder.paused")}
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={isPaused}
                    onCheckedChange={setIsPaused}
                  />
                </FormControl>
              </FormItem>

            </form>
          </Form>
        </div>

        {/* Side Column: Preview */}
        <div className="flex flex-col gap-6 w-full lg:w-[340px] shrink-0 sticky top-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-lg)] p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-semibold text-lg text-[var(--color-ink-title)]">
              {t("superAdmin.ads.builder.preview")}
            </h3>
            
            <div className="flex flex-col gap-3" dir={dir}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={displayTitle || ""}
                  className="w-full h-32 object-cover rounded-[var(--radius-md)]"
                />
              ) : (
                <div className="w-full bg-[var(--color-surface-2)] h-32 rounded-[var(--radius-md)] flex items-center justify-center">
                  <ImageIcon className="text-[var(--color-muted)]" size={40} />
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-[var(--color-ink-body)] truncate">
                  {displayTitle || "—"}
                </h4>
                <p className="text-sm text-[var(--color-muted)] line-clamp-3 mt-1 min-h-[1.25rem]">
                  {displayDescription || "—"}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="text-xs text-[var(--color-muted)] truncate max-w-[120px]">
                  {displayPlacementName}
                </span>
                <StatusBadge kind="campaign" status={derivedStatus} />
              </div>
            </div>

            <div className="mt-2 text-center border-t pt-4">
              {startsAt && endsAt ? (
                <p className="text-xs text-[var(--color-muted)]" dir="ltr">
                  {startsAt} &rarr; {endsAt}
                </p>
              ) : (
                <p className="text-xs text-[var(--color-muted)]">
                  {t("superAdmin.ads.builder.periodEmpty")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
