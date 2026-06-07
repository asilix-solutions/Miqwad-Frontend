import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import { cn } from "@shared/lib/utils";

interface Props {
  defaultValues: number[];
  onNext: (categoryIds: number[]) => void;
  onBack: () => void;
}

/**
 * Step 3 — Pick the service categories the provider covers.
 * Multi-select chips; all categories optional so a provider can
 * sign up first and refine their offering later.
 */
export function RegisterStepServices({ defaultValues, onNext, onBack }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const categoriesQ = useServiceCategoriesQuery();
  const [picked, setPicked] = useState<number[]>(defaultValues);

  const toggle = (id: number) => {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (categoriesQ.isLoading) return <LoadingState />;
  if (categoriesQ.isError) {
    return <ErrorState onRetry={() => categoriesQ.refetch()} />;
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="font-display text-base font-semibold text-ink-900">
          {t("providers.fields.categories")}
        </h3>
        <p className="text-sm text-ink-500">{t("providers.fields.categoriesHint")}</p>
      </header>

      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {categoriesQ.data?.map((c) => {
          const selected = picked.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-[var(--radius-sm)] border bg-white text-start transition-colors",
                selected
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-200 hover:border-brand-300",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md border-2 shrink-0",
                  selected ? "bg-brand-500 border-brand-500" : "border-ink-300",
                )}
              >
                {selected && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="text-sm font-medium text-ink-900 line-clamp-1">
                {isAr ? c.nameAr : c.nameEn}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-4 border-t border-ink-100 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("common.back")}
        </Button>
        <Button type="button" onClick={() => onNext(picked)}>
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
