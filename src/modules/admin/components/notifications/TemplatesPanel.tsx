import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import {
  useTemplatesQuery,
  useUpdateTemplateMutation,
} from "../../hooks/useAdminQueries";
import { DataTable } from "../shared/DataTable";
import { Can } from "@shared/auth/Can";
import { Button } from "@/components/ui/button";
import type { NotificationTemplate } from "@modules/notifications/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@shared/lib/utils";
import { DeleteTemplateDialog } from "./DeleteTemplateDialog";
import { TemplateFormDialog } from "./TemplateFormDialog";
import { useToast } from "@shared/components/ui/toastContext";

export function TemplatesPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  
  const { data: templates, isLoading, error } = useTemplatesQuery();
  const updateMutation = useUpdateTemplateMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [deleteDialogTemplate, setDeleteDialogTemplate] = useState<NotificationTemplate | null>(null);

  const handleToggleActive = async (template: NotificationTemplate) => {
    try {
      await updateMutation.mutateAsync({
        id: template.id,
        payload: { isActive: !template.isActive },
      });
      toast.success(t("superAdmin.notifications.templates.success.updated"));
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const columns = [
    {
      key: "nameAr",
      header: t("superAdmin.notifications.templates.columns.nameAr"),
      render: (row: NotificationTemplate) => (
        <span className={cn(!row.isActive && "text-[var(--color-ink-lighter)]")}>
          {row.nameAr}
        </span>
      ),
    },
    {
      key: "nameEn",
      header: t("superAdmin.notifications.templates.columns.nameEn"),
      render: (row: NotificationTemplate) => (
        <span className={cn(!row.isActive && "text-[var(--color-ink-lighter)]")}>
          {row.nameEn}
        </span>
      ),
    },
    {
      key: "channel",
      header: t("superAdmin.notifications.templates.columns.channel"),
      render: (row: NotificationTemplate) => (
        <span className="text-sm">
          {t(`superAdmin.notifications.channels.${row.channel}`)}
        </span>
      ),
    },
    {
      key: "variables",
      header: t("superAdmin.notifications.templates.columns.variables"),
      render: (row: NotificationTemplate) => (
        <span className="tabular-nums">
          {t("superAdmin.notifications.templates.variablesCount", { count: row.variables?.length || 0 })}
        </span>
      ),
    },
    {
      key: "status",
      header: t("superAdmin.notifications.templates.columns.status"),
      render: (row: NotificationTemplate) => (
        <Badge tone={row.isActive ? "success" : "neutral"}>
          {row.isActive 
            ? t("superAdmin.notifications.templates.status.active") 
            : t("superAdmin.notifications.templates.status.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      className: "text-end",
      render: (row: NotificationTemplate) => (
        <div className="flex justify-end gap-2">
          <Can permission="notifications.manage">
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-8 h-8", row.isActive ? "text-[var(--color-brand-orange)]" : "text-[var(--color-ink-lighter)]")}
              onClick={() => handleToggleActive(row)}
              disabled={updateMutation.isPending}
            >
              <Power size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-[var(--color-ink-lighter)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
              onClick={() => handleEdit(row)}
            >
              <Pencil size={16} />
            </Button>
          </Can>
          <Can permission="notifications.delete">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-danger-500 hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
              onClick={() => setDeleteDialogTemplate(row)}
            >
              <Trash2 size={16} />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Can permission="notifications.manage">
          <Button
            onClick={handleAdd}
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 text-white gap-2"
          >
            <Plus size={18} />
            {t("superAdmin.notifications.templates.add")}
          </Button>
        </Can>
      </div>

      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<NotificationTemplate>
          rows={templates ?? []}
          columns={columns}
          isLoading={isLoading}
          isError={!!error}
          getRowKey={(row) => String(row.id)}
          emptyText={t("common.empty.noData")}
        />
      </div>

      {formOpen && (
        <TemplateFormDialog
          template={editingTemplate}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}

      {deleteDialogTemplate && (
        <DeleteTemplateDialog
          template={deleteDialogTemplate}
          open={!!deleteDialogTemplate}
          onOpenChange={(open: boolean) => !open && setDeleteDialogTemplate(null)}
        />
      )}
    </div>
  );
}
