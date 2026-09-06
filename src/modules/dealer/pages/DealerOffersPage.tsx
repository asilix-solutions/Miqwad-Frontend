/**
 * @file DealerOffersPage.tsx
 *
 * Dealer offers list — READ-ONLY (Stage 1 of a staged build).
 *
 * `GET /api/Offers` is token-scoped, so every row belongs to the logged-in
 * dealer — no client-side owner filter. Search is a client-side filter over
 * the fetched page (offer title + any line's service name). Pagination uses
 * the same inline prev/next pattern as `DealerOrdersPage` (there is no shared
 * pagination component in the codebase yet).
 *
 * Stage 3 adds the write path: a "Create offer" CTA in the header and the
 * empty state, plus per-card Edit / Delete that open the shared
 * `OfferFormDialog` / `DeleteOfferDialog` (both defer-mounted).
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BadgePercent, Plus, Tag } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderSearchBar,
  ProviderEmptyState,
  ProviderSkeleton,
  ProviderCard,
} from "@shared/provider-ui";
import { Button } from "@/components/ui/button";
import { useMyOffers } from "../hooks/useOfferQueries";
import { OfferCard } from "../components/OfferCard";
import { OfferFormDialog } from "../components/OfferFormDialog";
import { DeleteOfferDialog } from "../components/DeleteOfferDialog";
import type { Offer } from "../types";

const PAGE_SIZE = 20;
const STAGGER_CAP = 12;

function OfferCardSkeleton() {
  return (
    <ProviderCard className="flex flex-col gap-3">
      <ProviderSkeleton width="60%" />
      <ProviderSkeleton width="45%" />
      <div className="border-t border-[var(--color-divider)] pt-3">
        <ProviderSkeleton width="70%" />
      </div>
      <ProviderSkeleton width="35%" />
    </ProviderCard>
  );
}

export function DealerOffersPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  const q = useMyOffers({ pageNumber, pageSize: PAGE_SIZE });
  const totalPages = q.data?.totalPages ?? 1;

  // Stable "now" for the whole render so every card derives the same status.
  const now = useMemo(() => new Date(), [q.dataUpdatedAt]);

  const filteredOffers = useMemo(() => {
    const items = q.data?.items ?? [];
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((offer) => {
      const inTitle = (offer.title ?? "").toLowerCase().includes(query);
      const inService = offer.items.some((it) =>
        (it.serviceName ?? "").toLowerCase().includes(query),
      );
      return inTitle || inService;
    });
  }, [q.data, debouncedSearch]);

  return (
    <div className="space-y-6">
      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<BadgePercent className="h-5 w-5" aria-hidden />}
          title={t("dealer.offers.title")}
          subtitle={t("dealer.offers.subtitle")}
          actions={
            <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              {t("dealer.offers.createCta")}
            </Button>
          }
        />
      </div>

      <div className="provider-fade-up" style={{ animationDelay: "40ms" }}>
        <ProviderSearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder={t("dealer.offers.search")}
          className="sm:max-w-xs"
        />
      </div>

      <div className="provider-fade-up space-y-4" style={{ animationDelay: "80ms" }}>
        {q.isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <OfferCardSkeleton key={i} />
            ))}
          </div>
        ) : q.isError ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-[var(--color-muted)]">{t("dealer.offers.errorTitle")}</p>
            <Button variant="outline" size="sm" onClick={() => { void q.refetch(); }}>
              {t("common.retry")}
            </Button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <ProviderEmptyState
            icon={<Tag className="h-8 w-8" aria-hidden />}
            title={
              debouncedSearch.trim()
                ? t("dealer.offers.noResultsTitle")
                : t("dealer.offers.emptyTitle")
            }
            description={
              debouncedSearch.trim()
                ? t("dealer.offers.noResultsDescription")
                : t("dealer.offers.emptyDescription")
            }
            action={
              debouncedSearch.trim() ? undefined : (
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden />
                  {t("dealer.offers.createCta")}
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredOffers.map((offer, index) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                now={now}
                onEdit={setEditOffer}
                onDelete={setDeleteTarget}
                style={{ animationDelay: `${Math.min(index, STAGGER_CAP) * 50}ms` }}
              />
            ))}
          </div>
        )}

        {!q.isError && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 text-sm text-[var(--color-muted)]">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="rounded-[var(--radius-sm)] px-3 py-1.5 font-medium text-[var(--color-ink-body)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-40"
            >
              {t("common.back")}
            </button>
            <span className="tabular-nums">
              {pageNumber} / {totalPages}
            </span>
            <button
              type="button"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              className="rounded-[var(--radius-sm)] px-3 py-1.5 font-medium text-[var(--color-ink-body)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-40"
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </div>

      {createOpen && (
        <OfferFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
      )}
      {editOffer && (
        <OfferFormDialog
          mode="edit"
          offer={editOffer}
          open={!!editOffer}
          onOpenChange={(o) => !o && setEditOffer(null)}
        />
      )}
      {deleteTarget && (
        <DeleteOfferDialog
          offer={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
