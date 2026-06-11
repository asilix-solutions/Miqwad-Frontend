/**
 * @file CitiesPanel.tsx
 * @description Cities CRUD panel – table + add/edit/delete dialogs.
 * Rendered inside AdminReferenceDataPage; does NOT include its own page header
 * (the container page owns the h1). All CRUD logic, hooks, dialogs, and
 * <Can> permission gating are preserved from the original AdminCitiesPage.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "../shared/DataTable";
import { useCitiesQuery } from "../../hooks/useAdminQueries";
import type { City } from "../../types";
import { CityFormDialog } from "./CityFormDialog";
import { DeleteCityDialog } from "./DeleteCityDialog";
import { Can } from "@shared/auth/Can";

export function CitiesPanel() {
  const { t } = useTranslation();
  const q = useCitiesQuery();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedCity, setSelectedCity] = useState<City | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);

  const openCreate = () => {
    setFormMode("create");
    setSelectedCity(undefined);
    setFormOpen(true);
  };

  const openEdit = (city: City) => {
    setFormMode("edit");
    setSelectedCity(city);
    setFormOpen(true);
  };

  const openDelete = (city: City) => {
    setCityToDelete(city);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Add button toolbar */}
      <div className="flex justify-end">
        <Can permission="cities.create">
          <Button
            onClick={openCreate}
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
          >
            <Plus className="me-2 h-4 w-4" />
            {t("superAdmin.cities.add")}
          </Button>
        </Can>
      </div>

      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<City>
          rows={q.data ?? []}
          isLoading={q.isLoading}
          isError={q.isError}
          getRowKey={(city) => city.id}
          columns={[
            {
              key: "nameAr",
              header: t("superAdmin.cities.columns.nameAr"),
              render: (city: City) => city.nameAr,
            },
            {
              key: "nameEn",
              header: t("superAdmin.cities.columns.nameEn"),
              render: (city: City) => <span dir="ltr">{city.nameEn}</span>,
            },
            {
              key: "actions",
              header: t("superAdmin.cities.columns.actions"),
              className: "text-end",
              render: (city: City) => (
                <div
                  className="flex justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Can permission="cities.edit">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                      onClick={() => openEdit(city)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Can>
                  <Can permission="cities.delete">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--color-danger-500)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                      onClick={() => openDelete(city)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Can>
                </div>
              ),
            },
          ]}
        />
      </div>

      {formOpen && (
        <CityFormDialog
          mode={formMode}
          city={selectedCity}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}

      {deleteOpen && (
        <DeleteCityDialog
          city={cityToDelete}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </div>
  );
}
