/**
 * @file AttachmentCard.tsx
 * @description Single attachment card — inline thumbnail for images, a
 * lucide icon per file kind otherwise, plus row actions (preview, replace,
 * delete). Renders as a compact row when `variant="list"`. The `compact`
 * prop shrinks the `variant="grid"` card (smaller preview zone, tighter
 * padding) for use inside the "By User" detail panel, without affecting
 * the "All Attachments" grid.
 */
import { FileText, File as FileIcon, Image as ImageIcon, Eye, RefreshCw, Trash2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@shared/lib/utils";
import { formatFileSize } from "../lib/attachmentAdapter";
import { formatRelativeDate } from "../lib/formatRelativeDate";
import type { Attachment, AttachmentFileKind } from "../types";

const KIND_ICON: Record<AttachmentFileKind, typeof FileText> = {
  image: ImageIcon,
  pdf: FileText,
  doc: FileText,
  other: FileIcon,
};

interface AttachmentCardProps {
  attachment: Attachment;
  variant: "grid" | "list";
  compact?: boolean;
  onPreview: (attachment: Attachment) => void;
  onReplace: (attachment: Attachment) => void;
  onDelete: (attachment: Attachment) => void;
}

export function AttachmentCard({ attachment, variant, compact = false, onPreview, onReplace, onDelete }: AttachmentCardProps) {
  const { t, i18n } = useTranslation();
  const Icon = KIND_ICON[attachment.fileKind];

  const ownerLine = (
    <div className="flex min-w-0 items-center gap-1 text-xs text-[var(--color-muted)]">
      <User className="size-3 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-start">
        {attachment.userName ?? t("attachments.owner.unknown")}
      </span>
    </div>
  );

  const thumbnail =
    attachment.fileKind === "image" ? (
      <img
        src={attachment.filePath}
        alt={attachment.originalFileName}
        className="h-full w-full object-cover"
      />
    ) : (
      <Icon className={compact ? "size-5 text-[var(--color-brand-blue)]" : "size-8 text-[var(--color-brand-blue)]"} />
    );

  const actions = (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title={t("attachments.actions.preview")}
        onClick={() => onPreview(attachment)}
      >
        <Eye className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title={t("attachments.actions.replace")}
        onClick={() => onReplace(attachment)}
      >
        <RefreshCw className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title={t("attachments.actions.delete")}
        onClick={() => onDelete(attachment)}
      >
        <Trash2 className="size-4 text-danger-500" />
      </Button>
    </div>
  );

  if (variant === "list") {
    return (
      <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3 transition-shadow hover:shadow-[var(--shadow-2)]">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]">
          {thumbnail}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-ink-body)]" title={attachment.originalFileName}>
            {attachment.originalFileName}
          </p>
          {ownerLine}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
            <span>{formatFileSize(attachment.fileSize)}</span>
            <span>·</span>
            <span>{formatRelativeDate(attachment.createdAt, i18n.language)}</span>
          </div>
        </div>
        <Badge tone="info" size="sm">
          {t(`attachments.fileKinds.${attachment.fileKind}`)}
        </Badge>
        {actions}
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-[var(--shadow-2)] transition-shadow hover:shadow-lg">
      <div
        className={cn(
          "flex items-center justify-center bg-[var(--color-surface-2)]",
          compact ? "h-16" : "h-36",
          attachment.fileKind !== "image" && "text-[var(--color-brand-blue)]",
        )}
      >
        {thumbnail}
      </div>
      <div className={cn("flex flex-1 flex-col", compact ? "gap-1 p-2" : "gap-2 p-4")}>
        <p className="truncate text-sm font-semibold text-[var(--color-ink-body)]" title={attachment.originalFileName}>
          {attachment.originalFileName}
        </p>
        {ownerLine}
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span>{formatFileSize(attachment.fileSize)}</span>
          <span>·</span>
          <span>{formatRelativeDate(attachment.createdAt, i18n.language)}</span>
        </div>
        <Badge tone="info" size="sm" className="w-fit">
          {t(`attachments.fileKinds.${attachment.fileKind}`)}
        </Badge>
        <div
          className={cn(
            "mt-auto flex items-center justify-end border-t border-[var(--color-divider)]",
            compact ? "pt-1" : "pt-2",
          )}
        >
          {actions}
        </div>
      </div>
    </div>
  );
}
