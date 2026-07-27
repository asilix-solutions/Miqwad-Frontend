import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Plus, ShieldCheck } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@app/store";
import { usePermissions } from "@shared/auth/usePermissions";

import { ClientsPanel } from "../components/users/ClientsPanel";
import { ProvidersPanel } from "../components/users/ProvidersPanel";
import { AddUserDialog } from "../components/users/AddUserDialog";
import { AddAdminDialog } from "../components/users/AddAdminDialog";

type TabValue = "clients" | "providers";

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);

  // UX gating only — the real authorization boundary is server-side
  // ([Authorize(Roles=Admin)] on POST /api/Users). See adminApi.createAdmin.
  const { isSuperAdmin } = usePermissions();
  const currentUser = useAppSelector((s) => s.auth.user);
  const canManageAdmins =
    isSuperAdmin || currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const currentTab = (searchParams.get("tab") as TabValue) || "clients";

  const setTab = (tab: TabValue) => {
    setSearchParams({ tab });
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: "clients", label: t("superAdmin.users.tabs.clients") },
    { value: "providers", label: t("superAdmin.users.tabs.providers") },
  ];

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

      {/* URL-synced Pill Tabs */}
      <div className="flex bg-[var(--color-surface-2)] p-1 rounded-full w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTab(tab.value)}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-full transition-colors",
              currentTab === tab.value
                ? "bg-white text-[var(--color-brand-blue)] shadow-sm"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink-body)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="mt-2">
        {currentTab === "clients" && <ClientsPanel />}
        {currentTab === "providers" && <ProvidersPanel />}
      </div>
    </div>
  );
}
