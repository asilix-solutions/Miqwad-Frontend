/**
 * @file AddressFilters.tsx
 * @description Filter bar above the address card grid: title/shortNumber
 * search, a lightweight "filter by user" combobox (loads one user's
 * addresses via GET /api/Users/{userId}/addresses), and a newest/oldest
 * sort toggle. Reuses the searchable Combobox + real /api/Users lookup
 * already built for the attachments owner picker.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownAZ, ArrowUpAZ, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useUsersQuery } from "@modules/admin/hooks/useAdminQueries";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  userId: string | null;
  onUserIdChange: (value: string | null) => void;
  sortDescending: boolean;
  onSortDescendingChange: (value: boolean) => void;
}

export function AddressFilters({
  search,
  onSearchChange,
  userId,
  onUserIdChange,
  sortDescending,
  onSortDescendingChange,
}: Props) {
  const { t } = useTranslation();
  const [userSearch, setUserSearch] = useState("");
  const usersQuery = useUsersQuery({ page: 1, pageSize: 20, search: userSearch || undefined });

  const userOptions: ComboboxOption[] = useMemo(
    () =>
      (usersQuery.data?.items ?? []).map((u) => ({
        value: String(u.id),
        label: u.fullName,
        description: u.phoneNumber,
      })),
    [usersQuery.data],
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("addresses.filters.searchPlaceholder")}
          className="w-full sm:w-[220px]"
        />

        <div className="flex items-center gap-1">
          <Combobox
            options={userOptions}
            value={userId}
            onValueChange={onUserIdChange}
            onSearchChange={setUserSearch}
            loading={usersQuery.isLoading}
            placeholder={t("addresses.filters.filterByUser")}
            searchPlaceholder={t("addresses.filters.userSearchPlaceholder")}
            emptyText={t("addresses.filters.noUsers")}
            className="w-full sm:w-[220px]"
          />
          {userId && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={t("addresses.filters.clearUser")}
              onClick={() => onUserIdChange(null)}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onSortDescendingChange(!sortDescending)}
      >
        {sortDescending ? <ArrowDownAZ className="size-4" /> : <ArrowUpAZ className="size-4" />}
        {sortDescending ? t("addresses.filters.sort.newest") : t("addresses.filters.sort.oldest")}
      </Button>
    </div>
  );
}
