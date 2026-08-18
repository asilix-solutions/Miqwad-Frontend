/**
 * @file ProviderAddressesSection.tsx
 *
 * Provider-styled addresses card for {@link ProviderAccountPage}. Lists the
 * signed-in provider's own addresses (server-side `FilterBy=userId` — the
 * only scoping the real `/api/Addresses` endpoint supports, see
 * `AddressesPage.tsx`), with an "add address" action and inline
 * create/edit/delete via the reused addresses module hooks.
 *
 * Purely additive: does not touch `src/modules/addresses/*` beyond importing
 * its reusable hooks/schema/api/map picker.
 */
import { useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Plus, Loader2 } from "lucide-react";
import { useToast } from "@shared/components/ui/toastContext";
import { ProviderCard, ProviderSkeleton, ProviderEmptyState, ProviderDialog } from "@shared/provider-ui";
import { useAppSelector } from "@app/store";
import { useAddressesList, useDeleteAddress } from "@modules/addresses/hooks/useAddressesQueries";
import type { Address } from "@modules/addresses/types";
import { ProviderAddressCard } from "./ProviderAddressCard";
import { ProviderAddressDialog } from "./ProviderAddressDialog";

interface ProviderAddressesSectionProps {
  style?: CSSProperties;
}

export function ProviderAddressesSection({ style }: ProviderAddressesSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const userId = useAppSelector((state) => state.auth.user?.id);

  const addressesQuery = useAddressesList(userId ? { filterBy: "userId", filterValue: userId } : {});
  const deleteMutation = useDeleteAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>();
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  const openCreate = () => {
    setDialogMode("create");
    setSelectedAddress(undefined);
    setDialogOpen(true);
  };

  const openEdit = (address: Address) => {
    setDialogMode("edit");
    setSelectedAddress(address);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      await deleteMutation.mutateAsync(addressToDelete.id);
      toast.success(t("accountProfile.addresses.deleteSuccess"));
      setAddressToDelete(null);
    } catch {
      toast.error(t("accountProfile.addresses.deleteFailed"));
    }
  };

  const items = addressesQuery.data?.items ?? [];

  return (
    <ProviderCard interactive style={style}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink-body)]">
          {t("accountProfile.addresses.sectionTitle")}
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-brand-orange)] px-3 text-xs font-semibold text-white shadow-[var(--shadow-provider-sm)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-brand-orange-hover,#E3460F)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("accountProfile.addresses.add")}
        </button>
      </div>

      {addressesQuery.isLoading ? (
        <div className="space-y-3">
          <ProviderSkeleton variant="block" height={72} />
          <ProviderSkeleton variant="block" height={72} />
        </div>
      ) : addressesQuery.isError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-[var(--color-muted)]">{t("addresses.error")}</p>
          <button
            type="button"
            onClick={() => void addressesQuery.refetch()}
            className="text-sm font-medium text-[var(--color-brand-orange)] hover:underline"
          >
            {t("common.errorRetry")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <ProviderEmptyState
          icon={<MapPin className="h-8 w-8" aria-hidden />}
          title={t("accountProfile.addresses.emptyTitle")}
          description={t("accountProfile.addresses.emptyDescription")}
          action={
            <button
              type="button"
              onClick={openCreate}
              className="flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-orange)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-provider-sm)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-brand-orange-hover,#E3460F)]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("accountProfile.addresses.add")}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((address) => (
            <ProviderAddressCard
              key={address.id}
              address={address}
              onEdit={openEdit}
              onDelete={setAddressToDelete}
            />
          ))}
        </div>
      )}

      {dialogOpen && (
        <ProviderAddressDialog
          mode={dialogMode}
          address={selectedAddress}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}

      {addressToDelete && (
        <ProviderDialog
          open={!!addressToDelete}
          onOpenChange={(open) => !open && !deleteMutation.isPending && setAddressToDelete(null)}
          title={t("accountProfile.addresses.deleteConfirmTitle")}
          description={t("addresses.deleteConfirm.description", { name: addressToDelete.title })}
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                disabled={deleteMutation.isPending}
                className="flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-ink-body)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleteMutation.isPending}
                className="flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-danger-500)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-provider-sm)] transition-colors duration-[var(--dur-fast)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {t("accountProfile.addresses.deleteConfirm")}
              </button>
            </>
          }
        >
          <p className="sr-only">{t("accountProfile.addresses.deleteConfirmTitle")}</p>
        </ProviderDialog>
      )}
    </ProviderCard>
  );
}
