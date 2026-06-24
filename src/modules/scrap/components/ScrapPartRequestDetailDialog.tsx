/**
 * @file ScrapPartRequestDetailDialog.tsx
 *
 * Dialog wrapper for the part request detail view.
 * Renders PartRequestDetailContent inside a ProviderDialog (blurBackdrop, size lg).
 * Defer-mount by calling this inside {selectedId && <ScrapPartRequestDetailDialog />}.
 */

import { useTranslation } from "react-i18next";
import { ProviderDialog } from "@shared/provider-ui";
import { PartRequestDetailContent } from "./PartRequestDetailContent";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapPartRequestDetailDialogProps {
  requestId: string;
  open: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Part request detail dialog — opens from the list page without leaving context. */
export function ScrapPartRequestDetailDialog({
  requestId,
  open,
  onClose,
}: ScrapPartRequestDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <ProviderDialog
      open={open}
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={t("scrap.partRequests.detailTitle")}
      size="lg"
      blurBackdrop
    >
      <PartRequestDetailContent requestId={requestId} />
    </ProviderDialog>
  );
}
