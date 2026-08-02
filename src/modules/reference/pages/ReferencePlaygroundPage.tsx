/**
 * @file ReferencePlaygroundPage.tsx
 * Verification page for the temporary NHTSA-backed car makes/models reference
 * data. Exercises loading, error, and empty states for both the makes and
 * models queries.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@shared/components/ui/spinner";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { useCarMakes } from "../hooks/useCarMakes";
import { useCarModels } from "../hooks/useCarModels";

export function ReferencePlaygroundPage() {
  const { t, i18n } = useTranslation();
  const [makeId, setMakeId] = useState<string>("all");

  const makesQuery = useCarMakes();
  const selectedMake = makesQuery.data?.find((m) => m.id === makeId) ?? null;
  const modelsQuery = useCarModels(selectedMake?.id ?? null);

  const isAr = i18n.language === "ar";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900">{t("reference.title")}</h1>
        <p className="text-sm text-muted">{t("reference.subtitle")}</p>
      </div>

      <div>
        <Label htmlFor="car-make">{t("reference.makeLabel")}</Label>
        <Select value={makeId} onValueChange={setMakeId} disabled={makesQuery.isLoading}>
          <SelectTrigger id="car-make" className="w-full">
            <SelectValue placeholder={t("reference.makePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("reference.makePlaceholder")}</SelectItem>
            {makesQuery.data?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {isAr ? m.nameAr : m.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {makesQuery.isLoading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Spinner size="sm" /> {t("common.loading")}
          </div>
        )}
        {makesQuery.isError && (
          <p className="mt-2 text-xs text-danger-500">{t("reference.makesError")}</p>
        )}
        {makesQuery.isSuccess && makesQuery.data.length === 0 && (
          <EmptyState className="mt-3" title={t("reference.makesEmpty")} />
        )}
      </div>

      {selectedMake && (
        <div>
          <Label>{t("reference.modelLabel")}</Label>

          {modelsQuery.isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Spinner size="sm" /> {t("common.loading")}
            </div>
          )}
          {modelsQuery.isError && (
            <p className="text-xs text-danger-500">{t("reference.modelsError")}</p>
          )}
          {modelsQuery.isSuccess && modelsQuery.data.length === 0 && (
            <EmptyState title={t("reference.modelsEmpty")} />
          )}
          {modelsQuery.isSuccess && modelsQuery.data.length > 0 && (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {modelsQuery.data.map((model) => (
                <li
                  key={model.id}
                  className="rounded-[var(--radius-md)] border border-divider bg-surface px-3 py-2 text-sm text-ink-body"
                >
                  {isAr ? model.nameAr : model.nameEn}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
