import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Plus, Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@app/store";
import { setServicesSearch } from "../store/providersSlice";
import { useProviderServicesQuery } from "../hooks/useProviderQueries";
import { useDeleteProviderServiceMutation } from "../hooks/useProviderMutations";
import { ProviderServiceCard } from "../components/ProviderServiceCard";
import { ProviderStatusBanner } from "../components/ProviderStatusBanner";
import { useToast } from "@shared/components/ui/toastContext";

/**
 * /provider/services — listing of the provider's own services with
 * add / edit / delete + search.
 *
 * Behaviour:
 *  - Pending or rejected providers are bounced to the pending screen
 *    so they can't manage services until they're approved.
 *  - Search filter is cached in Redux so leaving and coming back
 *    preserves it.
 */
export function ProviderServicesPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const search = useAppSelector((s) => s.providers.servicesSearch);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const providerId = user?.providerId ?? 0;
  const q = useProviderServicesQuery(providerId);
  const deleteMutation = useDeleteProviderServiceMutation(providerId);

  if (!user || user.role !== "provider") {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (user.providerStatus !== "approved") {
    return <Navigate to="/provider/pending" replace />;
  }

  const filtered = (q.data ?? []).filter((s) =>
    s.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  const handleConfirmDelete = async () => {
    if (pendingDelete == null) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete);
      toast.success(t("providers.services.deletedToast"));
    } catch {
      toast.error(t("providers.services.deleteFailed"));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + add button — stacks on mobile, side-by-side on sm+ */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
            {t("providers.services.title")}
          </h1>
          <p className="text-sm text-ink-500 mt-1">{t("providers.services.subtitle")}</p>
        </div>
        <Button onClick={() => navigate("/provider/services/add")}>
          <Plus className="h-4 w-4" />
          {t("providers.services.addNew")}
        </Button>
      </header>

      <ProviderStatusBanner status="approved" />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <Input
          value={search}
          onChange={(e) => dispatch(setServicesSearch(e.target.value))}
          placeholder={t("common.search")}
          className="ps-9"
        />
      </div>

      {/* Body */}
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-6 w-6 text-ink-500" />}
          title={t("providers.services.empty")}
          description={t("providers.services.emptyDescription")}
          action={
            <Button asChild>
              <Link to="/provider/services/add">
                <Plus className="h-4 w-4" />
                {t("providers.services.addNew")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <ProviderServiceCard
              key={s.id}
              service={s}
              onDelete={(id) => setPendingDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={pendingDelete != null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("providers.services.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("providers.services.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleteMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.loading") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProviderServicesPage;
