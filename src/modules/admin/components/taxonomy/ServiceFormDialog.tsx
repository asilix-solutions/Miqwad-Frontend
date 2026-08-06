/**
 * @file ServiceFormDialog.tsx
 * @description Create/edit dialog for a single Service tree node — Arabic
 * name + optional "الخدمة الأب" parent picker (sets `parentServiceId`; the
 * root option clears it to `null`). When editing, the picker excludes the
 * node itself and all of its descendants so a save can never create a cycle
 * in the self-join tree.
 */

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@shared/components/ui/toastContext";
import { useCreateServiceMutation, useUpdateServiceMutation } from "@modules/services/hooks/useServicesAdminQueries";
import { serviceEntitySchema, type ServiceEntityFormValues } from "@modules/services/schemas/serviceEntity.schema";
import type { Service } from "@modules/services/service.types";

const ROOT_VALUE = "root";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "add" | "edit";
  service?: Service;
  tree: Service[];
}

function collectDescendantIds(node: Service): Set<number> {
  const ids = new Set<number>([node.id]);
  for (const child of node.children ?? []) {
    collectDescendantIds(child).forEach((id) => ids.add(id));
  }
  return ids;
}

function flattenForPicker(
  nodes: Service[],
  excludeIds: Set<number>,
  depth = 0,
): { id: number; label: string }[] {
  const out: { id: number; label: string }[] = [];
  for (const node of nodes) {
    if (!excludeIds.has(node.id)) {
      out.push({ id: node.id, label: `${"— ".repeat(depth)}${node.name}` });
    }
    if (node.children?.length) {
      out.push(...flattenForPicker(node.children, excludeIds, depth + 1));
    }
  }
  return out;
}

export function ServiceFormDialog({ open, onOpenChange, mode, service, tree }: Props) {
  const { t } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateServiceMutation();
  const updateMutation = useUpdateServiceMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const excludeIds = useMemo(
    () => (mode === "edit" && service ? collectDescendantIds(service) : new Set<number>()),
    [mode, service],
  );
  const parentOptions = useMemo(() => flattenForPicker(tree, excludeIds), [tree, excludeIds]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceEntityFormValues>({
    resolver: zodResolver(serviceEntitySchema),
    defaultValues: { name: "", parentServiceId: null },
  });

  const parentServiceId = watch("parentServiceId");

  useEffect(() => {
    if (!open) return;
    reset({
      name: mode === "edit" && service ? service.name : "",
      parentServiceId: mode === "edit" && service ? service.parentServiceId : null,
    });
  }, [open, mode, service, reset]);

  const dialogTitle =
    mode === "add"
      ? t("superAdmin.taxonomy.servicesTab.addTitle")
      : t("superAdmin.taxonomy.servicesTab.editTitle");

  const onSubmit = async (data: ServiceEntityFormValues) => {
    try {
      if (mode === "edit" && service) {
        await updateMutation.mutateAsync({
          id: service.id,
          input: { name: data.name, parentServiceId: data.parentServiceId },
        });
      } else {
        await createMutation.mutateAsync({ name: data.name, parentServiceId: data.parentServiceId });
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[420px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="service-name">
              {t("superAdmin.taxonomy.servicesTab.form.name")}{" "}
              <span className="text-[var(--color-danger-500)]">*</span>
            </Label>
            <Input id="service-name" {...register("name")} disabled={isPending} />
            {errors.name && (
              <p className="text-sm text-[var(--color-danger-500)]">{t(errors.name.message as string)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-parent">{t("superAdmin.taxonomy.servicesTab.form.parent")}</Label>
            <Select
              disabled={isPending}
              value={parentServiceId == null ? ROOT_VALUE : String(parentServiceId)}
              onValueChange={(val) =>
                setValue("parentServiceId", val === ROOT_VALUE ? null : Number(val))
              }
            >
              <SelectTrigger id="service-parent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value={ROOT_VALUE}>
                  {t("superAdmin.taxonomy.servicesTab.form.rootOption")}
                </SelectItem>
                {parentOptions.map((opt) => (
                  <SelectItem key={opt.id} value={String(opt.id)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
            >
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
