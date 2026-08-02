/**
 * @file AdminUserDetailsPage.tsx
 * @description User detail view on the real `GET /api/Users/{id}`. Status
 * derives from `isActive` (the real contract has no "pending" state).
 * `ordersCount` / `lastActiveAt` are gone — the backend has no source for
 * them. Suspend/restore stay wired to the mock `/admin/users/{id}/suspend|
 * restore` endpoints (out of scope for this piece — see piece b).
 */
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useUserQuery } from "../hooks/useAdminQueries";
import { roleLabel } from "../config/roleRegistry";
import { SuspendUserDialog } from "../components/users/SuspendUserDialog";
import { RestoreUserDialog } from "../components/users/RestoreUserDialog";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Can } from "@shared/auth/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@shared/lib/formatDate";

export function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { data: user, isLoading, isError } = useUserQuery(id!);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const isRtl = i18n.language === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 max-w-4xl">
        <h2 className="text-2xl font-bold text-neutral-800">
          {isError ? t("superAdmin.users.detail.error") : t("superAdmin.users.detail.notFound")}
        </h2>
        <Button asChild variant="outline">
          <Link to="/admin/users">
            <BackIcon className="w-4 h-4 me-2" />
            {t("superAdmin.users.detail.backToUsers")}
          </Link>
        </Button>
      </div>
    );
  }

  const status = user.isActive ? "active" : "suspended";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-full">
            <Link to="/admin/users">
              <BackIcon className="w-5 h-5 text-neutral-500" />
            </Link>
          </Button>
          <Avatar className="h-16 w-16 border bg-neutral-100 text-neutral-600 font-medium text-lg">
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{user.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-neutral-500">{user.phoneNumber}</span>
              <StatusBadge status={status} kind="user" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-800">
                {t("superAdmin.users.detail.info")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))]">
                    {t("superAdmin.users.columns.phone")}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))]">
                    {user.phoneNumber}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))]">
                    {t("superAdmin.users.detail.email")}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))]">
                    {user.email || "—"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))]">
                    {t("superAdmin.users.columns.role")}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))]">
                    <Badge variant="outline" className="text-neutral-600">
                      {roleLabel(user.role, t)}
                    </Badge>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))]">
                    {t("superAdmin.users.detail.city")}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))]">
                    {user.city || "—"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))]">
                    {t("superAdmin.users.detail.address")}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))]">
                    {user.address || "—"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))]">
                    {t("superAdmin.users.detail.idenityNumber")}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))]">
                    {user.idenityNumber || "—"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))]">
                    {t("superAdmin.users.detail.createdAt")}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))]">
                    {formatDate(user.createdAt, i18n.language, { year: "numeric", month: "long", day: "numeric" })}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-800">
                {t("superAdmin.users.detail.actions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {status === "active" && (
                <Can permission="users.suspend">
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => setSuspendOpen(true)}
                  >
                    {t("superAdmin.users.suspend.title")}
                  </Button>
                </Can>
              )}
              {status === "suspended" && (
                <Can permission="users.restore">
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => setRestoreOpen(true)}
                  >
                    {t("superAdmin.users.restore.button")}
                  </Button>
                </Can>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {suspendOpen && (
        <SuspendUserDialog
          userId={user.id}
          userName={user.fullName}
          open={suspendOpen}
          onOpenChange={setSuspendOpen}
        />
      )}
      {restoreOpen && (
        <RestoreUserDialog
          userId={user.id}
          userName={user.fullName}
          open={restoreOpen}
          onOpenChange={setRestoreOpen}
        />
      )}
    </div>
  );
}
