import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "../components/shared/DataTable";
import { useAdminCategoriesQuery } from "../hooks/useAdminQueries";
import type { ServiceCategory } from "@modules/services/types";
import { CategoryFormDialog } from "../components/reference/CategoryFormDialog";
import { DeleteCategoryDialog } from "../components/reference/DeleteCategoryDialog";
import { Can } from "@shared/auth/Can";

const COLOR_MAP: Record<string, string> = {
  blue: "var(--color-brand-blue)",
  green: "var(--color-success-500)",
  orange: "var(--color-brand-orange)",
  purple: "var(--color-surface-4)",
  red: "var(--color-danger-500)",
  navy: "var(--color-ink-900)",
};

export function AdminCategoriesPage() {
  const { t } = useTranslation();
  const q = useAdminCategoriesQuery();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null);

  const openCreate = () => {
    setFormMode("create");
    setSelectedCategory(undefined);
    setFormOpen(true);
  };

  const openEdit = (cat: ServiceCategory) => {
    setFormMode("edit");
    setSelectedCategory(cat);
    setFormOpen(true);
  };

  const openDelete = (cat: ServiceCategory) => {
    setCategoryToDelete(cat);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-ink-body)]">
            {t("superAdmin.categories.title")}
          </h1>
          <p className="text-[14px] text-[var(--color-muted)] mb-[20px]">
            {t("superAdmin.categories.subtitle")}
          </p>
        </div>
        <Can permission="categories.create">
          <Button
            onClick={openCreate}
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
          >
            <Plus className="me-2 h-4 w-4" />
            {t("superAdmin.categories.add")}
          </Button>
        </Can>
      </header>

      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<ServiceCategory>
          rows={q.data ?? []}
          isLoading={q.isLoading}
          isError={q.isError}
          getRowKey={(cat) => cat.id.toString()}
          columns={[
            {
              key: "nameAr",
              header: t("superAdmin.categories.columns.nameAr"),
              render: (cat: ServiceCategory) => cat.nameAr,
            },
            {
              key: "nameEn",
              header: t("superAdmin.categories.columns.nameEn"),
              render: (cat: ServiceCategory) => <span dir="ltr">{cat.nameEn}</span>,
            },
            {
              key: "colorHint",
              header: t("superAdmin.categories.columns.colorHint"),
              render: (cat: ServiceCategory) => {
                if (!cat.colorHint) return "—";
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border border-[var(--color-divider)]"
                      style={{ backgroundColor: COLOR_MAP[cat.colorHint] || "#ccc" }}
                    />
                    <span>
                      {t(`superAdmin.categories.form.colorOptions.${cat.colorHint}`, {
                        defaultValue: cat.colorHint,
                      })}
                    </span>
                  </div>
                );
              },
            },
            {
              key: "actions",
              header: t("superAdmin.categories.columns.actions"),
              className: "text-end",
              render: (cat: ServiceCategory) => (
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Can permission="categories.edit">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Can>
                  <Can permission="categories.delete">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--color-danger-500)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                      onClick={() => openDelete(cat)}
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
        <CategoryFormDialog
          mode={formMode}
          category={selectedCategory}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}

      {deleteOpen && (
        <DeleteCategoryDialog
          category={categoryToDelete}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </div>
  );
}
