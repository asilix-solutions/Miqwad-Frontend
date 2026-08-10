/**
 * @file AttachmentsPage.tsx
 * @description Admin Attachments section shell. Two tabs:
 *  - "All Attachments": the original responsive grid/list of cards with
 *    client-side search/kind filters, driving the upload/replace/preview/
 *    delete dialogs.
 *  - "By User": master-detail view grouping the same fetched list by owner
 *    (`userName`), desktop side panel / mobile bottom sheet.
 * No review/approval UI — the backend has no status field for attachments today.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Paperclip, RotateCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttachmentCard } from "../components/AttachmentCard";
import { AttachmentFilters, type KindFilter, type ViewMode } from "../components/AttachmentFilters";
import { AttachmentUploadDialog } from "../components/AttachmentUploadDialog";
import { AttachmentPreviewDialog } from "../components/AttachmentPreviewDialog";
import { AttachmentDeleteDialog } from "../components/AttachmentDeleteDialog";
import { AttachmentUserListPanel } from "../components/AttachmentUserListPanel";
import { AttachmentUserDetailPanel } from "../components/AttachmentUserDetailPanel";
import { useAttachmentsList } from "../hooks/useAttachmentsQueries";
import { groupByUser, type UserAttachmentGroup } from "../lib/groupByUser";
import type { Attachment } from "../types";

export function AttachmentsPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError, refetch } = useAttachmentsList();

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<Attachment | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Attachment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);

  const [selectedUserKey, setSelectedUserKey] = useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // TODO: wire to backend — move search/kind filtering server-side once
  // `/api/attachments` supports query params.
  const filtered = useMemo(() => {
    const items = data ?? [];
    return items.filter((a) => {
      const matchesKind = kindFilter === "all" || a.fileKind === kindFilter;
      const matchesSearch =
        !search.trim() || a.originalFileName.toLowerCase().includes(search.trim().toLowerCase());
      return matchesKind && matchesSearch;
    });
  }, [data, kindFilter, search]);

  const userGroups = useMemo(
    () => groupByUser(data, t("attachments.owner.unknown")),
    [data, t],
  );
  const selectedGroup: UserAttachmentGroup | null =
    userGroups.find((g) => (g.userName ?? "__unknown__") === selectedUserKey) ?? null;

  const handleSelectUser = (group: UserAttachmentGroup) => {
    setSelectedUserKey(group.userName ?? "__unknown__");
    // The sheet is portaled to document.body (Radix Dialog), so the
    // `lg:hidden` wrapper around it cannot hide it via CSS on desktop —
    // only open it when we're actually below the `lg` breakpoint used to
    // switch between the inline panel and the sheet.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setMobileSheetOpen(true);
    }
  };

  const openReplace = (attachment: Attachment) => {
    setReplaceTarget(attachment);
    setUploadOpen(true);
  };

  const handleUploadOpenChange = (open: boolean) => {
    setUploadOpen(open);
    if (!open) setReplaceTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink-body)]">{t("attachments.title")}</h1>
          <p className="text-sm text-[var(--color-muted)]">{t("attachments.subtitle")}</p>
        </div>
        <Button type="button" onClick={() => setUploadOpen(true)}>
          <Upload className="size-4" />
          {t("attachments.upload.cta")}
        </Button>
      </div>

      <Tabs defaultValue="all" dir={i18n.dir()}>
        <TabsList className="h-auto w-fit justify-start gap-2 overflow-x-auto rounded-none bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="after:hidden rounded-full border-transparent px-4 py-2 text-[14px] font-medium text-[var(--color-muted)] transition-colors duration-150 data-[state=active]:bg-[var(--color-brand-orange)] data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-none hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)] dark:data-[state=active]:bg-[var(--color-brand-orange)] dark:data-[state=active]:text-white"
          >
            {t("attachments.tabs.all")}
          </TabsTrigger>
          <TabsTrigger
            value="byUser"
            className="after:hidden rounded-full border-transparent px-4 py-2 text-[14px] font-medium text-[var(--color-muted)] transition-colors duration-150 data-[state=active]:bg-[var(--color-brand-orange)] data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-none hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)] dark:data-[state=active]:bg-[var(--color-brand-orange)] dark:data-[state=active]:text-white"
          >
            {t("attachments.tabs.byUser")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <AttachmentFilters
            search={search}
            onSearchChange={setSearch}
            kindFilter={kindFilter}
            onKindFilterChange={setKindFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {isLoading && (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-3"
              }
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === "grid" ? "h-64 rounded-[var(--radius-lg)]" : "h-20 rounded-[var(--radius-md)]"} />
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] py-16 text-center">
              <p className="text-sm text-[var(--color-muted)]">{t("attachments.error")}</p>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                <RotateCw className="size-4" />
                {t("common.retry")}
              </Button>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] py-16 text-center">
              <Paperclip className="size-10 text-[var(--color-muted)]" />
              <p className="text-sm text-[var(--color-muted)]">
                {(data?.length ?? 0) === 0 ? t("attachments.empty") : t("attachments.emptyFiltered")}
              </p>
              {(data?.length ?? 0) === 0 && (
                <Button type="button" onClick={() => setUploadOpen(true)}>
                  <Upload className="size-4" />
                  {t("attachments.upload.firstCta")}
                </Button>
              )}
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-3"
              }
            >
              {filtered.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  variant={viewMode}
                  onPreview={setPreviewTarget}
                  onReplace={openReplace}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="byUser" className="space-y-6">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-[var(--radius-md)]" />
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] py-16 text-center">
              <p className="text-sm text-[var(--color-muted)]">{t("attachments.error")}</p>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                <RotateCw className="size-4" />
                {t("common.retry")}
              </Button>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
              <AttachmentUserListPanel
                groups={userGroups}
                selectedKey={selectedUserKey}
                onSelect={handleSelectUser}
              />

              <div className="hidden lg:block">
                <AttachmentUserDetailPanel
                  variant="panel"
                  group={selectedGroup}
                  onPreview={setPreviewTarget}
                  onReplace={openReplace}
                  onDelete={setDeleteTarget}
                />
              </div>

              <div className="lg:hidden">
                <AttachmentUserDetailPanel
                  variant="sheet"
                  open={mobileSheetOpen}
                  onOpenChange={setMobileSheetOpen}
                  group={selectedGroup}
                  onPreview={setPreviewTarget}
                  onReplace={openReplace}
                  onDelete={setDeleteTarget}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {uploadOpen && (
        <AttachmentUploadDialog open={uploadOpen} onOpenChange={handleUploadOpenChange} replaceTarget={replaceTarget} />
      )}
      {previewTarget && (
        <AttachmentPreviewDialog attachment={previewTarget} onOpenChange={(open) => !open && setPreviewTarget(null)} />
      )}
      {deleteTarget && (
        <AttachmentDeleteDialog attachment={deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} />
      )}
    </div>
  );
}
