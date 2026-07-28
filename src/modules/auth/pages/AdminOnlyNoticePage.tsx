/**
 * @file AdminOnlyNoticePage.tsx
 *
 * Informational page shown to authenticated users whose role does not
 * have access to the current (admin-only) web dashboard.
 *
 * When the client/EndUser routes are frozen, `defaultHomeFor()` in
 * `RoleGuard` sends customer/driver roles here instead of the now-
 * commented-out `/app/dashboard`.
 *
 * To re-enable client routes, revert `defaultHomeFor()` and uncomment
 * the FROZEN blocks in `router.tsx`. This page can then be removed or
 * left as a harmless dead route.
 *
 * Uses shadcn Card + Button, full RTL support, i18n translation keys.
 */

import { useTranslation } from "react-i18next";
import { ShieldAlert, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { useLogout } from "@modules/auth/hooks/useLogout";

/**
 * A minimal notice page that tells non-admin users the web app is
 * currently restricted to administrators only.
 *
 * Provides a sign-out button so the user can exit cleanly.
 */
export function AdminOnlyNoticePage() {
  const { t } = useTranslation();
  const { logout: handleLogout } = useLogout();

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center gap-6">
        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
          <ShieldAlert className="h-8 w-8 text-brand-500" />
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
          {t("adminOnly.title")}
        </h1>

        {/* Description card */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ink-600 leading-relaxed">
              {t("adminOnly.description")}
            </p>
          </CardContent>
        </Card>

        {/* Logout button */}
        <Button
          variant="outline"
          onClick={() => void handleLogout()}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          {t("adminOnly.logout")}
        </Button>
      </div>
    </AuthLayout>
  );
}
