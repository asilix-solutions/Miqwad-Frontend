import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "../components/shared/DataTable";
import { useCitiesQuery } from "../hooks/useAdminQueries";
import type { City } from "../types";
import { CityFormDialog } from "../components/reference/CityFormDialog";
import { DeleteCityDialog } from "../components/reference/DeleteCityDialog";
import { Can } from "@shared/auth/Can";

export function AdminCitiesPage() {
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
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-ink-body)]">
            {t("superAdmin.cities.title")}
          </h1>
          <p className="text-[14px] text-[var(--color-muted)] mb-[20px]">
            {t("superAdmin.cities.subtitle")}
          </p>
        </div>
        <Can permission="cities.create">
          <Button
            onClick={openCreate}
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
          >
            <Plus className="me-2 h-4 w-4" />
            {t("superAdmin.cities.add")}
          </Button>
        </Can>
      </header>

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
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
