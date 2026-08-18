/**
 * @file WorkingHoursSelector.tsx
 *
 * Self-contained, role-agnostic unified working-hours editor for
 * `PUT /api/profile/working-days` — four dropdowns (from-day, to-day,
 * from-time, to-time), a live localized preview, and its own Save affordance
 * with loading/error/saving/success states. Reuses the shared
 * `useAccountProfileQuery` cache to prefill and invalidates it after saving.
 *
 * WorkshopOwner-only today; SalvageSpecialist (scrap) gets a 400 from the
 * backend, so this component is not wired into any scrap page yet — but it
 * takes no workshop-specific dependency, so scrap can drop it in unchanged
 * once the backend allows that role.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Loader2, Save } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { useToast } from "@shared/components/ui/toastContext";
import { ProviderSelect, ProviderSkeleton } from "@shared/provider-ui";
import { useAccountProfileQuery } from "../hooks/useProfileQueries";
import { useUpdateWorkingDaysMutation } from "../hooks/useUpdateWorkingDays";
import {
  DAY_OPTIONS,
  TIME_CODES,
  DEFAULT_WORKING_HOURS_RANGE,
  formatTimeDisplay,
  parseWorkingDaysRange,
  serializeWorkingDaysRange,
  validateWorkingHoursRange,
  type WorkingHoursRangeValue,
} from "../lib/workingHours";

export interface WorkingHoursSelectorProps {
  /** When true, renders a read-only summary line instead of the editable dropdowns. */
  readOnly?: boolean;
  style?: CSSProperties;
}

export function WorkingHoursSelector({ readOnly = false, style }: WorkingHoursSelectorProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language.startsWith("ar") ? "ar" : "en";

  const profileQuery = useAccountProfileQuery();
  const mutation = useUpdateWorkingDaysMutation();

  const [value, setValue] = useState<WorkingHoursRangeValue>(DEFAULT_WORKING_HOURS_RANGE);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (profileQuery.data && !initializedRef.current) {
      setValue(parseWorkingDaysRange(profileQuery.data.workingDays, profileQuery.data.workingHours));
      initializedRef.current = true;
    }
  }, [profileQuery.data]);

  const validation = validateWorkingHoursRange(value);

  const dayLabel = (code: WorkingHoursRangeValue["fromDay"]) =>
    t(DAY_OPTIONS.find((o) => o.value === code)?.i18nKey ?? "");

  const preview = t("accountProfile.workingHours.previewFormat", {
    fromDay: dayLabel(value.fromDay),
    toDay: dayLabel(value.toDay),
    fromTime: formatTimeDisplay(value.fromTime, lang),
    toTime: formatTimeDisplay(value.toTime, lang),
  });

  const dayOptions = DAY_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }));
  const timeOptions = TIME_CODES.map((code) => ({ value: code, label: formatTimeDisplay(code, lang) }));

  const handleSave = () => {
    if (!validation.isValid) return;
    mutation.mutate(serializeWorkingDaysRange(value), {
      onSuccess: () => toast.success(t("accountProfile.workingHours.saveSuccess")),
      onError: () => toast.error(t("accountProfile.workingHours.saveFailed")),
    });
  };

  if (profileQuery.isLoading) {
    return (
      <div style={style}>
        <ProviderSkeleton variant="block" height={120} />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center" style={style}>
        <p className="text-sm text-[var(--color-muted)]">
          {t("accountProfile.workingHours.loadFailed")}
        </p>
        <button
          type="button"
          onClick={() => void profileQuery.refetch()}
          className="text-sm font-medium text-[var(--color-brand-orange)] hover:underline"
        >
          {t("common.errorRetry")}
        </button>
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-[var(--color-ink-body)]" style={style}>
        <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" aria-hidden />
        {preview}
      </div>
    );
  }

  return (
    <div className="space-y-4" style={style}>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProviderSelect
          id="workingHours.fromDay"
          label={t("accountProfile.workingHours.fromDay")}
          value={value.fromDay}
          onValueChange={(v) => setValue((prev) => ({ ...prev, fromDay: v as WorkingHoursRangeValue["fromDay"] }))}
          options={dayOptions}
        />
        <ProviderSelect
          id="workingHours.toDay"
          label={t("accountProfile.workingHours.toDay")}
          value={value.toDay}
          onValueChange={(v) => setValue((prev) => ({ ...prev, toDay: v as WorkingHoursRangeValue["toDay"] }))}
          options={dayOptions}
          error={
            !validation.dayRangeValid ? t("accountProfile.workingHours.validation.dayRangeInvalid") : undefined
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProviderSelect
          id="workingHours.fromTime"
          label={t("accountProfile.workingHours.fromTime")}
          value={value.fromTime}
          onValueChange={(v) => setValue((prev) => ({ ...prev, fromTime: v }))}
          options={timeOptions}
        />
        <ProviderSelect
          id="workingHours.toTime"
          label={t("accountProfile.workingHours.toTime")}
          value={value.toTime}
          onValueChange={(v) => setValue((prev) => ({ ...prev, toTime: v }))}
          options={timeOptions}
          error={
            !validation.timeRangeValid ? t("accountProfile.workingHours.validation.timeRangeInvalid") : undefined
          }
        />
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface-2)] px-3 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {t("accountProfile.workingHours.previewLabel")}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-ink-body)]">
          <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" aria-hidden />
          {preview}
        </p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!validation.isValid || mutation.isPending}
        className={cn(
          "flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)]",
          "bg-[var(--color-brand-orange)] px-5 text-sm font-semibold text-white",
          "transition-colors duration-[var(--dur-fast)] hover:bg-[#E3460F]",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Save className="h-4 w-4" aria-hidden />
        )}
        {t("accountProfile.workingHours.save")}
      </button>
    </div>
  );
}
