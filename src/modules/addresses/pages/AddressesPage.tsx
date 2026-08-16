/**
 * @file AddressesPage.tsx
 * @description Admin Addresses list page — Phase 2 (spatial card grid).
 * Addresses are about WHERE, so each card leads with a mini-map thumbnail
 * instead of a plain table row. Supports title/shortNumber search, a
 * "filter by user" combobox (admin picks a name; internally sends
 * GET /api/Addresses?FilterBy=userId&FilterValue={numericId} — the
 * per-user `/api/Users/{userId}/addresses` endpoint is not implemented on
 * the backend), newest/oldest sort, and pagination. The user filter and
 * title search are mutually exclusive server-side (single FilterBy).
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPinOff, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { useUsersQuery } from "@modules/admin/hooks/useAdminQueries";
import { useAddressesList } from "../hooks/useAddressesQueries";
import type { Address } from "../types";
import { AddressCard } from "../components/AddressCard";
import { AddressFilters } from "../components/AddressFilters";
import { AddressFormDialog } from "../components/AddressFormDialog";
import { DeleteAddressDialog } from "../components/DeleteAddressDialog";
import { Can } from "@shared/auth/Can";

const PAGE_SIZE = 24;
const USERS_MAP_PAGE_SIZE = 100;

export function AddressesPage() {
  const { t } = useTranslation();

  const [pageNumber, setPageNumber] = useState(1);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sortDescending, setSortDescending] = useState(true);

  useEffect(() => {
    setPageNumber(1);
  }, [search, userId, sortDescending]);

  const q = useAddressesList({
    pageNumber,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt",
    sortDescending,
    filterBy: userId ? "userId" : search.trim() ? "title" : undefined,
    filterValue: userId ? userId : search.trim() || undefined,
  });
  const items = q.data?.items ?? [];
  const totalPages = q.data?.totalPages ?? 1;

  // Owner names for cards: the admin must never see a raw userId, only the
  // matching fullName from the loaded /api/Users list.
  const usersMapQuery = useUsersQuery({ page: 1, pageSize: USERS_MAP_PAGE_SIZE, includeAdmins: true });
  const userNameById = useMemo(
    () => new Map((usersMapQuery.data?.items ?? []).map((u) => [String(u.id), u.fullName])),
    [usersMapQuery.data],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  const openCreate = () => {
    setFormMode("create");
    setSelectedAddress(undefined);
    setFormOpen(true);
  };

  const openEdit = (address: Address) => {
    setFormMode("edit");
    setSelectedAddress(address);
    setFormOpen(true);
  };

  const openDelete = (address: Address) => {
    setAddressToDelete(address);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink-body)]">{t("addresses.title")}</h1>
          <p className="text-sm text-[var(--color-muted)]">{t("addresses.subtitle")}</p>
        </div>
        <Can permission="addresses.create">
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("addresses.add")}
          </Button>
        </Can>
      </div>

      <AddressFilters
        search={search}
        onSearchChange={setSearch}
        userId={userId}
        onUserIdChange={setUserId}
        sortDescending={sortDescending}
        onSortDescendingChange={setSortDescending}
      />

      {q.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[320px] rounded-[var(--radius-lg)]" />
          ))}
        </div>
      )}

      {!q.isLoading && q.isError && (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] py-16 text-center">
          <p className="text-sm text-[var(--color-muted)]">{t("addresses.error")}</p>
          <Button type="button" variant="outline" onClick={() => q.refetch()}>
            <RotateCw className="size-4" />
            {t("common.retry")}
          </Button>
        </div>
      )}

      {!q.isLoading && !q.isError && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] py-16 text-center">
          <MapPinOff className="size-10 text-[var(--color-muted)]" />
          <p className="text-sm font-medium text-[var(--color-ink-body)]">{t("addresses.emptyTitle")}</p>
          <p className="text-sm text-[var(--color-muted)]">{t("addresses.emptyDescription")}</p>
          <Can permission="addresses.create">
            <Button type="button" onClick={openCreate}>
              <Plus className="size-4" />
              {t("addresses.add")}
            </Button>
          </Can>
        </div>
      )}

      {!q.isLoading && !q.isError && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              ownerName={userNameById.get(String(address.userId))}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className={
                  pageNumber === 1
                    ? "pointer-events-none opacity-50 cursor-default gap-1 px-2.5"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.back")}
              >
                {t("common.back")}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm text-[var(--color-muted)]">
                {pageNumber} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                className={
                  pageNumber === totalPages
                    ? "pointer-events-none opacity-50 cursor-default gap-1 px-2.5"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.next")}
              >
                {t("common.next")}
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {formOpen && (
        <AddressFormDialog mode={formMode} address={selectedAddress} open={formOpen} onOpenChange={setFormOpen} />
      )}

      {deleteOpen && (
        <DeleteAddressDialog address={addressToDelete} open={deleteOpen} onOpenChange={setDeleteOpen} />
      )}
    </div>
  );
}
