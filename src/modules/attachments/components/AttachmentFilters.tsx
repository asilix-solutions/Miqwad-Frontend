/**
 * @file AttachmentFilters.tsx
 * @description Client-side search + file-kind filter chips + grid/list
 * toggle for the attachments page. The API has no search/filter params, so
 * all filtering happens in-memory — `AttachmentsPage` owns the seam for a
 * future server-side query.
 */
import { LayoutGrid, List } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@shared/lib/utils";
import type { AttachmentFileKind } from "../types";

export type KindFilter = "all" | AttachmentFileKind;
export type ViewMode = "grid" | "list";

interface AttachmentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  kindFilter: KindFilter;
  onKindFilterChange: (value: KindFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
}

const KIND_OPTIONS: KindFilter[] = ["all", "image", "pdf", "doc", "other"];

export function AttachmentFilters({
  search,
  onSearchChange,
  kindFilter,
  onKindFilterChange,
  viewMode,
  onViewModeChange,
}: AttachmentFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("attachments.filters.searchPlaceholder")}
          className="w-full sm:w-[240px]"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {KIND_OPTIONS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => onKindFilterChange(kind)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                kindFilter === kind
                  ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange)] text-white"
                  : "border-[var(--color-divider)] text-[var(--color-ink-body)] hover:bg-[var(--color-surface-2)]",
              )}
            >
              {t(`attachments.filters.kinds.${kind}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-1">
        <Button
          type="button"
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon-sm"
          title={t("attachments.filters.gridView")}
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="size-4" />
        </Button>
        <Button
          type="button"
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon-sm"
          title={t("attachments.filters.listView")}
          onClick={() => onViewModeChange("list")}
        >
          <List className="size-4" />
        </Button>
      </div>
    </div>
  );
}
