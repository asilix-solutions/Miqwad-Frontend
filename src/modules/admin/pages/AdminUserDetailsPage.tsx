import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useUserQuery } from "../hooks/useAdminQueries";
import { SuspendUserDialog } from "../components/users/SuspendUserDialog";
import { RestoreUserDialog } from "../components/users/RestoreUserDialog";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success-100 text-success-700 hover:bg-success-200";
      case "suspended":
        return "bg-danger-100 text-danger-700 hover:bg-danger-200";
      case "pending":
        return "bg-warning-100 text-warning-700 hover:bg-warning-200";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

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
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-neutral-500">{user.phone}</span>
              <Badge variant="secondary" className={getStatusColor(user.status)}>
                {t(`superAdmin.users.status.${user.status}`)}
              </Badge>
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
                    {user.phone}
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
                      {t(`superAdmin.users.roles.${user.role}`)}
                    </Badge>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))]">
                    {t("superAdmin.users.detail.ordersCount")}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))]">
                    {user.ordersCount ?? "—"}
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
                <div className="space-y-1">
                  <dt className="text-sm text-[var(--color-muted,theme(colors.neutral.500))]">
                    {t("superAdmin.users.detail.lastActiveAt")}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--color-ink-body,theme(colors.neutral.900))]">
                    {formatDate(user.lastActiveAt, i18n.language, { year: "numeric", month: "long", day: "numeric" })}
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
              {(user.status === "active" || user.status === "pending") && (
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
              {user.status === "suspended" && (
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
              
              {/* Fallback if user doesn't have permissions or status is unknown */}
              {(user.status === "active" || user.status === "pending") && (
                <Can permission="users.suspend" fallback={null}>
                  <></>
                </Can>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {suspendOpen && (
        <SuspendUserDialog
          userId={user.id}
          userName={user.name}
          open={suspendOpen}
          onOpenChange={setSuspendOpen}
        />
      )}
      {restoreOpen && (
        <RestoreUserDialog
          userId={user.id}
          userName={user.name}
          open={restoreOpen}
          onOpenChange={setRestoreOpen}
        />
      )}
    </div>
  );
}
