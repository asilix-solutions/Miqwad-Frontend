import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultCouponFilters, type CouponFiltersValue } from "../lib/couponFilters";

const selectClass =
  "h-10 w-full min-w-0 rounded-md border border-[var(--color-divider)] bg-[var(--color-surface)] px-3 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-brand-blue)]";
export function CouponFilters({
  value,
  onApply,
  onReset,
}: {
  value: CouponFiltersValue;
  onApply: (value: CouponFiltersValue) => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft);
      }}
      className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4"
      aria-label={t("coupons.filters")}
    >
      <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-4">
        <label className="space-y-1.5 text-sm">
          <span>{t("coupons.filterBy")}</span>
          <select
            className={selectClass}
            value={draft.mode}
            onChange={(event) => {
              const mode = event.target.value;
              if (mode === "all" || mode === "code" || mode === "enabled" || mode === "disabled")
                setDraft({ ...draft, mode });
            }}
          >
            {(["all", "code", "enabled", "disabled"] as const).map((mode) => (
              <option key={mode} value={mode}>
                {t(`coupons.filterModes.${mode}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span>{t("coupons.codeSearch")}</span>
          <Input
            dir="auto"
            value={draft.code}
            disabled={draft.mode !== "code"}
            onChange={(event) => setDraft({ ...draft, code: event.target.value })}
          />
        </label>
        <label className="min-w-0 space-y-1.5 text-sm">
          <span>{t("coupons.createdFrom")}</span>
          <Input
            type="datetime-local"
            dir="ltr"
            value={draft.fromDate}
            onChange={(event) => setDraft({ ...draft, fromDate: event.target.value })}
          />
        </label>
        <label className="min-w-0 space-y-1.5 text-sm">
          <span>{t("coupons.createdTo")}</span>
          <Input
            type="datetime-local"
            dir="ltr"
            value={draft.toDate}
            onChange={(event) => setDraft({ ...draft, toDate: event.target.value })}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-40 space-y-1.5 text-sm">
          <span>{t("coupons.sortBy")}</span>
          <select
            className={selectClass}
            value={draft.sortBy}
            onChange={(event) => {
              const sortBy = event.target.value;
              if (sortBy === "createdAt" || sortBy === "endDate" || sortBy === "usedCount")
                setDraft({ ...draft, sortBy });
            }}
          >
            {(["createdAt", "endDate", "usedCount"] as const).map((field) => (
              <option key={field} value={field}>
                {t(`coupons.${field}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-32 space-y-1.5 text-sm">
          <span>{t("coupons.sortDirection")}</span>
          <select
            className={selectClass}
            value={draft.sortDescending ? "desc" : "asc"}
            onChange={(event) =>
              setDraft({ ...draft, sortDescending: event.target.value === "desc" })
            }
          >
            <option value="desc">{t("coupons.descending")}</option>
            <option value="asc">{t("coupons.ascending")}</option>
          </select>
        </label>
        <Button type="submit">{t("coupons.apply")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraft(defaultCouponFilters);
            onReset();
          }}
        >
          {t("coupons.reset")}
        </Button>
      </div>
      <p className="text-xs text-[var(--color-muted)]">{t("coupons.filterHint")}</p>
    </form>
  );
}
