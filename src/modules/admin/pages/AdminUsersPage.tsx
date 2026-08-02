/**
 * @file AdminUsersPage.tsx
 * @description Admin Users screen — a single unified, role-aware list on
 * the real `GET /api/Users` endpoint. The old "Clients" / "Providers"
 * pill tabs are gone: "Providers" duplicated the dedicated
 * `/admin/providers` approval-queue page, and "Clients" relied on a
 * `role === "customer"` filter the real contract can't yet support. Tabs are
 * back as per-role tabs (`config/roleRegistry.ts`'s `ROLE_TABS`) inside
 * `UsersPanel`, now that the backend's `roleId` + server-side `FilterBy`
 * are wired up.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@app/store";
import { usePermissions } from "@shared/auth/usePermissions";

import { UsersPanel } from "../components/users/UsersPanel";
import { AddUserDialog } from "../components/users/AddUserDialog";
import { AddAdminDialog } from "../components/users/AddAdminDialog";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);

  // UX gating only — the real authorization boundary is server-side
  // ([Authorize(Roles=Admin)] on POST /api/Users). See adminApi.createAdmin.
  const { isSuperAdmin } = usePermissions();
  const currentUser = useAppSelector((s) => s.auth.user);
  const canManageAdmins =
    isSuperAdmin || currentUser?.role === "admin" || currentUser?.role === "super_admin";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink-body)]">
            {t("superAdmin.users.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("superAdmin.users.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAddUserOpen(true)}
            className="gap-2 bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("superAdmin.users.create.trigger")}
          </Button>
          {canManageAdmins && (
            <Button
              onClick={() => setAddAdminOpen(true)}
              variant="outline"
              className="gap-2 border-[var(--color-brand-blue)] text-[var(--color-brand-blue)] hover:bg-[color-mix(in_srgb,var(--color-brand-blue)_8%,transparent)]"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t("admin.addAdmin.button")}
            </Button>
          )}
        </div>
      </div>

      {addUserOpen && (
        <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} />
      )}

      {addAdminOpen && (
        <AddAdminDialog open={addAdminOpen} onOpenChange={setAddAdminOpen} />
      )}

      <UsersPanel />
    </div>
  );
}
