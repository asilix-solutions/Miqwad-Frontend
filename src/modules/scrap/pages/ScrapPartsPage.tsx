/**
 * @file ScrapPartsPage.tsx
 *
 * Scrap parts catalog — card grid of the scrap provider's own priced
 * service offerings (`/api/provider-services`), caller-scoped by the
 * backend — no server-side filters, so search is a client-side filter over
 * the already-fetched list. Phase 1: functional grid + CRUD; the fancier
 * stats-strip / status-tabs treatment is deferred to Phase 2.
 */

import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderPageHeader, ProviderSearchBar } from "@shared/provider-ui";
import type { ProviderService } from "@shared/provider-services";
import { useScrapPartsQuery } from "../hooks/useScrapPartsQueries";
import { PartFormDialog } from "../components/PartFormDialog";
import { DeletePartDialog } from "../components/DeletePartDialog";
import { PartGrid } from "../components/PartGrid";
import { PartDetailDialog } from "../components/PartDetailDialog";

// ── Component ─────────────────────────────────────────────────────────────────

export function ScrapPartsPage() {
  const { t } = useTranslation();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // ── Server state ──────────────────────────────────────────────────────────
  const q = useScrapPartsQuery();

  const filteredParts = useMemo(() => {
    const items = q.data?.items ?? [];
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((p) => p.serviceName.toLowerCase().includes(query));
  }, [q.data, debouncedSearch]);

  // ── Dialog state: create/edit form ────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedPart, setSelectedPart] = useState<ProviderService | undefined>();

  // ── Dialog state: delete confirmation ────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<ProviderService | null>(null);

  // ── Dialog state: part detail ──────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPart, setDetailPart] = useState<ProviderService | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormMode("create");
    setSelectedPart(undefined);
    setFormOpen(true);
  };

  const openEdit = (part: ProviderService) => {
    setFormMode("edit");
    setSelectedPart(part);
    setFormOpen(true);
  };

  const openDelete = (part: ProviderService) => {
    setPartToDelete(part);
    setDeleteOpen(true);
  };

  const openDetail = (part: ProviderService) => {
    setDetailPart(part);
    setDetailOpen(true);
  };

  // Detail dialog actions: close detail first, then open the respective dialog.
  const handleDetailEdit = (part: ProviderService) => {
    setDetailOpen(false);
    openEdit(part);
  };

  const handleDetailDelete = (part: ProviderService) => {
    setDetailOpen(false);
    openDelete(part);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header ──────────────────────────────────────────────────────── */}
      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<Package className="h-5 w-5" aria-hidden />}
          title={t("scrap.parts.title")}
          subtitle={t("scrap.parts.subtitle")}
          actions={
            <Button onClick={openCreate}>
              <Plus className="me-2 h-4 w-4" aria-hidden />
              {t("scrap.parts.addBtn")}
            </Button>
          }
        />
      </div>

      {/* Search ──────────────────────────────────────────────────────────── */}
      <div className="provider-fade-up" style={{ animationDelay: "40ms" }}>
        <ProviderSearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder={t("scrap.parts.search")}
          className="sm:max-w-xs"
        />
      </div>

      {/* Grid ────────────────────────────────────────────────────────────── */}
      <div className="provider-fade-up" style={{ animationDelay: "80ms" }}>
        <PartGrid
          parts={filteredParts}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => { void q.refetch(); }}
          onEdit={openEdit}
          onDelete={openDelete}
          onCardClick={openDetail}
          onAddPart={openCreate}
        />
      </div>

      {/* Deferred-mount dialogs ───────────────────────────────────────────── */}
      {formOpen && (
        <PartFormDialog mode={formMode} part={selectedPart} open={formOpen} onOpenChange={setFormOpen} />
      )}

      {deleteOpen && (
        <DeletePartDialog part={partToDelete} open={deleteOpen} onOpenChange={setDeleteOpen} />
      )}

      {detailOpen && detailPart && (
        <PartDetailDialog
          part={detailPart}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onEdit={handleDetailEdit}
          onDelete={handleDetailDelete}
        />
      )}
    </div>
  );
}
