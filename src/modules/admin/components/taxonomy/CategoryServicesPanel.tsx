/**
 * @file CategoryServicesPanel.tsx
 * @description Detail panel for the selected category's assigned services
 * (real GET/DELETE `/Categories/{id}/services*`). Same content renders two
 * ways depending on viewport:
 *  - `variant="panel"`: persistent side-by-side panel (desktop).
 *  - `variant="sheet"`: bottom sheet that opens on row tap (narrow/mobile).
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Can } from "@shared/auth/Can";
import {
  useCategoryServicesQuery,
  useUnassignServiceMutation,
} from "@modules/services/hooks/useServicesAdminQueries";
import type { ServiceCategory } from "@modules/services/types";
import { ServiceAssignPickerDialog } from "./ServiceAssignPickerDialog";

interface PanelProps {
  category: ServiceCategory | null;
}

type Props =
  | (PanelProps & { variant: "panel" })
  | (PanelProps & { variant: "sheet"; open: boolean; onOpenChange: (open: boolean) => void });

export function CategoryServicesPanel(props: Props) {
  const { category, variant } = props;

  if (variant === "panel") {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-sm min-h-[240px]">
        <CategoryServicesContent category={category} />
      </div>
    );
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="bottom">
        {category && (
          <>
            <SheetHeader>
              <SheetTitle>{category.nameAr}</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto">
              <CategoryServicesContent category={category} bare />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CategoryServicesContent({
  category,
  bare = false,
}: PanelProps & { bare?: boolean }) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: services, isLoading, isError } = useCategoryServicesQuery(category?.id ?? null);
  const unassignMutation = useUnassignServiceMutation();

  if (!category) {
    return (
      <div className="p-10 text-center space-y-2">
        <Layers className="h-8 w-8 mx-auto text-[var(--color-muted)]" />
        <p className="text-sm font-medium text-[var(--color-ink-body)]">
          {t("superAdmin.taxonomy.detail.noSelection.title")}
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          {t("superAdmin.taxonomy.detail.noSelection.description")}
        </p>
      </div>
    );
  }

  const handleUnassign = (serviceId: number) => {
    unassignMutation.mutate({ categoryId: category.id, serviceId });
  };

  return (
    <div className="flex flex-col gap-4">
      {!bare && (
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--color-divider)]">
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-muted)]">
              {t("superAdmin.taxonomy.detail.title")}
            </p>
            <h3 className="text-sm font-semibold text-[var(--color-ink-body)] truncate">
              {category.nameAr}
            </h3>
          </div>
          <Can permission="categories.edit">
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("superAdmin.taxonomy.detail.assign")}
            </Button>
          </Can>
        </div>
      )}

      <div className={bare ? "space-y-3" : "px-4 pb-4 space-y-3"}>
        {bare && (
          <Can permission="categories.edit">
            <Button size="sm" block onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("superAdmin.taxonomy.detail.assign")}
            </Button>
          </Can>
        )}

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-[var(--radius-md)]" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <p className="text-sm text-[var(--color-danger-500)] text-center py-6">
            {t("superAdmin.taxonomy.detail.error")}
          </p>
        )}

        {!isLoading && !isError && (services?.length ?? 0) === 0 && (
          <p className="text-sm text-[var(--color-muted)] text-center py-8">
            {t("superAdmin.taxonomy.detail.empty")}
          </p>
        )}

        {!isLoading && !isError && services && services.length > 0 && (
          <ul role="list" className="flex flex-wrap gap-2">
            {services.map((service) => (
              <li
                key={service.id}
                className="group/chip flex items-center gap-1.5 rounded-full bg-[var(--color-surface-2)] ps-3 pe-1.5 py-1.5 text-sm text-[var(--color-ink-body)]"
              >
                <span className="truncate max-w-[200px]">{service.name}</span>
                <Can permission="categories.edit">
                  <button
                    type="button"
                    title={t("superAdmin.taxonomy.detail.unassignConfirm", { name: service.name })}
                    onClick={() => handleUnassign(service.id)}
                    disabled={unassignMutation.isPending}
                    className="h-5 w-5 flex items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-danger-500)]/10 hover:text-[var(--color-danger-500)] transition-colors disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Can>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pickerOpen && (
        <ServiceAssignPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          category={category}
          assignedIds={new Set((services ?? []).map((s) => s.id))}
        />
      )}
    </div>
  );
}
